import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import { setupTestDatabase } from "../helpers/setup-db";
import { createAuth } from "~/auth/auth.server";
import { loader as exportLoader } from "~/routes/resumes.$id.export.json";
import { action as newResumeAction } from "~/routes/resumes.new";
import { createResume, getResume, countResumes } from "~/db/queries/resumes";
import { createTestDb, makeUser } from "../helpers/factories";
import { createDefaultContent, createDefaultDesign } from "~/lib/resume/defaults";
import { MAX_RESUMES_PER_USER } from "~/lib/resume/limits";

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

describe("Export and Import Worker Integration (Phase 7)", () => {
  beforeAll(async () => {
    process.on("unhandledRejection", () => {});
    await setupTestDatabase(env);
  });

  describe("GET /resumes/:id/export.json", () => {
    it("rejects unauthenticated requests", async () => {
      const db = createTestDb(env);
      const user = await makeUser(db);
      const resume = await createResume(db, user.id, { title: "Secret Resume" });

      const req = new Request(`http://localhost:5173/resumes/${resume.id}/export.json`);

      // requireUser throws redirect or Response when no session
      await expect(
        exportLoader({
          request: req,
          params: { id: resume.id },
          context: { cloudflare: { env } },
        } as any)
      ).rejects.toThrow();
    });

    it("returns 404 for unowned resume to prevent existence leakage", async () => {
      const db = createTestDb(env);
      const { user: userA } = await createAuthenticatedUser("user-a-owner@example.com");
      const { cookie: cookieB } = await createAuthenticatedUser("user-b-stranger@example.com");

      const resumeA = await createResume(db, userA.id, { title: "User A Resume" });

      const req = new Request(`http://localhost:5173/resumes/${resumeA.id}/export.json`, {
        headers: { Cookie: cookieB },
      });

      try {
        await exportLoader({
          request: req,
          params: { id: resumeA.id },
          context: { cloudflare: { env } },
        } as any);
        expect.unreachable("Expected 404 response to be thrown");
      } catch (err: any) {
        expect(err.status).toBe(404);
      }
    });

    it("returns 200 with valid attachment headers, no-store, and sanitized envelope for owner", async () => {
      const db = createTestDb(env);
      const { user, cookie } = await createAuthenticatedUser("export-owner@example.com");

      const customContent = createDefaultContent();
      customContent.personal.name = "Eleanor Vance";
      const resume = await createResume(db, user.id, {
        title: "Eleanor Vance Resume",
        templateId: "executive",
        content: customContent,
      });

      const req = new Request(`http://localhost:5173/resumes/${resume.id}/export.json`, {
        headers: { Cookie: cookie },
      });

      const res = await exportLoader({
        request: req,
        params: { id: resume.id },
        context: { cloudflare: { env } },
      } as any);

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("application/json; charset=utf-8");
      expect(res.headers.get("Cache-Control")).toBe("no-store");
      expect(res.headers.get("Content-Disposition")).toContain("attachment; filename=");
      expect(res.headers.get("Content-Disposition")).toContain("Eleanor-Vance-Resume.json");

      const text = await res.text();
      const envelope = JSON.parse(text);

      expect(envelope.app).toBe("resumint");
      expect(envelope.schemaVersion).toBe(1);
      expect(envelope.resume.title).toBe("Eleanor Vance Resume");
      expect(envelope.resume.templateId).toBe("executive");
      expect(envelope.resume.content.personal.name).toBe("Eleanor Vance");

      // Verify no sensitive source metadata leaked
      expect(envelope).not.toHaveProperty("userId");
      expect(envelope).not.toHaveProperty("id");
      expect(envelope).not.toHaveProperty("version");
      expect(envelope.resume).not.toHaveProperty("userId");
      expect(envelope.resume).not.toHaveProperty("id");
      expect(envelope.resume).not.toHaveProperty("version");
    });
  });

  describe("POST /resumes/new (import intent)", () => {
    it("successfully imports a valid JSON backup with regenerated IDs and version 1", async () => {
      const db = createTestDb(env);
      const { cookie, user } = await createAuthenticatedUser("import-success@example.com");

      const validEnvelope = {
        app: "resumint",
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        resume: {
          title: "Imported Architect",
          templateId: "technical",
          content: {
            personal: { name: "Gordon Freeman", email: "gordon@blackmesa.gov" },
            experience: [
              {
                id: "client-supplied-exp-id-1",
                company: "Black Mesa",
                position: "Research Associate",
                bullets: ["Theoretical physics experimentation"],
              },
            ],
          },
          design: createDefaultDesign(),
        },
      };

      const formData = new FormData();
      formData.set("intent", "import");
      formData.set("envelope", JSON.stringify(validEnvelope));

      const req = new Request("http://localhost:5173/resumes/new", {
        method: "POST",
        headers: {
          Cookie: cookie,
          Origin: "http://localhost:5173",
        },
        body: formData,
      });

      try {
        await newResumeAction({
          request: req,
          context: { cloudflare: { env } },
          params: {},
        } as any);
        expect.unreachable("Expected redirect after successful create");
      } catch (err: any) {
        expect(err.status).toBe(302);
        const redirectUrl = err.headers.get("Location") || "";
        expect(redirectUrl).toMatch(/\/resumes\/[a-zA-Z0-9_-]+\/edit/);

        const newId = redirectUrl.split("/")[2]!;
        const created = await getResume(db, user.id, newId);
        expect(created).toBeDefined();
        expect(created?.title).toBe("Imported Architect");
        expect(created?.templateId).toBe("technical");
        expect(created?.version).toBe(1);
        expect(created?.content.personal.name).toBe("Gordon Freeman");

        // Assert item IDs were regenerated (never trust imported client IDs)
        const expItem = created?.content.experience[0];
        expect(expItem?.id).toBeDefined();
        expect(expItem?.id).not.toBe("client-supplied-exp-id-1");
      }
    });

    it("rejects import when user has reached resume cap and writes nothing", async () => {
      const db = createTestDb(env);
      const { cookie, user } = await createAuthenticatedUser("import-cap-exceeded@example.com");

      // Fill user's account to maximum limit
      for (let i = 0; i < MAX_RESUMES_PER_USER; i++) {
        await createResume(db, user.id, { title: `Filler Resume ${i + 1}` });
      }

      const initialCount = await countResumes(db, user.id);
      expect(initialCount).toBe(MAX_RESUMES_PER_USER);

      const validEnvelope = {
        app: "resumint",
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        resume: {
          title: "Over-the-cap Resume",
          templateId: "modern",
          content: createDefaultContent(),
          design: createDefaultDesign(),
        },
      };

      const formData = new FormData();
      formData.set("intent", "import");
      formData.set("envelope", JSON.stringify(validEnvelope));

      const req = new Request("http://localhost:5173/resumes/new", {
        method: "POST",
        headers: {
          Cookie: cookie,
          Origin: "http://localhost:5173",
        },
        body: formData,
      });

      const res = await newResumeAction({
        request: req,
        context: { cloudflare: { env } },
        params: {},
      } as any);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.ok).toBe(false);
      expect(body.error).toContain("Resume limit reached");

      // Verify nothing written
      const countAfter = await countResumes(db, user.id);
      expect(countAfter).toBe(MAX_RESUMES_PER_USER);
    });

    it("rejects prototype-pollution payloads without writing to database", async () => {
      const db = createTestDb(env);
      const { cookie, user } = await createAuthenticatedUser("pollution-test@example.com");

      const hostileJson = `{"app":"resumint","schemaVersion":1,"__proto__":{"admin":true},"resume":{"title":"Hacked","templateId":"modern","content":{}}}`;

      const formData = new FormData();
      formData.set("intent", "import");
      formData.set("envelope", hostileJson);

      const req = new Request("http://localhost:5173/resumes/new", {
        method: "POST",
        headers: {
          Cookie: cookie,
          Origin: "http://localhost:5173",
        },
        body: formData,
      });

      const res = await newResumeAction({
        request: req,
        context: { cloudflare: { env } },
        params: {},
      } as any);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.ok).toBe(false);
      expect(body.error).toContain("prototype pollution detected");

      const count = await countResumes(db, user.id);
      expect(count).toBe(0);
    });

    it("rejects cross-origin submissions (CSRF defense)", async () => {
      const { cookie } = await createAuthenticatedUser("csrf-victim@example.com");

      const formData = new FormData();
      formData.set("intent", "import");
      formData.set("envelope", "{}");

      const req = new Request("http://localhost:5173/resumes/new", {
        method: "POST",
        headers: {
          Cookie: cookie,
          Origin: "https://malicious-external-site.com",
        },
        body: formData,
      });

      await expect(
        newResumeAction({
          request: req,
          context: { cloudflare: { env } },
          params: {},
        } as any)
      ).rejects.toThrow();
    });
  });

  describe("End-to-End Server Roundtrip", () => {
    it("exports a resume and imports it into a second account with deep content fidelity", async () => {
      const db = createTestDb(env);
      const { user: userA, cookie: cookieA } = await createAuthenticatedUser("user-a-source@example.com");
      const { user: userB, cookie: cookieB } = await createAuthenticatedUser("user-b-dest@example.com");

      const originalContent = createDefaultContent();
      originalContent.personal.name = "Isaac Clarke";
      originalContent.personal.email = "isaac@ishimura.space";
      originalContent.summary = "Systems engineer specializing in atmospheric and communications repairs.";

      const originalResume = await createResume(db, userA.id, {
        title: "CEC Mining Resume",
        templateId: "technical",
        content: originalContent,
      });

      // 1. Export resume via GET /resumes/:id/export.json
      const exportReq = new Request(`http://localhost:5173/resumes/${originalResume.id}/export.json`, {
        headers: { Cookie: cookieA },
      });

      const exportRes = await exportLoader({
        request: exportReq,
        params: { id: originalResume.id },
        context: { cloudflare: { env } },
      } as any);

      expect(exportRes.status).toBe(200);
      const exportedJson = await exportRes.text();

      // 2. Import into User B account via POST /resumes/new
      const formData = new FormData();
      formData.set("intent", "import");
      formData.set("envelope", exportedJson);

      const importReq = new Request("http://localhost:5173/resumes/new", {
        method: "POST",
        headers: {
          Cookie: cookieB,
          Origin: "http://localhost:5173",
        },
        body: formData,
      });

      let importedId = "";
      try {
        await newResumeAction({
          request: importReq,
          context: { cloudflare: { env } },
          params: {},
        } as any);
        expect.unreachable("Expected redirect");
      } catch (err: any) {
        expect(err.status).toBe(302);
        importedId = err.headers.get("Location")!.split("/")[2]!;
      }

      // 3. Inspect imported document in User B account
      const importedResume = await getResume(db, userB.id, importedId);
      expect(importedResume).toBeDefined();
      expect(importedResume?.userId).toBe(userB.id);
      expect(importedResume?.title).toBe(originalResume.title);
      expect(importedResume?.templateId).toBe("technical");
      expect(importedResume?.content.personal.name).toBe("Isaac Clarke");
      expect(importedResume?.content.personal.email).toBe("isaac@ishimura.space");
      expect(importedResume?.content.summary).toBe(originalContent.summary);
      expect(importedResume?.design.accentColor).toBe(originalResume.design.accentColor);
    });
  });
});
