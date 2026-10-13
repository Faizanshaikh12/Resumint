import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import { setupTestDatabase } from "../helpers/setup-db";
import { createAuth } from "~/auth/auth.server";
import { getSession, requireUser, requireGuest } from "~/auth/helpers.server";

describe("Better Auth & Session Lifecycle (Worker Integration)", () => {
  beforeAll(async () => {
    process.on("unhandledRejection", (err) => {
      // Suppress internal Better Auth APIError rejections during negative testing
    });
    await setupTestDatabase(env);
  });

  it("successfully signs up a new user and generates an active token", async () => {
    const auth = createAuth(env);
    const email = `test-${Date.now()}@resumint.dev`;

    const res = await auth.api.signUpEmail({
      body: {
        name: "Test Engineer",
        email,
        password: "SuperSecretPassword123!",
      },
    });

    expect(res).toBeDefined();
    expect(res.user).toBeDefined();
    expect(res.user.email).toBe(email);
    expect(res.user.name).toBe("Test Engineer");
    expect(res.token).toBeDefined();

    // Verify password is NOT exposed in the returned user object
    expect((res.user as Record<string, unknown>).password).toBeUndefined();
  });

  it("rejects signup with duplicate email address", async () => {
    const auth = createAuth(env);
    const email = `dup-${Date.now()}@resumint.dev`;

    await auth.api.signUpEmail({
      body: {
        name: "First User",
        email,
        password: "ValidPassword123!",
      },
    });

    const dupRes = await auth.api.signUpEmail({
      body: {
        name: "Second User",
        email,
        password: "ValidPassword123!",
      },
      asResponse: true,
    });

    expect(dupRes.status).toBeGreaterThanOrEqual(400);
  });

  it("authenticates valid credentials on signInEmail and rejects incorrect password with generic error", async () => {
    const auth = createAuth(env);
    const email = `signin-${Date.now()}@resumint.dev`;
    const password = "ValidCredentials123!";

    await auth.api.signUpEmail({
      body: {
        name: "SignIn Tester",
        email,
        password,
      },
    });

    // Valid sign in
    const signInRes = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });

    expect(signInRes.user).toBeDefined();
    expect(signInRes.user.email).toBe(email);
    expect(signInRes.token).toBeDefined();

    // Invalid password must return 401 with generic error
    const invalidRes = await auth.api.signInEmail({
      body: {
        email,
        password: "WrongPassword!",
      },
      asResponse: true,
    });

    expect(invalidRes.status).toBe(401);
  });

  it("verifies session via getSession and invalidates on signOut", async () => {
    const auth = createAuth(env);
    const email = `session-${Date.now()}@resumint.dev`;
    const password = "ValidCredentials123!";

    // Direct HTTP request to /api/auth/sign-up/email to receive Set-Cookie headers
    const signupRequest = new Request("http://localhost:5173/api/auth/sign-up/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:5173",
      },
      body: JSON.stringify({
        name: "Cookie Tester",
        email,
        password,
      }),
    });

    const signupResponse = await auth.handler(signupRequest);
    expect(signupResponse.status).toBe(200);

    const cookieHeader = signupResponse.headers.get("set-cookie");
    expect(cookieHeader).toBeDefined();
    expect(cookieHeader).toContain("resumint.session_token=");

    // Extract cookie value for subsequent requests
    const cookie = cookieHeader!.split(";")[0]!;

    const authenticatedReq = new Request("http://localhost:5173/dashboard", {
      headers: {
        Cookie: cookie,
      },
    });

    // getSession succeeds
    const session = await getSession(authenticatedReq, env);
    expect(session).not.toBeNull();
    expect(session?.user.email).toBe(email);

    // requireUser succeeds
    const user = await requireUser(authenticatedReq, env);
    expect(user.email).toBe(email);

    // requireGuest throws redirect away from login
    await expect(requireGuest(authenticatedReq, env)).rejects.toThrow();

    // Now sign out using the session cookie
    const signOutReq = new Request("http://localhost:5173/api/auth/sign-out", {
      method: "POST",
      headers: {
        Cookie: cookie,
        Origin: "http://localhost:5173",
      },
    });

    const signOutRes = await auth.handler(signOutReq);
    expect(signOutRes.status).toBe(200);

    // Re-checking session with old cookie must now return null
    const sessionAfterLogout = await getSession(authenticatedReq, env);
    expect(sessionAfterLogout).toBeNull();
  });

  it("requireUser redirects unauthenticated requests with safe redirectTo target", async () => {
    const unauthReq = new Request("http://localhost:5173/resumes/new?template=executive");

    try {
      await requireUser(unauthReq, env);
      expect.fail("Should have thrown redirect");
    } catch (response: any) {
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(302);
      const location = response.headers.get("Location");
      expect(location).toBe(
        `/login?redirectTo=${encodeURIComponent("/resumes/new?template=executive")}`
      );
    }
  });

  it("triggers 429 when rate limit threshold is exceeded", async () => {
    const auth = createAuth(env);

    let hitRateLimit = false;
    for (let i = 0; i < 20; i++) {
      const req = new Request("http://localhost:5173/api/auth/sign-in/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:5173",
          "cf-connecting-ip": "203.0.113.195",
        },
        body: JSON.stringify({
          email: "rate-limit-tester@resumint.dev",
          password: "bad-password-attempt",
        }),
      });

      const res = await auth.handler(req);
      if (res.status === 429) {
        hitRateLimit = true;
        break;
      }
    }

    expect(hitRateLimit).toBe(true);
  });

  it("rejects expired session tokens and returns null", async () => {
    // Manually insert an expired session in D1
    const expiredToken = "expired_token_mock_test";
    const pastDate = new Date(Date.now() - 3600 * 1000); // 1 hour ago

    // Query D1 directly to inject expired session for existing user
    const db = (await import("~/db/client")).getDb(env);
    const schema = await import("~/db/schema");

    const [testUser] = await db
      .insert(schema.user)
      .values({
        id: `user-expired-${Date.now()}`,
        name: "Expired Session User",
        email: `expired-${Date.now()}@resumint.dev`,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    await db.insert(schema.session).values({
      id: `sess-expired-${Date.now()}`,
      userId: testUser!.id,
      token: expiredToken,
      expiresAt: pastDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const expiredReq = new Request("http://localhost:5173/dashboard", {
      headers: {
        Cookie: `resumint.session_token=${expiredToken}`,
      },
    });

    const session = await getSession(expiredReq, env);
    expect(session).toBeNull();
  });

  it("ensures sensitive secrets (password hashes, raw tokens) are never exposed on AuthUser", async () => {
    const auth = createAuth(env);
    const email = `safe-user-${Date.now()}@resumint.dev`;

    const res = await auth.api.signUpEmail({
      body: {
        name: "Security Tester",
        email,
        password: "SuperSecret123Password!",
      },
    });

    expect(res.user).toBeDefined();
    const userKeys = Object.keys(res.user);
    expect(userKeys).not.toContain("password");
    expect(userKeys).not.toContain("passwordHash");
    expect(userKeys).not.toContain("hashedPassword");
    expect(userKeys).not.toContain("token");

    const req = new Request("http://localhost:5173/api/auth/sign-in/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:5173",
      },
      body: JSON.stringify({
        email,
        password: "SuperSecret123Password!",
      }),
    });

    const authRes = await auth.handler(req);
    const cookieHeader = authRes.headers.get("set-cookie")!;
    const cookie = cookieHeader.split(";")[0]!;

    const sessionReq = new Request("http://localhost:5173/dashboard", {
      headers: { Cookie: cookie },
    });

    const user = await requireUser(sessionReq, env);
    const exposedKeys = Object.keys(user);
    expect(exposedKeys).toEqual(
      expect.arrayContaining(["id", "email", "name", "emailVerified"])
    );
    expect(exposedKeys).not.toContain("password");
    expect(exposedKeys).not.toContain("token");
    expect(exposedKeys).not.toContain("passwordHash");
  });
});
