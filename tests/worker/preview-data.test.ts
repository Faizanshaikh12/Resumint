import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import { setupTestDatabase } from "../helpers/setup-db";
import { createAuth } from "~/auth/auth.server";
import { loader as previewDataLoader } from "~/routes/resumes.$id.preview-data";
import { createResume } from "~/db/queries/resumes";
import { createTestDb } from "../helpers/factories";
import { createDefaultContent, createDefaultDesign } from "~/lib/resume/defaults";

async function createAuthenticatedUser(email: string, name = "Preview User") {
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

describe("Preview Data Route (Worker Integration)", () => {
  beforeAll(async () => {
    process.on("unhandledRejection", () => {});
    await setupTestDatabase(env);
  });

  it("returns preview data with Cache-Control header for owner", async () => {
    const db = createTestDb(env);
    const { user, cookie } = await createAuthenticatedUser("preview-owner@example.com");
    const resume = await createResume(db, user.id, {
      title: "Preview Test Resume",
      templateId: "executive",
      content: createDefaultContent(),
      design: createDefaultDesign(),
    });

    const req = new Request(`http://localhost:5173/resumes/${resume.id}/preview-data`, {
      headers: { Cookie: cookie },
    });

    const res = await previewDataLoader({
      request: req,
      params: { id: resume.id },
      context: { cloudflare: { env } },
    } as any);

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("private, max-age=60");

    const json = (await res.json()) as any;
    expect(json.content).toBeDefined();
    expect(json.design).toBeDefined();
    expect(json.templateId).toBe("executive");
  });

  it("returns 404 for unowned resume (never leaks 403)", async () => {
    const db = createTestDb(env);
    const { user: userA } = await createAuthenticatedUser("user-a-preview@example.com");
    const { cookie: cookieB } = await createAuthenticatedUser("user-b-preview@example.com");

    const resumeA = await createResume(db, userA.id, { title: "User A Resume" });

    const req = new Request(`http://localhost:5173/resumes/${resumeA.id}/preview-data`, {
      headers: { Cookie: cookieB },
    });

    try {
      await previewDataLoader({
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

  it("returns 404 when resume does not exist", async () => {
    const { cookie } = await createAuthenticatedUser("nonexistent-preview@example.com");

    const req = new Request("http://localhost:5173/resumes/non-existent-id/preview-data", {
      headers: { Cookie: cookie },
    });

    try {
      await previewDataLoader({
        request: req,
        params: { id: "non-existent-id" },
        context: { cloudflare: { env } },
      } as any);
      expect.unreachable("Should throw 404");
    } catch (response) {
      expect(response).toBeInstanceOf(Response);
      expect((response as Response).status).toBe(404);
    }
  });
});
