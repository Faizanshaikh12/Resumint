import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import { setupTestDatabase } from "../helpers/setup-db";
import { createTestDb } from "../helpers/factories";
import { createAuth } from "~/auth/auth.server";
import { loader as dashboardLoader, action as dashboardAction } from "~/routes/dashboard";
import { loader as newResumeLoader, action as newResumeAction } from "~/routes/resumes.new";
import { loader as editResumeLoader } from "~/routes/resumes.$id.edit";
import { createResume, getResume, countResumes } from "~/db/queries/resumes";
import { resumes, shareLinks, resumeSnapshots } from "~/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

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

describe("Dashboard & Resume CRUD Routes (Worker Integration)", () => {
  beforeAll(async () => {
    process.on("unhandledRejection", () => {
      // Suppress Better Auth internal error logging during tests
    });
    await setupTestDatabase(env);
  });

  describe("Authentication & Route Guards", () => {
    it("redirects unauthenticated requests from dashboard to login with safe redirectTo", async () => {
      const request = new Request("http://localhost:5173/dashboard");
      try {
        await dashboardLoader({
          request,
          context: { cloudflare: { env } },
          params: {},
        } as never);
        expect.unreachable("Should have thrown redirect");
      } catch (response) {
        expect(response).toBeInstanceOf(Response);
        const res = response as Response;
        expect(res.status).toBe(302);
        expect(res.headers.get("Location")).toBe("/login?redirectTo=%2Fdashboard");
      }
    });

    it("redirects unauthenticated requests from /resumes/new to login with safe redirectTo", async () => {
      const request = new Request("http://localhost:5173/resumes/new");
      try {
        await newResumeLoader({
          request,
          context: { cloudflare: { env } },
          params: {},
        } as never);
        expect.unreachable("Should have thrown redirect");
      } catch (response) {
        expect(response).toBeInstanceOf(Response);
        const res = response as Response;
        expect(res.status).toBe(302);
        expect(res.headers.get("Location")).toBe("/login?redirectTo=%2Fresumes%2Fnew");
      }
    });

    it("redirects unauthenticated requests from /resumes/:id/edit to login with safe redirectTo", async () => {
      const request = new Request("http://localhost:5173/resumes/res-mock-123/edit");
      try {
        await editResumeLoader({
          request,
          context: { cloudflare: { env } },
          params: { id: "res-mock-123" },
        } as never);
        expect.unreachable("Should have thrown redirect");
      } catch (response) {
        expect(response).toBeInstanceOf(Response);
        const res = response as Response;
        expect(res.status).toBe(302);
        expect(res.headers.get("Location")).toBe(
          "/login?redirectTo=%2Fresumes%2Fres-mock-123%2Fedit"
        );
      }
    });
  });

  describe("Resume Creation & Limits", () => {
    it("creates blank resume and redirects to edit route", async () => {
      const { cookie } = await createAuthenticatedUser(
        `create-blank-${Date.now()}@resumint.dev`
      );

      const formData = new FormData();
      formData.append("intent", "create");
      formData.append("source", "blank");
      formData.append("title", "My Blank Resume");

      const request = new Request("http://localhost:5173/dashboard", {
        method: "POST",
        headers: {
          Cookie: cookie,
          Origin: "http://localhost:5173",
        },
        body: formData,
      });

      try {
        await dashboardAction({
          request,
          context: { cloudflare: { env } },
          params: {},
        } as never);
        expect.unreachable("Should have redirected to /resumes/:id/edit");
      } catch (response) {
        expect(response).toBeInstanceOf(Response);
        const res = response as Response;
        expect(res.status).toBe(302);
        const location = res.headers.get("Location")!;
        expect(location).toMatch(/^\/resumes\/[a-zA-Z0-9_-]+\/edit$/);
      }
    });

    it("creates resume from sample and populates proven sample content", async () => {
      const { user, cookie } = await createAuthenticatedUser(
        `create-sample-${Date.now()}@resumint.dev`
      );

      const formData = new FormData();
      formData.append("intent", "create");
      formData.append("source", "sample");
      formData.append("sampleId", "developer");

      const request = new Request("http://localhost:5173/resumes/new", {
        method: "POST",
        headers: {
          Cookie: cookie,
          Origin: "http://localhost:5173",
        },
        body: formData,
      });

      let redirectLocation = "";
      try {
        await newResumeAction({
          request,
          context: { cloudflare: { env } },
          params: {},
        } as never);
      } catch (response) {
        const res = response as Response;
        expect(res.status).toBe(302);
        redirectLocation = res.headers.get("Location")!;
      }

      const match = redirectLocation.match(/\/resumes\/(.+)\/edit/);
      expect(match).not.toBeNull();
      const resumeId = match![1]!;

      const db = createTestDb(env);
      const fetched = await getResume(db, user.id, resumeId);
      expect(fetched).not.toBeNull();
      expect(fetched!.title).toBe("Software Engineer (Full-Stack)");
      expect(fetched!.content.personal.name).toBe("Alex Morgan");
    });

    it("enforces maximum cap of 20 resumes on create AND duplicate (21st rejected)", async () => {
      const { user, cookie } = await createAuthenticatedUser(
        `cap-limit-${Date.now()}@resumint.dev`
      );
      const db = createTestDb(env);

      // Seed 20 resumes directly
      for (let i = 1; i <= 20; i++) {
        await createResume(db, user.id, { title: `Resume #${i}` });
      }

      const countBefore = await countResumes(db, user.id);
      expect(countBefore).toBe(20);

      // Attempt 21st create
      const createFormData = new FormData();
      createFormData.append("intent", "create");
      createFormData.append("source", "blank");

      const createReq = new Request("http://localhost:5173/dashboard", {
        method: "POST",
        headers: {
          Cookie: cookie,
          Origin: "http://localhost:5173",
        },
        body: createFormData,
      });

      const createRes = (await dashboardAction({
        request: createReq,
        context: { cloudflare: { env } },
        params: {},
      } as never)) as Response;

      expect(createRes.status).toBe(400);
      const createBody = (await createRes.json()) as { ok: boolean; error: string };
      expect(createBody.ok).toBe(false);
      expect(createBody.error).toMatch(/limit reached/i);

      // Attempt 21st duplicate
      const [firstResume] = await db.select().from(resumes).where(eq(resumes.userId, user.id)).limit(1);

      const duplicateFormData = new FormData();
      duplicateFormData.append("intent", "duplicate");
      duplicateFormData.append("id", firstResume!.id);

      const dupReq = new Request("http://localhost:5173/dashboard", {
        method: "POST",
        headers: {
          Cookie: cookie,
          Origin: "http://localhost:5173",
        },
        body: duplicateFormData,
      });

      const dupRes = (await dashboardAction({
        request: dupReq,
        context: { cloudflare: { env } },
        params: {},
      } as never)) as Response;

      expect(dupRes.status).toBe(400);
      const dupBody = (await dupRes.json()) as { ok: boolean; error: string };
      expect(dupBody.ok).toBe(false);
      expect(dupBody.error).toMatch(/limit reached/i);

      // Verify no extra row was written
      const countAfter = await countResumes(db, user.id);
      expect(countAfter).toBe(20);
    });
  });

  describe("Resume Mutations (Rename, Duplicate, Delete)", () => {
    it("renames resume, rejects empty title, and performs no write if title unchanged", async () => {
      const { user, cookie } = await createAuthenticatedUser(
        `rename-test-${Date.now()}@resumint.dev`
      );
      const db = createTestDb(env);

      const created = await createResume(db, user.id, { title: "Initial Title" });

      // Valid rename
      const validForm = new FormData();
      validForm.append("intent", "rename");
      validForm.append("id", created.id);
      validForm.append("title", "  New Shiny Title  ");

      const validReq = new Request("http://localhost:5173/dashboard", {
        method: "POST",
        headers: { Cookie: cookie, Origin: "http://localhost:5173" },
        body: validForm,
      });

      const validRes = (await dashboardAction({
        request: validReq,
        context: { cloudflare: { env } },
        params: {},
      } as never)) as Response;

      expect(validRes.status).toBe(200);
      const validBody = (await validRes.json()) as { ok: boolean; data: { title: string } };
      expect(validBody.ok).toBe(true);
      expect(validBody.data.title).toBe("New Shiny Title");

      const inDb = await getResume(db, user.id, created.id);
      expect(inDb?.title).toBe("New Shiny Title");
      const updatedTimestamp = inDb?.updatedAt.getTime();

      // Empty title rejected with 400
      const emptyForm = new FormData();
      emptyForm.append("intent", "rename");
      emptyForm.append("id", created.id);
      emptyForm.append("title", "   ");

      const emptyReq = new Request("http://localhost:5173/dashboard", {
        method: "POST",
        headers: { Cookie: cookie, Origin: "http://localhost:5173" },
        body: emptyForm,
      });

      const emptyRes = (await dashboardAction({
        request: emptyReq,
        context: { cloudflare: { env } },
        params: {},
      } as never)) as Response;

      expect(emptyRes.status).toBe(400);

      // Unchanged title: no-op, performs no write
      const unchangedForm = new FormData();
      unchangedForm.append("intent", "rename");
      unchangedForm.append("id", created.id);
      unchangedForm.append("title", "New Shiny Title");

      const unchangedReq = new Request("http://localhost:5173/dashboard", {
        method: "POST",
        headers: { Cookie: cookie, Origin: "http://localhost:5173" },
        body: unchangedForm,
      });

      const unchangedRes = (await dashboardAction({
        request: unchangedReq,
        context: { cloudflare: { env } },
        params: {},
      } as never)) as Response;

      expect(unchangedRes.status).toBe(200);
      const afterCheck = await getResume(db, user.id, created.id);
      expect(afterCheck?.updatedAt.getTime()).toBe(updatedTimestamp);
    });

    it("duplicates copies content and design, resets version to 1, does NOT copy share link", async () => {
      const { user, cookie } = await createAuthenticatedUser(
        `dup-test-${Date.now()}@resumint.dev`
      );
      const db = createTestDb(env);

      const original = await createResume(db, user.id, {
        title: "Master Document",
        templateId: "classic",
      });

      // Add a share link to original
      await db.insert(shareLinks).values({
        id: nanoid(),
        resumeId: original.id,
        slug: nanoid(14),
        isActive: true,
      });

      const dupForm = new FormData();
      dupForm.append("intent", "duplicate");
      dupForm.append("id", original.id);

      const dupReq = new Request("http://localhost:5173/dashboard", {
        method: "POST",
        headers: { Cookie: cookie, Origin: "http://localhost:5173" },
        body: dupForm,
      });

      const dupRes = (await dashboardAction({
        request: dupReq,
        context: { cloudflare: { env } },
        params: {},
      } as never)) as Response;

      expect(dupRes.status).toBe(200);
      const dupBody = (await dupRes.json()) as { ok: boolean; data: { id: string; title: string } };
      expect(dupBody.ok).toBe(true);
      expect(dupBody.data.title).toBe("Master Document (Copy)");

      const duplicateInDb = await getResume(db, user.id, dupBody.data.id);
      expect(duplicateInDb).not.toBeNull();
      expect(duplicateInDb!.version).toBe(1);
      expect(duplicateInDb!.templateId).toBe("classic");
      expect(duplicateInDb!.content.personal.name).toBe(original.content.personal.name);

      // Verify share link was NOT copied
      const dupShares = await db
        .select()
        .from(shareLinks)
        .where(eq(shareLinks.resumeId, duplicateInDb!.id));
      expect(dupShares).toHaveLength(0);
    });

    it("deletes resume and cascades linked snapshots and share links", async () => {
      const { user, cookie } = await createAuthenticatedUser(
        `delete-test-${Date.now()}@resumint.dev`
      );
      const db = createTestDb(env);

      const target = await createResume(db, user.id, { title: "To Be Deleted" });

      // Attach snapshot and share link
      await db.insert(resumeSnapshots).values({
        id: nanoid(),
        resumeId: target.id,
        content: target.content,
        design: target.design,
      });
      await db.insert(shareLinks).values({
        id: nanoid(),
        resumeId: target.id,
        slug: nanoid(14),
        isActive: true,
      });

      const delForm = new FormData();
      delForm.append("intent", "delete");
      delForm.append("id", target.id);

      const delReq = new Request("http://localhost:5173/dashboard", {
        method: "POST",
        headers: { Cookie: cookie, Origin: "http://localhost:5173" },
        body: delForm,
      });

      const delRes = (await dashboardAction({
        request: delReq,
        context: { cloudflare: { env } },
        params: {},
      } as never)) as Response;

      expect(delRes.status).toBe(200);

      // Verify resume is deleted
      const checkResume = await getResume(db, user.id, target.id);
      expect(checkResume).toBeNull();

      // Verify cascade: snapshots and share links are removed
      const checkSnapshots = await db
        .select()
        .from(resumeSnapshots)
        .where(eq(resumeSnapshots.resumeId, target.id));
      expect(checkSnapshots).toHaveLength(0);

      const checkShares = await db
        .select()
        .from(shareLinks)
        .where(eq(shareLinks.resumeId, target.id));
      expect(checkShares).toHaveLength(0);
    });
  });

  describe("Authorization Isolation through Route Layer", () => {
    it("responds with 404 (never 403) when User B tries to view or mutate User A's resume", async () => {
      const { user: userA } = await createAuthenticatedUser(
        `user-a-${Date.now()}@resumint.dev`
      );
      const { cookie: cookieB } = await createAuthenticatedUser(
        `user-b-${Date.now()}@resumint.dev`
      );

      const db = createTestDb(env);
      const resumeA = await createResume(db, userA.id, { title: "User A Secret" });

      // 1. User B tries to load User A's edit route -> 404
      const editReq = new Request(`http://localhost:5173/resumes/${resumeA.id}/edit`, {
        headers: { Cookie: cookieB },
      });

      try {
        await editResumeLoader({
          request: editReq,
          context: { cloudflare: { env } },
          params: { id: resumeA.id },
        } as never);
        expect.unreachable("User B should not access User A's resume");
      } catch (response) {
        expect(response).toBeInstanceOf(Response);
        const res = response as Response;
        expect(res.status).toBe(404);
      }

      // 2. User B tries to rename User A's resume -> 404
      const renameForm = new FormData();
      renameForm.append("intent", "rename");
      renameForm.append("id", resumeA.id);
      renameForm.append("title", "Hacked Title");

      const renameReq = new Request("http://localhost:5173/dashboard", {
        method: "POST",
        headers: { Cookie: cookieB, Origin: "http://localhost:5173" },
        body: renameForm,
      });

      const renameRes = (await dashboardAction({
        request: renameReq,
        context: { cloudflare: { env } },
        params: {},
      } as never)) as Response;

      expect(renameRes.status).toBe(404);

      // 3. User B tries to duplicate User A's resume -> 404
      const dupForm = new FormData();
      dupForm.append("intent", "duplicate");
      dupForm.append("id", resumeA.id);

      const dupReq = new Request("http://localhost:5173/dashboard", {
        method: "POST",
        headers: { Cookie: cookieB, Origin: "http://localhost:5173" },
        body: dupForm,
      });

      const dupRes = (await dashboardAction({
        request: dupReq,
        context: { cloudflare: { env } },
        params: {},
      } as never)) as Response;

      expect(dupRes.status).toBe(404);

      // 4. User B tries to delete User A's resume -> 404
      const delForm = new FormData();
      delForm.append("intent", "delete");
      delForm.append("id", resumeA.id);

      const delReq = new Request("http://localhost:5173/dashboard", {
        method: "POST",
        headers: { Cookie: cookieB, Origin: "http://localhost:5173" },
        body: delForm,
      });

      const delRes = (await dashboardAction({
        request: delReq,
        context: { cloudflare: { env } },
        params: {},
      } as never)) as Response;

      expect(delRes.status).toBe(404);

      // Verify User A's resume remains untouched in the DB
      const checkA = await getResume(db, userA.id, resumeA.id);
      expect(checkA).not.toBeNull();
      expect(checkA!.title).toBe("User A Secret");
    });
  });

  describe("Query Parameters, Search, Sort & Free Tier Protections", () => {
    it("filters by search query, safely escaping LIKE wildcards (% and _)", async () => {
      const { user, cookie } = await createAuthenticatedUser(
        `search-test-${Date.now()}@resumint.dev`
      );
      const db = createTestDb(env);

      await createResume(db, user.id, { title: "100% Guaranteed Success" });
      await createResume(db, user.id, { title: "100_percent_guaranteed" });
      await createResume(db, user.id, { title: "Standard Resume" });

      // Search with % should ONLY match the literal % symbol
      const reqPercent = new Request("http://localhost:5173/dashboard?q=%25", {
        headers: { Cookie: cookie },
      });
      const dataPercent = await dashboardLoader({
        request: reqPercent,
        context: { cloudflare: { env } },
        params: {},
      } as never);

      expect(dataPercent.items).toHaveLength(1);
      expect(dataPercent.items[0]!.title).toBe("100% Guaranteed Success");

      // Search with _ should ONLY match the literal _ symbol
      const reqUnderscore = new Request("http://localhost:5173/dashboard?q=_", {
        headers: { Cookie: cookie },
      });
      const dataUnderscore = await dashboardLoader({
        request: reqUnderscore,
        context: { cloudflare: { env } },
        params: {},
      } as never);

      expect(dataUnderscore.items).toHaveLength(1);
      expect(dataUnderscore.items[0]!.title).toBe("100_percent_guaranteed");
    });

    it("falls back safely on invalid sort and never returns content/design JSON blobs", async () => {
      const { user, cookie } = await createAuthenticatedUser(
        `sort-blobs-${Date.now()}@resumint.dev`
      );
      const db = createTestDb(env);

      await createResume(db, user.id, { title: "Blob Check Document" });

      // Request with invalid sort parameter
      const req = new Request("http://localhost:5173/dashboard?sort=invalid_order", {
        headers: { Cookie: cookie },
      });
      const data = await dashboardLoader({
        request: req,
        context: { cloudflare: { env } },
        params: {},
      } as never);

      expect(data.sort).toBe("updated"); // safely fell back
      expect(data.items.length).toBeGreaterThanOrEqual(1);

      // Verify that content and design blobs are NEVER included in the loader response
      for (const item of data.items) {
        expect((item as Record<string, unknown>).content).toBeUndefined();
        expect((item as Record<string, unknown>).design).toBeUndefined();
      }
    });

    it("rejects cross-origin mutating POST requests with 403", async () => {
      const { cookie } = await createAuthenticatedUser(
        `csrf-test-${Date.now()}@resumint.dev`
      );

      const formData = new FormData();
      formData.append("intent", "create");
      formData.append("source", "blank");

      const req = new Request("http://localhost:5173/dashboard", {
        method: "POST",
        headers: {
          Cookie: cookie,
          Origin: "https://evil-attacker-site.com", // Cross-origin!
        },
        body: formData,
      });

      try {
        await dashboardAction({
          request: req,
          context: { cloudflare: { env } },
          params: {},
        } as never);
        expect.unreachable("Cross origin request should have been rejected");
      } catch (response) {
        expect(response).toBeInstanceOf(Response);
        const res = response as Response;
        expect(res.status).toBe(403);
      }
    });
  });
});
