import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import { setupTestDatabase } from "../helpers/setup-db";
import { createAuth } from "~/auth/auth.server";
import { createTestDb } from "../helpers/factories";
import { createResume } from "~/db/queries/resumes";
import { upsertShareLink, getPublicResumeBySlug } from "~/db/queries/shares";
import { createSnapshot } from "~/db/queries/snapshots";
import { action as dashboardAction, loader as dashboardLoader } from "~/routes/dashboard";
import { action as newResumeAction, loader as newResumeLoader } from "~/routes/resumes.new";
import { action as editAction, loader as editLoader } from "~/routes/resumes.$id.edit";
import { action as shareAction, loader as shareLoader } from "~/routes/resumes.$id.share";
import { action as settingsAction, loader as settingsLoader } from "~/routes/settings";
import { loader as exportDataLoader } from "~/routes/api.export-data";
import { user, resumes, shareLinks, resumeSnapshots } from "~/db/schema";
import { eq } from "drizzle-orm";

async function createAuthenticatedUser(email: string, name = "Security Tester") {
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
      password: "Password123!",
    }),
  });

  const signupRes = await auth.handler(signupReq);
  const cookie = signupRes.headers.get("set-cookie") || "";
  const data = (await signupRes.json()) as { user: { id: string; email: string; name: string } };

  return { user: data.user, cookie };
}

