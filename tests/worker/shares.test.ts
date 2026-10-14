import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import { createTestDb, makeUser } from "../helpers/factories";
import { setupTestDatabase } from "../helpers/setup-db";
import { createResume } from "~/db/queries/resumes";
import {
  upsertShareLink,
  regenerateSlug,
  revokeShareLink,
  deleteShareLink,
  getPublicResumeBySlug,
  recordView,
  getShareLinkByResumeId,
  countActiveShareLinks,
} from "~/db/queries/shares";
import { shareLinks } from "~/db/schema";
import { eq } from "drizzle-orm";

describe("Shares Query Module", () => {
  beforeAll(async () => {
    await setupTestDatabase(env);
  });

  it("upserts share link with 14-char slug and default permissions", async () => {
    const db = createTestDb(env);
    const user = await makeUser(db);
    const resume = await createResume(db, user.id);

    const share = await upsertShareLink(db, user.id, resume.id);
    expect(share).not.toBeNull();
    expect(share!.resumeId).toBe(resume.id);
    expect(share!.slug).toHaveLength(14);
    expect(share!.isActive).toBe(true);
    expect(share!.allowDownload).toBe(true);
    expect(share!.noindex).toBe(true);
    expect(share!.hideContact).toBe(false);
    expect(share!.viewCount).toBe(0);

    // Upserting again on same resume updates options without creating a new row
    const updated = await upsertShareLink(db, user.id, resume.id, {
      allowDownload: false,
      hideContact: true,
    });
    expect(updated?.id).toBe(share!.id);
    expect(updated?.allowDownload).toBe(false);
    expect(updated?.hideContact).toBe(true);
  });

  it("regenerates slug preserving options", async () => {
    const db = createTestDb(env);
    const user = await makeUser(db);
    const resume = await createResume(db, user.id);

    const initial = await upsertShareLink(db, user.id, resume.id);
    const regenerated = await regenerateSlug(db, user.id, resume.id);

    expect(regenerated).not.toBeNull();
    expect(regenerated!.slug).toHaveLength(14);
    expect(regenerated!.slug).not.toBe(initial!.slug);
  });

  it("revokes and deletes share link", async () => {
    const db = createTestDb(env);
    const user = await makeUser(db);
    const resume = await createResume(db, user.id);

    await upsertShareLink(db, user.id, resume.id);
    const revoked = await revokeShareLink(db, user.id, resume.id);
    expect(revoked).toBe(true);

    const deleted = await deleteShareLink(db, user.id, resume.id);
    expect(deleted).toBe(true);
  });

  describe("Public sanitized fetch (getPublicResumeBySlug)", () => {
    it("returns 'ok' status and sanitized projection for active public links (NEVER leaks userId, email, or passwordHash)", async () => {
      const db = createTestDb(env);
      const user = await makeUser(db);
      const resume = await createResume(db, user.id, { title: "Public Profile" });

      const share = await upsertShareLink(db, user.id, resume.id);
      const result = await getPublicResumeBySlug(db, share!.slug);

      expect(result.status).toBe("ok");
      if (result.status === "ok") {
        expect(result.data.title).toBe("Public Profile");
        expect(result.data.templateId).toBe("modern");
        expect(result.data.content).toBeDefined();
        expect(result.data.design).toBeDefined();
        expect(result.data.hasPassword).toBe(false);

        // Verify sensitive fields are strictly omitted
        expect((result.data as Record<string, unknown>).userId).toBeUndefined();
        expect((result.data as Record<string, unknown>).email).toBeUndefined();
        expect((result.data as Record<string, unknown>).passwordHash).toBeUndefined();
      }
    });

    it("returns 'not_found' for non-existent slug", async () => {
      const db = createTestDb(env);
      const result = await getPublicResumeBySlug(db, "unknown-slug-999");
      expect(result.status).toBe("not_found");
    });

    it("returns 'revoked' when share link isActive is false", async () => {
      const db = createTestDb(env);
      const user = await makeUser(db);
      const resume = await createResume(db, user.id);

      const share = await upsertShareLink(db, user.id, resume.id);
      await revokeShareLink(db, user.id, resume.id);

      const result = await getPublicResumeBySlug(db, share!.slug);
      expect(result.status).toBe("revoked");
    });

    it("returns 'expired' when expiresAt timestamp has passed", async () => {
      const db = createTestDb(env);
      const user = await makeUser(db);
      const resume = await createResume(db, user.id);

      const share = await upsertShareLink(db, user.id, resume.id, {
        expiresAt: new Date(Date.now() - 3600 * 1000), // 1 hour ago
      });

      const result = await getPublicResumeBySlug(db, share!.slug);
      expect(result.status).toBe("expired");
    });

    it("returns 'password_required' when passwordHash is present without revealing hash", async () => {
      const db = createTestDb(env);
      const user = await makeUser(db);
      const resume = await createResume(db, user.id);

      const share = await upsertShareLink(db, user.id, resume.id, {
        passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$fakeHash",
      });

      const result = await getPublicResumeBySlug(db, share!.slug);
      expect(result.status).toBe("password_required");
      if (result.status === "password_required") {
        expect(result.hasPassword).toBe(true);
        expect((result as Record<string, unknown>).passwordHash).toBeUndefined();
      }
    });
  });

  describe("recordView and Bot Filter", () => {
    it("increments viewCount for human visitors", async () => {
      const db = createTestDb(env);
      const user = await makeUser(db);
      const resume = await createResume(db, user.id);
      const share = await upsertShareLink(db, user.id, resume.id);

      const recorded = await recordView(db, share!.slug, { isBot: false });
      expect(recorded).toBe(true);

      const [row] = await db.select().from(shareLinks).where(eq(shareLinks.id, share!.id));
      expect(row?.viewCount).toBe(1);
    });

    it("skips write when requester is an automated bot/crawler (saves D1 write budget)", async () => {
      const db = createTestDb(env);
      const user = await makeUser(db);
      const resume = await createResume(db, user.id);
      const share = await upsertShareLink(db, user.id, resume.id);

      const recorded = await recordView(db, share!.slug, { isBot: true });
      expect(recorded).toBe(false);

      const [row] = await db.select().from(shareLinks).where(eq(shareLinks.id, share!.id));
      expect(row?.viewCount).toBe(0);
    });
  });

  describe("Authorization Isolation", () => {
    it("prevents User B from upserting, regenerating, revoking, or deleting User A's share link", async () => {
      const db = createTestDb(env);
      const userA = await makeUser(db);
      const userB = await makeUser(db);

      const resumeA = await createResume(db, userA.id);
      await upsertShareLink(db, userA.id, resumeA.id);

      // User B attempts to upsert share link on User A's resume
      const unauthorizedUpsert = await upsertShareLink(db, userB.id, resumeA.id);
      expect(unauthorizedUpsert).toBeNull();

      // User B attempts to regenerate slug
      const unauthorizedRegen = await regenerateSlug(db, userB.id, resumeA.id);
      expect(unauthorizedRegen).toBeNull();

      // User B attempts to revoke share link
      const unauthorizedRevoke = await revokeShareLink(db, userB.id, resumeA.id);
      expect(unauthorizedRevoke).toBe(false);

      // User B attempts to delete share link
      const unauthorizedDelete = await deleteShareLink(db, userB.id, resumeA.id);
      expect(unauthorizedDelete).toBe(false);
    });
  });

  describe("Owner Share Link Queries", () => {
    it("returns owner share link without passwordHash and determines real status", async () => {
      const db = createTestDb(env);
      const user = await makeUser(db);
      const resume = await createResume(db, user.id);

      await upsertShareLink(db, user.id, resume.id, {
        hideContact: true,
        passwordHash: "secure-hash-123",
      });

      const ownerLink = await getShareLinkByResumeId(db, user.id, resume.id);
      expect(ownerLink).not.toBeNull();
      expect(ownerLink!.enabled).toBe(true);
      expect(ownerLink!.hasPassword).toBe(true);
      expect((ownerLink as any).passwordHash).toBeUndefined();
      expect(ownerLink!.hideContact).toBe(true);
      expect(ownerLink!.status).toBe("protected");
      expect(ownerLink!.slugUrl).toMatch(/^\/r\/[A-Za-z0-9_-]{14}$/);

      const activeCount = await countActiveShareLinks(db, user.id);
      expect(activeCount).toBe(1);

      // Revoking turns status to disabled
      await revokeShareLink(db, user.id, resume.id);
      const revokedOwnerLink = await getShareLinkByResumeId(db, user.id, resume.id);
      expect(revokedOwnerLink!.status).toBe("disabled");
      expect(await countActiveShareLinks(db, user.id)).toBe(0);
    });
  });
});
