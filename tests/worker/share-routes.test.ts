import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import { setupTestDatabase } from "../helpers/setup-db";
import { createTestDb, makeResume } from "../helpers/factories";
import { createDefaultContent } from "~/lib/resume/defaults";
import { createAuth } from "~/auth/auth.server";
import {
  loader as shareSettingsLoader,
  action as shareSettingsAction,
  MAX_ACTIVE_SHARE_LINKS_PER_USER,
} from "~/routes/resumes.$id.share";
import {
  loader as publicShareLoader,
  action as publicShareAction,
  headers as publicShareHeaders,
} from "~/routes/r.$slug";
import {
  upsertShareLink,
  revokeShareLink,
  getRawShareLinkBySlug,
} from "~/db/queries/shares";
import { hashSharePassword } from "~/lib/share/password";

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

describe("Share Routes (Worker Integration)", () => {
  beforeAll(async () => {
    process.on("unhandledRejection", () => {});
    await setupTestDatabase(env);
  });

  describe("Owner Share Settings Route (/resumes/:id/share)", () => {
    it("redirects unauthenticated requests to login with safe redirectTo", async () => {
      const request = new Request("http://localhost:5173/resumes/res-123/share");
      try {
        await shareSettingsLoader({
          request,
          context: { cloudflare: { env } },
          params: { id: "res-123" },
        } as never);
        expect.unreachable("Should have redirected");
      } catch (response) {
        expect(response).toBeInstanceOf(Response);
        const res = response as Response;
        expect(res.status).toBe(302);
        expect(res.headers.get("Location")).toBe("/login?redirectTo=%2Fresumes%2Fres-123%2Fshare");
      }
    });

    it("returns 404 for User B requesting User A's resume share settings", async () => {
      const db = createTestDb(env);
      const userA = await createAuthenticatedUser("owner-a@example.com", "Owner A");
      const userB = await createAuthenticatedUser("owner-b@example.com", "Owner B");

      const resumeA = await makeResume(db, userA.user.id, { title: "Secret Resume" });

      // User B tries to view User A's share settings
      const request = new Request(`http://localhost:5173/resumes/${resumeA.id}/share`, {
        headers: { Cookie: userB.cookie },
      });

      try {
        await shareSettingsLoader({
          request,
          context: { cloudflare: { env } },
          params: { id: resumeA.id },
        } as never);
        expect.unreachable("Should have thrown 404");
      } catch (response: any) {
        expect(response).toBeInstanceOf(Response);
        expect((response as Response).status).toBe(404);
      }
    });

    it("rejects cross-origin mutations with 403 Forbidden", async () => {
      const db = createTestDb(env);
      const user = await createAuthenticatedUser("csrf-victim@example.com");
      const resume = await makeResume(db, user.user.id);

      const formData = new FormData();
      formData.set("intent", "enable");

      const request = new Request(`http://localhost:5173/resumes/${resume.id}/share`, {
        method: "POST",
        headers: {
          Cookie: user.cookie,
          Origin: "https://malicious-site.com",
        },
        body: formData,
      });

      try {
        const response = await shareSettingsAction({
          request,
          context: { cloudflare: { env } },
          params: { id: resume.id },
        } as never);
        expect(response.status).toBe(403);
      } catch (err: any) {
        expect(err).toBeInstanceOf(Response);
        expect((err as Response).status).toBe(403);
      }
    });

    it("handles lifecycle intents: enable, update, setPassword, removePassword, regenerate, disable, deleteLink", async () => {
      const db = createTestDb(env);
      const user = await createAuthenticatedUser("share-owner@example.com");
      const resume = await makeResume(db, user.user.id, { title: "My Portfolio" });

      // 1. Loader initial state (no share link yet)
      const initialReq = new Request(`http://localhost:5173/resumes/${resume.id}/share`, {
        headers: { Cookie: user.cookie },
      });
      const initialData = await shareSettingsLoader({
        request: initialReq,
        context: { cloudflare: { env } },
        params: { id: resume.id },
      } as never);
      expect(initialData.share).toBeNull();
      expect(initialData.maxActiveLinks).toBe(MAX_ACTIVE_SHARE_LINKS_PER_USER);

      // 2. Action: enable
      const enableForm = new FormData();
      enableForm.set("intent", "enable");
      const enableReq = new Request(`http://localhost:5173/resumes/${resume.id}/share`, {
        method: "POST",
        headers: { Cookie: user.cookie, Origin: "http://localhost:5173" },
        body: enableForm,
      });
      const enableRes = await shareSettingsAction({
        request: enableReq,
        context: { cloudflare: { env } },
        params: { id: resume.id },
      } as never);
      const enableJson = (await enableRes.json()) as any;
      expect(enableJson.ok).toBe(true);
      expect(enableJson.share.slug).toHaveLength(14);
      expect(enableJson.share.isActive).toBe(true);
      expect(enableJson.share.allowDownload).toBe(true);
      expect(enableJson.share.noindex).toBe(true);
      expect(enableJson.share.hideContact).toBe(false);
      const originalSlug = enableJson.share.slug;

      // 3. Action: update permissions and expiry
      const updateForm = new FormData();
      updateForm.set("intent", "update");
      updateForm.set("allowDownload", "false");
      updateForm.set("noindex", "false");
      updateForm.set("hideContact", "true");
      updateForm.set("expiryPreset", "30d");

      const updateReq = new Request(`http://localhost:5173/resumes/${resume.id}/share`, {
        method: "POST",
        headers: { Cookie: user.cookie, Origin: "http://localhost:5173" },
        body: updateForm,
      });
      const updateRes = await shareSettingsAction({
        request: updateReq,
        context: { cloudflare: { env } },
        params: { id: resume.id },
      } as never);
      const updateJson = (await updateRes.json()) as any;
      expect(updateJson.ok).toBe(true);
      expect(updateJson.share.allowDownload).toBe(false);
      expect(updateJson.share.noindex).toBe(false);
      expect(updateJson.share.hideContact).toBe(true);
      expect(updateJson.share.expiresAt).toBeDefined();

      // 4. Action: setPassword
      const pwdForm = new FormData();
      pwdForm.set("intent", "setPassword");
      pwdForm.set("password", "ProtectMe123!");
      const pwdReq = new Request(`http://localhost:5173/resumes/${resume.id}/share`, {
        method: "POST",
        headers: { Cookie: user.cookie, Origin: "http://localhost:5173" },
        body: pwdForm,
      });
      const pwdRes = await shareSettingsAction({
        request: pwdReq,
        context: { cloudflare: { env } },
        params: { id: resume.id },
      } as never);
      expect((await pwdRes.json() as any).ok).toBe(true);

      // Verify loader reveals hasPassword: true but NEVER passwordHash
      const midData = await shareSettingsLoader({
        request: initialReq,
        context: { cloudflare: { env } },
        params: { id: resume.id },
      } as never);
      expect(midData.share?.hasPassword).toBe(true);
      expect((midData.share as any)?.passwordHash).toBeUndefined();

      // 5. Action: regenerate slug (previous slug dies immediately)
      const regenForm = new FormData();
      regenForm.set("intent", "regenerate");
      const regenReq = new Request(`http://localhost:5173/resumes/${resume.id}/share`, {
        method: "POST",
        headers: { Cookie: user.cookie, Origin: "http://localhost:5173" },
        body: regenForm,
      });
      const regenRes = await shareSettingsAction({
        request: regenReq,
        context: { cloudflare: { env } },
        params: { id: resume.id },
      } as never);
      const regenJson = (await regenRes.json()) as any;
      expect(regenJson.ok).toBe(true);
      expect(regenJson.share.slug).not.toBe(originalSlug);

      // 6. Action: removePassword
      const removePwdForm = new FormData();
      removePwdForm.set("intent", "removePassword");
      const removePwdReq = new Request(`http://localhost:5173/resumes/${resume.id}/share`, {
        method: "POST",
        headers: { Cookie: user.cookie, Origin: "http://localhost:5173" },
        body: removePwdForm,
      });
      const removePwdRes = await shareSettingsAction({
        request: removePwdReq,
        context: { cloudflare: { env } },
        params: { id: resume.id },
      } as never);
      expect((await removePwdRes.json() as any).ok).toBe(true);

      // 7. Action: disable (isActive = false)
      const disableForm = new FormData();
      disableForm.set("intent", "disable");
      const disableReq = new Request(`http://localhost:5173/resumes/${resume.id}/share`, {
        method: "POST",
        headers: { Cookie: user.cookie, Origin: "http://localhost:5173" },
        body: disableForm,
      });
      const disableRes = await shareSettingsAction({
        request: disableReq,
        context: { cloudflare: { env } },
        params: { id: resume.id },
      } as never);
      expect((await disableRes.json() as any).ok).toBe(true);

      // 8. Action: deleteLink
      const deleteForm = new FormData();
      deleteForm.set("intent", "deleteLink");
      const deleteReq = new Request(`http://localhost:5173/resumes/${resume.id}/share`, {
        method: "POST",
        headers: { Cookie: user.cookie, Origin: "http://localhost:5173" },
        body: deleteForm,
      });
      const deleteRes = await shareSettingsAction({
        request: deleteReq,
        context: { cloudflare: { env } },
        params: { id: resume.id },
      } as never);
      expect((await deleteRes.json() as any).ok).toBe(true);

      // Loader confirms link is gone
      const finalData = await shareSettingsLoader({
        request: initialReq,
        context: { cloudflare: { env } },
        params: { id: resume.id },
      } as never);
      expect(finalData.share).toBeNull();
    });

    it("enforces active link cap (10 max) per user", async () => {
      const db = createTestDb(env);
      const user = await createAuthenticatedUser("cap-test@example.com");

      // Create 10 resumes with active share links
      for (let i = 0; i < 10; i++) {
        const r = await makeResume(db, user.user.id, { title: `Resume ${i + 1}` });
        await upsertShareLink(db, user.user.id, r.id);
      }

      // Create 11th resume and try to enable share link
      const resume11 = await makeResume(db, user.user.id, { title: "Resume 11" });
      const form = new FormData();
      form.set("intent", "enable");
      const request = new Request(`http://localhost:5173/resumes/${resume11.id}/share`, {
        method: "POST",
        headers: { Cookie: user.cookie, Origin: "http://localhost:5173" },
        body: form,
      });

      const response = await shareSettingsAction({
        request,
        context: { cloudflare: { env } },
        params: { id: resume11.id },
      } as never);

      expect(response.status).toBe(400);
      const json = (await response.json()) as any;
      expect(json.ok).toBe(false);
      expect(json.error).toContain("Maximum active share links reached");
    });
  });

  describe("Public Share Route (/r/:slug)", () => {
    it("returns identical 404 responses for missing, revoked, and expired links without leaking state", async () => {
      const db = createTestDb(env);
      const user = await createAuthenticatedUser("public-tester@example.com");
      const resume = await makeResume(db, user.user.id);

      // 1. Missing slug
      let resMissing: Response | null = null;
      try {
        await publicShareLoader({
          request: new Request("http://localhost:5173/r/nonexistent123"),
          context: { cloudflare: { env } },
          params: { slug: "nonexistent123" },
        } as never);
      } catch (err: any) {
        resMissing = err;
      }
      expect(resMissing).toBeInstanceOf(Response);
      expect(resMissing!.status).toBe(404);
      const bodyMissing = await resMissing!.text();

      // 2. Revoked / Disabled slug
      const initialLink = await upsertShareLink(db, user.user.id, resume.id);
      await revokeShareLink(db, user.user.id, resume.id);

      let resRevoked: Response | null = null;
      try {
        await publicShareLoader({
          request: new Request(`http://localhost:5173/r/${initialLink!.slug}`),
          context: { cloudflare: { env } },
          params: { slug: initialLink!.slug },
        } as never);
      } catch (err: any) {
        resRevoked = err;
      }
      expect(resRevoked).toBeInstanceOf(Response);
      expect(resRevoked!.status).toBe(404);
      const bodyRevoked = await resRevoked!.text();

      // 3. Expired slug (1 day in past)
      const pastDate = new Date(Date.now() - 24 * 3600 * 1000);
      const expiredResume = await makeResume(db, user.user.id);
      const expiredLink = await upsertShareLink(db, user.user.id, expiredResume.id, {
        expiresAt: pastDate,
      });

      let resExpired: Response | null = null;
      try {
        await publicShareLoader({
          request: new Request(`http://localhost:5173/r/${expiredLink!.slug}`),
          context: { cloudflare: { env } },
          params: { slug: expiredLink!.slug },
        } as never);
      } catch (err: any) {
        resExpired = err;
      }
      expect(resExpired).toBeInstanceOf(Response);
      expect(resExpired!.status).toBe(404);
      const bodyExpired = await resExpired!.text();

      // All 3 bodies must be completely IDENTICAL
      expect(bodyMissing).toBe("This link is unavailable");
      expect(bodyRevoked).toBe(bodyMissing);
      expect(bodyExpired).toBe(bodyMissing);

      // All 3 must send X-Robots-Tag: noindex, nofollow and Cache-Control: no-store
      expect(resMissing!.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
      expect(resRevoked!.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
      expect(resExpired!.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
      expect(resMissing!.headers.get("Cache-Control")).toBe("no-store");
    });

    it("public loader data isolates PII (no userId, email, passwordHash, resumeId, version)", async () => {
      const db = createTestDb(env);
      const user = await createAuthenticatedUser("pii-test@example.com");
      const resume = await makeResume(db, user.user.id);
      const link = await upsertShareLink(db, user.user.id, resume.id);

      const request = new Request(`http://localhost:5173/r/${link!.slug}`);
      const response = await publicShareLoader({
        request,
        context: { cloudflare: { env, ctx: { waitUntil: () => {} } } },
        params: { slug: link!.slug },
      } as never);

      expect(response.status).toBe(200);
      const data = (await response.json()) as any;

      // Required public properties
      expect(data.locked).toBe(false);
      expect(data.slug).toBe(link!.slug);
      expect(data.content).toBeDefined();
      expect(data.design).toBeDefined();

      // FORBIDDEN internal properties
      expect(data.userId).toBeUndefined();
      expect(data.userEmail).toBeUndefined();
      expect(data.accountEmail).toBeUndefined();
      expect(data.passwordHash).toBeUndefined();
      expect(data.resumeId).toBeUndefined();
      expect(data.version).toBeUndefined();
    });

    it("redacts contact details when hideContact is true", async () => {
      const db = createTestDb(env);
      const user = await createAuthenticatedUser("contact-hide@example.com");
      const content = createDefaultContent();
      content.personal.email = "private-person@example.com";
      content.personal.phone = "+1 (555) 987-6543";

      const resume = await makeResume(db, user.user.id, { content, title: "Private Contact Resume" });
      const link = await upsertShareLink(db, user.user.id, resume.id, {
        hideContact: true,
      });

      const request = new Request(`http://localhost:5173/r/${link!.slug}`);
      const response = await publicShareLoader({
        request,
        context: { cloudflare: { env, ctx: { waitUntil: () => {} } } },
        params: { slug: link!.slug },
      } as never);

      const data = (await response.json()) as any;
      expect(data.hideContact).toBe(true);
      expect(data.content.personal.email).toBe("");
      expect(data.content.personal.phone).toBe("");

      // Grep serialization to confirm private strings never appear
      const jsonStr = JSON.stringify(data);
      expect(jsonStr).not.toContain("private-person@example.com");
      expect(jsonStr).not.toContain("+1 (555) 987-6543");
    });

    it("manages password protection flow: lock, wrong password, correct password, unlock cookie, cookie tampering", async () => {
      const db = createTestDb(env);
      const user = await createAuthenticatedUser("pwd-flow@example.com");
      const password = "ValidPassword123!";
      const hash = await hashSharePassword(password);

      const resume = await makeResume(db, user.user.id, {
        title: "Top Secret Candidate",
      });
      const link = await upsertShareLink(db, user.user.id, resume.id, {
        passwordHash: hash,
      });

      // 1. Initial request without cookie returns locked=true and NO content/name
      const lockedReq = new Request(`http://localhost:5173/r/${link!.slug}`);
      const lockedRes = await publicShareLoader({
        request: lockedReq,
        context: { cloudflare: { env } },
        params: { slug: link!.slug },
      } as never);

      const lockedData = (await lockedRes.json()) as any;
      expect(lockedData.locked).toBe(true);
      expect(lockedData.slug).toBe(link!.slug);
      expect(lockedData.content).toBeUndefined();
      expect(lockedData.title).toBeUndefined();

      // 2. Action: wrong password rejected
      const wrongForm = new FormData();
      wrongForm.set("intent", "unlock");
      wrongForm.set("password", "WrongPassword123!");
      const wrongReq = new Request(`http://localhost:5173/r/${link!.slug}`, {
        method: "POST",
        body: wrongForm,
      });
      const wrongRes = await publicShareAction({
        request: wrongReq,
        context: { cloudflare: { env } },
        params: { slug: link!.slug },
      } as never);
      expect(wrongRes.status).toBe(400);
      expect((await wrongRes.json() as any).error).toBe("Incorrect password. Please try again.");

      // 3. Action: correct password sets signed unlock cookie
      const correctForm = new FormData();
      correctForm.set("intent", "unlock");
      correctForm.set("password", password);
      const correctReq = new Request(`http://localhost:5173/r/${link!.slug}`, {
        method: "POST",
        body: correctForm,
      });
      const correctRes = await publicShareAction({
        request: correctReq,
        context: { cloudflare: { env } },
        params: { slug: link!.slug },
      } as never);
      expect(correctRes.status).toBe(200);

      const setCookieHeader = correctRes.headers.get("Set-Cookie");
      expect(setCookieHeader).toBeDefined();
      expect(setCookieHeader).toContain(`rs_${link!.slug}=`);
      expect(setCookieHeader).toContain("HttpOnly");

      // Extract cookie value for subsequent loader call
      const cookieVal = setCookieHeader!.split(";")[0];

      // 4. Request with valid cookie opens resume
      const unlockedReq = new Request(`http://localhost:5173/r/${link!.slug}`, {
        headers: { Cookie: cookieVal! },
      });
      const unlockedRes = await publicShareLoader({
        request: unlockedReq,
        context: { cloudflare: { env, ctx: { waitUntil: () => {} } } },
        params: { slug: link!.slug },
      } as never);
      const unlockedData = (await unlockedRes.json()) as any;
      expect(unlockedData.locked).toBe(false);
      expect(unlockedData.content).toBeDefined();

      // 5. Tampered cookie is rejected
      const tamperedReq = new Request(`http://localhost:5173/r/${link!.slug}`, {
        headers: { Cookie: `rs_${link!.slug}=tampered.token.here` },
      });
      const tamperedRes = await publicShareLoader({
        request: tamperedReq,
        context: { cloudflare: { env } },
        params: { slug: link!.slug },
      } as never);
      expect((await tamperedRes.json() as any).locked).toBe(true);

      // 6. Changing the password invalidates existing cookie immediately
      const newHash = await hashSharePassword("BrandNewPassword123!");
      await upsertShareLink(db, user.user.id, resume.id, { passwordHash: newHash });

      const oldCookieReq = new Request(`http://localhost:5173/r/${link!.slug}`, {
        headers: { Cookie: cookieVal! },
      });
      const oldCookieRes = await publicShareLoader({
        request: oldCookieReq,
        context: { cloudflare: { env } },
        params: { slug: link!.slug },
      } as never);
      expect((await oldCookieRes.json() as any).locked).toBe(true);
    });

    it("verifies security headers via publicShareHeaders export", () => {
      const loaderHeaders = new Headers();
      loaderHeaders.set("X-Robots-Tag", "noindex, nofollow");

      const headers = publicShareHeaders({
        loaderHeaders,
        parentHeaders: new Headers(),
      } as never);

      expect(headers["Cache-Control"]).toBe("no-store");
      expect(headers["X-Content-Type-Options"]).toBe("nosniff");
      expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
      expect(headers["X-Frame-Options"]).toBe("DENY");
      expect(headers["X-Robots-Tag"]).toBe("noindex, nofollow");
    });

    it("increments view count for real human visitors, dedupes repeats, and ignores bots & owner", async () => {
      const db = createTestDb(env);
      const user = await createAuthenticatedUser("views-test@example.com");
      const resume = await makeResume(db, user.user.id);
      const link = await upsertShareLink(db, user.user.id, resume.id);

      // Helper to fetch live viewCount directly from DB
      const getViewCount = async () => {
        const raw = await getRawShareLinkBySlug(db, link!.slug);
        return raw?.viewCount ?? 0;
      };

      expect(await getViewCount()).toBe(0);

      // 1. Bot request (Googlebot) -> view count NOT incremented
      let botWait: Promise<any> | null = null;
      const botReq = new Request(`http://localhost:5173/r/${link!.slug}`, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" },
      });
      await publicShareLoader({
        request: botReq,
        context: {
          cloudflare: {
            env,
            ctx: { waitUntil: (p: any) => { botWait = p; } },
          },
        },
        params: { slug: link!.slug },
      } as never);
      if (botWait) await botWait;
      expect(await getViewCount()).toBe(0);

      // 2. Owner session -> view count NOT incremented
      let ownerWait: Promise<any> | null = null;
      const ownerReq = new Request(`http://localhost:5173/r/${link!.slug}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
          Cookie: user.cookie,
        },
      });
      await publicShareLoader({
        request: ownerReq,
        context: {
          cloudflare: {
            env,
            ctx: { waitUntil: (p: any) => { ownerWait = p; } },
          },
        },
        params: { slug: link!.slug },
      } as never);
      if (ownerWait) await ownerWait;
      expect(await getViewCount()).toBe(0);

      // 3. First real human visit -> view count incremented to 1
      let humanWait: Promise<any> | null = null;
      const humanReq = new Request(`http://localhost:5173/r/${link!.slug}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
          Accept: "text/html,application/xhtml+xml",
        },
      });
      const humanRes = await publicShareLoader({
        request: humanReq,
        context: {
          cloudflare: {
            env,
            ctx: { waitUntil: (p: any) => { humanWait = p; } },
          },
        },
        params: { slug: link!.slug },
      } as never);
      if (humanWait) await humanWait;
      expect(await getViewCount()).toBe(1);

      // Verify response returned dedupe cookie
      const dedupeCookie = humanRes.headers.get("Set-Cookie");
      expect(dedupeCookie).toContain(`rv_${link!.slug}=1`);

      // 4. Second human visit with dedupe cookie -> view count NOT incremented
      let repeatWait: Promise<any> | null = null;
      const repeatReq = new Request(`http://localhost:5173/r/${link!.slug}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
          Accept: "text/html,application/xhtml+xml",
          Cookie: `rv_${link!.slug}=1`,
        },
      });
      await publicShareLoader({
        request: repeatReq,
        context: {
          cloudflare: {
            env,
            ctx: { waitUntil: (p: any) => { repeatWait = p; } },
          },
        },
        params: { slug: link!.slug },
      } as never);
      if (repeatWait) await repeatWait;
      expect(await getViewCount()).toBe(1);
    });
  });
});