describe("Security, Authorization & Account Lifecycle Audit", () => {
  beforeAll(async () => {
    process.on("unhandledRejection", () => {});
    await setupTestDatabase(env);
  });

  describe("CSRF / Origin Validation Sweep", () => {
    const maliciousOrigin = "https://evil-attacker-site.com";

    it("rejects cross-origin mutations on dashboardAction", async () => {
      const { cookie } = await createAuthenticatedUser("csrf-dash@resumint.dev");
      const form = new FormData();
      form.append("intent", "create");
      form.append("type", "blank");

      const req = new Request("http://localhost:5173/dashboard", {
        method: "POST",
        headers: {
          Cookie: cookie,
          Origin: maliciousOrigin,
        },
        body: form,
      });

      await expect(
        dashboardAction({ request: req, params: {}, context: { cloudflare: { env } } } as any)
      ).rejects.toThrow();
    });

    it("rejects cross-origin mutations on newResumeAction", async () => {
      const { cookie } = await createAuthenticatedUser("csrf-new@resumint.dev");
      const form = new FormData();
      form.append("type", "blank");

      const req = new Request("http://localhost:5173/resumes/new", {
        method: "POST",
        headers: {
          Cookie: cookie,
          Origin: maliciousOrigin,
        },
        body: form,
      });

      await expect(
        newResumeAction({ request: req, params: {}, context: { cloudflare: { env } } } as any)
      ).rejects.toThrow();
    });

    it("rejects cross-origin mutations on editAction", async () => {
      const db = createTestDb(env);
      const { user: userA, cookie } = await createAuthenticatedUser("csrf-edit@resumint.dev");
      const resume = await createResume(db, userA.id);

      const form = new FormData();
      form.append("intent", "rename");
      form.append("title", "Hacked Title");

      const req = new Request(`http://localhost:5173/resumes/${resume.id}/edit`, {
        method: "POST",
        headers: {
          Cookie: cookie,
          Origin: maliciousOrigin,
        },
        body: form,
      });

      await expect(
        editAction({
          request: req,
          params: { id: resume.id },
          context: { cloudflare: { env } },
        } as any)
      ).rejects.toThrow();
    });

    it("rejects cross-origin mutations on shareAction", async () => {
      const db = createTestDb(env);
      const { user: userA, cookie } = await createAuthenticatedUser("csrf-share@resumint.dev");
      const resume = await createResume(db, userA.id);

      const form = new FormData();
      form.append("intent", "enable");

      const req = new Request(`http://localhost:5173/resumes/${resume.id}/share`, {
        method: "POST",
        headers: {
          Cookie: cookie,
          Origin: maliciousOrigin,
        },
        body: form,
      });

      await expect(
        shareAction({
          request: req,
          params: { id: resume.id },
          context: { cloudflare: { env } },
        } as any)
      ).rejects.toThrow();
    });

    it("rejects cross-origin mutations on settingsAction", async () => {
      const { cookie } = await createAuthenticatedUser("csrf-settings@resumint.dev");
      const form = new FormData();
      form.append("intent", "delete_account");
      form.append("confirmation", "delete my account");

      const req = new Request("http://localhost:5173/settings", {
        method: "POST",
        headers: {
          Cookie: cookie,
          Origin: maliciousOrigin,
        },
        body: form,
      });

      await expect(
        settingsAction({ request: req, params: {}, context: { cloudflare: { env } } } as any)
      ).rejects.toThrow();
    });
  });

  describe("Authorization Sweep", () => {
    it("redirects unauthenticated requests to login on all protected loaders", async () => {
      const unauthReq = new Request("http://localhost:5173/dashboard");

      await expect(
        dashboardLoader({
          request: unauthReq,
          params: {},
          context: { cloudflare: { env } },
        } as any)
      ).rejects.toSatisfy((res: Response) => res.status === 302);

      await expect(
        newResumeLoader({
          request: unauthReq,
          params: {},
          context: { cloudflare: { env } },
        } as any)
      ).rejects.toSatisfy((res: Response) => res.status === 302);

      await expect(
        settingsLoader({
          request: unauthReq,
          params: {},
          context: { cloudflare: { env } },
        } as any)
      ).rejects.toSatisfy((res: Response) => res.status === 302);

      await expect(
        exportDataLoader({
          request: unauthReq,
          params: {},
          context: { cloudflare: { env } },
        } as any)
      ).rejects.toSatisfy((res: Response) => res.status === 302);
    });

    it("returns 404 for User B attempting to access User A's edit or share loader", async () => {
      const db = createTestDb(env);
      const { user: userA } = await createAuthenticatedUser("user-a-auth@resumint.dev");
      const { cookie: cookieB } = await createAuthenticatedUser("user-b-auth@resumint.dev");

      const resumeA = await createResume(db, userA.id, { title: "User A Resume" });

      const reqEdit = new Request(`http://localhost:5173/resumes/${resumeA.id}/edit`, {
        headers: { Cookie: cookieB },
      });

      await expect(
        editLoader({
          request: reqEdit,
          params: { id: resumeA.id },
          context: { cloudflare: { env } },
        } as any)
      ).rejects.toSatisfy((res: Response) => res.status === 404);

      const reqShare = new Request(`http://localhost:5173/resumes/${resumeA.id}/share`, {
        headers: { Cookie: cookieB },
      });

      await expect(
        shareLoader({
          request: reqShare,
          params: { id: resumeA.id },
          context: { cloudflare: { env } },
        } as any)
      ).rejects.toSatisfy((res: Response) => res.status === 404);
    });
  });

  describe("Account Deletion Cascade & Data Export", () => {
    it("exports all user resumes with no-store and attachment headers", async () => {
      const db = createTestDb(env);
      const { user: testUser, cookie } = await createAuthenticatedUser("export-user@resumint.dev");

      await createResume(db, testUser.id, { title: "Exportable One" });
      await createResume(db, testUser.id, { title: "Exportable Two" });

      const req = new Request("http://localhost:5173/api/export-data", {
        headers: { Cookie: cookie },
      });

      const res = await exportDataLoader({
        request: req,
        params: {},
        context: { cloudflare: { env } },
      } as any);

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("application/json");
      expect(res.headers.get("Content-Disposition")).toContain("attachment; filename=");
      expect(res.headers.get("Cache-Control")).toBe("no-store");

      const data = await res.json();
      expect(data.app).toBe("resumint");
      expect(data.schemaVersion).toBe(1);
      expect(data.userId).toBe(testUser.id);
      expect(data.resumeCount).toBe(2);
      expect(data.resumes.length).toBe(2);
      expect(data.resumes.map((r: any) => r.title)).toContain("Exportable One");
    });

    it("deleting account completely cascades and deletes resumes, snapshots, shares, and user record", async () => {
      const db = createTestDb(env);
      const { user: victimUser, cookie } = await createAuthenticatedUser("victim-user@resumint.dev");

      // Create resume
      const resume = await createResume(db, victimUser.id, { title: "To Be Deleted" });

      // Create snapshot
      await createSnapshot(db, victimUser.id, resume.id, "Initial Snapshot");

      // Create share link
      const share = await upsertShareLink(db, victimUser.id, resume.id, {
        isActive: true,
        allowDownload: true,
      });

      // Verify records exist
      const preShare = await getPublicResumeBySlug(db, share.slug);
      expect(preShare).not.toBeNull();

      // Submit delete account action
      const form = new FormData();
      form.append("intent", "delete_account");
      form.append("confirmation", "delete my account");

      const req = new Request("http://localhost:5173/settings", {
        method: "POST",
        headers: {
          Cookie: cookie,
          Origin: "http://localhost:5173",
        },
        body: form,
      });

      const res = await settingsAction({
        request: req,
        params: {},
        context: { cloudflare: { env } },
      } as any);

      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toContain("/?deleted=true");
      expect(res.headers.get("Set-Cookie")).toContain("better-auth.session_token=");

      // Verify complete database erasure
      const remainingUser = await db.select().from(user).where(eq(user.id, victimUser.id)).get();
      expect(remainingUser).toBeUndefined();

      const remainingResumes = await db.select().from(resumes).where(eq(resumes.userId, victimUser.id)).all();
      expect(remainingResumes.length).toBe(0);

      const remainingSnapshots = await db.select().from(resumeSnapshots).where(eq(resumeSnapshots.resumeId, resume.id)).all();
      expect(remainingSnapshots.length).toBe(0);

      const remainingShares = await db.select().from(shareLinks).where(eq(shareLinks.resumeId, resume.id)).all();
      expect(remainingShares.length).toBe(0);

      // Verify that visitor accessing the slug receives 404 (status: not_found)
      const postShare = await getPublicResumeBySlug(db, share.slug);
      expect(postShare.status).toBe("not_found");
    });
  });
});
