import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import { setupTestDatabase } from "../helpers/setup-db";
import { createAuth } from "~/auth/auth.server";
import { loader as editLoader, action as editAction } from "~/routes/resumes.$id.edit";
import { createResume, getResume } from "~/db/queries/resumes";
import { createTestDb } from "../helpers/factories";
import { createDefaultContent } from "~/lib/resume/defaults";

async function createAuthenticatedUser(email: string, name = "Test User") {
  const auth = createAuth(env);
  const signupReq = new Request("http://localhost:5173/api/auth/sign-up/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:5173",
    },
    body: JSON.stringify({
      name,
      email,
      password: "SuperSecretPassword123!",
    }),
  });

  const signupRes = await auth.handler(signupReq);
  const cookie = signupRes.headers.get("set-cookie") || "";
  const data = (await signupRes.json()) as { user: { id: string; email: string; name: string } };

  return { user: data.user, cookie };
}

describe("Resume Editor Route (Worker Integration)", () => {
  beforeAll(async () => {
    process.on("unhandledRejection", () => {});
    await setupTestDatabase(env);
  });

  it("loader returns resume details for owner", async () => {
    const db = createTestDb(env);
    const { user, cookie } = await createAuthenticatedUser("editor-owner@example.com");
    const resume = await createResume(db, user.id, { title: "Owner Resume" });

    const req = new Request(`http://localhost:5173/resumes/${resume.id}/edit`, {
      headers: { Cookie: cookie },
    });

    const data = await editLoader({
      request: req,
      params: { id: resume.id },
      context: { cloudflare: { env } },
    } as any);

    expect(data.resume.id).toBe(resume.id);
    expect(data.resume.title).toBe("Owner Resume");
    expect(data.resume.version).toBe(1);
    expect(data.resume.content).toBeDefined();
    expect(data.resume.design).toBeDefined();
  });

  it("loader returns 404 for unowned or nonexistent resume (never 403)", async () => {
    const db = createTestDb(env);
    const { user: userA } = await createAuthenticatedUser("user-a@example.com");
    const { cookie: cookieB } = await createAuthenticatedUser("user-b@example.com");

    const resumeA = await createResume(db, userA.id, { title: "User A Resume" });

    // User B tries to load User A's resume
    const req = new Request(`http://localhost:5173/resumes/${resumeA.id}/edit`, {
      headers: { Cookie: cookieB },
    });

    try {
      await editLoader({
        request: req,
        params: { id: resumeA.id },
        context: { cloudflare: { env } },
      } as any);
      expect.unreachable("Should throw 404");
    } catch (response) {
      expect(response).toBeInstanceOf(Response);
      expect((response as Response).status).toBe(404);
    }
  });

  it("save action bumps version and updates content with optimistic concurrency", async () => {
    const db = createTestDb(env);
    const { user, cookie } = await createAuthenticatedUser("save-success@example.com");
    const resume = await createResume(db, user.id, { title: "Initial Resume" });

    const updatedContent = createDefaultContent();
    updatedContent.personal.name = "Updated Engineer";

    const req = new Request(`http://localhost:5173/resumes/${resume.id}/edit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:5173",
        Cookie: cookie,
      },
      body: JSON.stringify({
        intent: "save",
        expectedVersion: 1,
        content: updatedContent,
      }),
    });

    const res = await editAction({
      request: req,
      params: { id: resume.id },
      context: { cloudflare: { env } },
    } as any);

    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.ok).toBe(true);
    expect(json.version).toBe(2);

    // Verify database row
    const fresh = await getResume(db, user.id, resume.id);
    expect(fresh?.version).toBe(2);
    expect((fresh?.content as any).personal.name).toBe("Updated Engineer");
  });

  it("stale expectedVersion returns 409 conflict and prevents DB write", async () => {
    const db = createTestDb(env);
    const { user, cookie } = await createAuthenticatedUser("conflict-test@example.com");
    const resume = await createResume(db, user.id, { title: "Conflict Test" });

    // First save: bumps to version 2
    const content1 = createDefaultContent();
    content1.personal.name = "Version 2 Change";

    const req1 = new Request(`http://localhost:5173/resumes/${resume.id}/edit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:5173",
        Cookie: cookie,
      },
      body: JSON.stringify({
        intent: "save",
        expectedVersion: 1,
        content: content1,
      }),
    });
    const res1 = await editAction({
      request: req1,
      params: { id: resume.id },
      context: { cloudflare: { env } },
    } as any);
    expect(res1.status).toBe(200);

    // Second save with STALE expectedVersion 1 (current is 2)
    const content2 = createDefaultContent();
    content2.personal.name = "Stale Change";

    const req2 = new Request(`http://localhost:5173/resumes/${resume.id}/edit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:5173",
        Cookie: cookie,
      },
      body: JSON.stringify({
        intent: "save",
        expectedVersion: 1,
        content: content2,
      }),
    });

    const res2 = await editAction({
      request: req2,
      params: { id: resume.id },
      context: { cloudflare: { env } },
    } as any);

    expect(res2.status).toBe(409);
    const json2 = (await res2.json()) as any;
    expect(json2.ok).toBe(false);
    expect(json2.reason).toBe("conflict");
    expect(json2.serverVersion).toBe(2);

    // Database still has Version 2
    const fresh = await getResume(db, user.id, resume.id);
    expect(fresh?.version).toBe(2);
    expect((fresh?.content as any).personal.name).toBe("Version 2 Change");
  });

  it("two concurrent saves: exactly one wins", async () => {
    const db = createTestDb(env);
    const { user, cookie } = await createAuthenticatedUser("concurrent-save@example.com");
    const resume = await createResume(db, user.id, { title: "Concurrent Test" });

    const cA = createDefaultContent();
    cA.personal.name = "Concurrent A";

    const cB = createDefaultContent();
    cB.personal.name = "Concurrent B";

    const makeReq = (c: any) =>
      new Request(`http://localhost:5173/resumes/${resume.id}/edit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:5173",
          Cookie: cookie,
        },
        body: JSON.stringify({
          intent: "save",
          expectedVersion: 1,
          content: c,
        }),
      });

    const [resA, resB] = await Promise.all([
      editAction({
        request: makeReq(cA),
        params: { id: resume.id },
        context: { cloudflare: { env } },
      } as any),
      editAction({
        request: makeReq(cB),
        params: { id: resume.id },
        context: { cloudflare: { env } },
      } as any),
    ]);

    const statuses = [resA.status, resB.status];
    expect(statuses).toContain(200);
    expect(statuses).toContain(409);

    const fresh = await getResume(db, user.id, resume.id);
    expect(fresh?.version).toBe(2);
  });

  it("oversize payload exceeds 200 KB cap and is rejected with 413", async () => {
    const db = createTestDb(env);
    const { user, cookie } = await createAuthenticatedUser("oversize-test@example.com");
    const resume = await createResume(db, user.id, { title: "Oversize Test" });

    // Construct huge payload > 205 KB
    const hugeContent = createDefaultContent();
    hugeContent.summary = "A".repeat(210000);

    const req = new Request(`http://localhost:5173/resumes/${resume.id}/edit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:5173",
        Cookie: cookie,
      },
      body: JSON.stringify({
        intent: "save",
        expectedVersion: 1,
        content: hugeContent,
      }),
    });

    const res = await editAction({
      request: req,
      params: { id: resume.id },
      context: { cloudflare: { env } },
    } as any);

    expect(res.status).toBe(413);
    const json = (await res.json()) as any;
    expect(json.ok).toBe(false);
    expect(json.error).toContain("200 KB");
  });

  it("cross-origin POST is rejected with 403 CSRF", async () => {
    const db = createTestDb(env);
    const { user, cookie } = await createAuthenticatedUser("csrf-attack@example.com");
    const resume = await createResume(db, user.id, { title: "CSRF Test" });

    const req = new Request(`http://localhost:5173/resumes/${resume.id}/edit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://malicious-site.com",
        Cookie: cookie,
      },
      body: JSON.stringify({
        intent: "save",
        expectedVersion: 1,
        content: createDefaultContent(),
      }),
    });

    try {
      await editAction({
        request: req,
        params: { id: resume.id },
        context: { cloudflare: { env } },
      } as any);
      expect.unreachable("Should throw 403");
    } catch (response) {
      expect(response).toBeInstanceOf(Response);
      expect((response as Response).status).toBe(403);
    }
  });

  it("rename action updates title in database", async () => {
    const db = createTestDb(env);
    const { user, cookie } = await createAuthenticatedUser("rename-editor@example.com");
    const resume = await createResume(db, user.id, { title: "Original Name" });

    const req = new Request(`http://localhost:5173/resumes/${resume.id}/edit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:5173",
        Cookie: cookie,
      },
      body: JSON.stringify({
        intent: "rename",
        title: "Renamed In Editor",
      }),
    });

    const res = await editAction({
      request: req,
      params: { id: resume.id },
      context: { cloudflare: { env } },
    } as any);

    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.ok).toBe(true);
    expect(json.title).toBe("Renamed In Editor");

    const fresh = await getResume(db, user.id, resume.id);
    expect(fresh?.title).toBe("Renamed In Editor");
  });

  it("save action persists design with normalization and rejects invalid templateId", async () => {
    const db = createTestDb(env);
    const { user, cookie } = await createAuthenticatedUser("design-save@example.com");
    const resume = await createResume(db, user.id, { title: "Design Save Test" });

    const content = createDefaultContent();

    // 1. Valid design with out-of-range values is normalized
    const req1 = new Request(`http://localhost:5173/resumes/${resume.id}/edit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:5173",
        Cookie: cookie,
      },
      body: JSON.stringify({
        intent: "save",
        expectedVersion: 1,
        content,
        templateId: "classic", // Classic only supports single column
        design: {
          accentColor: "#059669",
          fontScale: 2.0, // should clamp to 1.25
          columns: 2, // should force to 1 for classic
        },
      }),
    });

    const res1 = await editAction({
      request: req1,
      params: { id: resume.id },
      context: { cloudflare: { env } },
    } as any);

    expect(res1.status).toBe(200);
    const json1 = (await res1.json()) as any;
    expect(json1.ok).toBe(true);

    const fresh1 = await getResume(db, user.id, resume.id);
    expect(fresh1?.templateId).toBe("classic");
    const freshDesign = fresh1?.design as any;
    expect(freshDesign.accentColor).toBe("#059669");
    expect(freshDesign.fontScale).toBe(1.25);
    expect(freshDesign.columns).toBe(1);

    // 2. Invalid templateId is rejected with 400
    const req2 = new Request(`http://localhost:5173/resumes/${resume.id}/edit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:5173",
        Cookie: cookie,
      },
      body: JSON.stringify({
        intent: "save",
        expectedVersion: 2,
        content,
        templateId: "unsupported-template-xyz",
      }),
    });

    const res2 = await editAction({
      request: req2,
      params: { id: resume.id },
      context: { cloudflare: { env } },
    } as any);

    expect(res2.status).toBe(400);
    const json2 = (await res2.json()) as any;
    expect(json2.ok).toBe(false);
    expect(json2.error).toBe("Invalid templateId");
  });
});

