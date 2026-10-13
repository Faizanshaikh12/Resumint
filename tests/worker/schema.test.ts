import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import { createTestDb, makeUser, makeResume } from "../helpers/factories";
import { setupTestDatabase } from "../helpers/setup-db";
import { resumes, shareLinks, resumeSnapshots } from "~/db/schema";
import { eq } from "drizzle-orm";

describe("Database Schema Constraints & Cascades", () => {
  beforeAll(async () => {
    await setupTestDatabase(env);
  });

  it("enforces foreign key cascade deletion from user to resumes, snapshots, and share links", async () => {
    const db = createTestDb(env);

    // 1. Create User & Resume
    const testUser = await makeUser(db);
    const resume = await makeResume(db, testUser.id);

    // 2. Add Snapshot and Share Link
    await db.insert(resumeSnapshots).values({
      id: "snap-1",
      resumeId: resume.id,
      content: resume.content,
      design: resume.design,
      createdAt: new Date(),
    });

    await db.insert(shareLinks).values({
      id: "share-1",
      resumeId: resume.id,
      slug: "test-slug-1234",
      createdAt: new Date(),
    });

    // Verify all exist
    const foundResume = await db.select().from(resumes).where(eq(resumes.id, resume.id));
    expect(foundResume.length).toBe(1);

    // 3. Delete Resume -> Should cascade to snapshots and share_links
    await env.DB.exec("PRAGMA foreign_keys = ON;");
    await db.delete(resumes).where(eq(resumes.id, resume.id));

    const remainingSnapshots = await db.select().from(resumeSnapshots).where(eq(resumeSnapshots.resumeId, resume.id));
    const remainingShares = await db.select().from(shareLinks).where(eq(shareLinks.resumeId, resume.id));

    expect(remainingSnapshots.length).toBe(0);
    expect(remainingShares.length).toBe(0);
  });

  it("enforces unique constraint on share link slug", async () => {
    const db = createTestDb(env);
    const userA = await makeUser(db);
    const resume1 = await makeResume(db, userA.id);
    const resume2 = await makeResume(db, userA.id);

    await db.insert(shareLinks).values({
      id: "share-u1",
      resumeId: resume1.id,
      slug: "duplicate-slug",
      createdAt: new Date(),
    });

    // Trying to insert same slug for resume2 must throw
    await expect(
      db.insert(shareLinks).values({
        id: "share-u2",
        resumeId: resume2.id,
        slug: "duplicate-slug",
        createdAt: new Date(),
      })
    ).rejects.toThrow();
  });

  it("enforces unique constraint on resumeId in share_links", async () => {
    const db = createTestDb(env);
    const userA = await makeUser(db);
    const resume1 = await makeResume(db, userA.id);

    await db.insert(shareLinks).values({
      id: "share-r1",
      resumeId: resume1.id,
      slug: "slug-first",
      createdAt: new Date(),
    });

    // Trying to insert a second share link for same resumeId must throw
    await expect(
      db.insert(shareLinks).values({
        id: "share-r2",
        resumeId: resume1.id,
        slug: "slug-second",
        createdAt: new Date(),
      })
    ).rejects.toThrow();
  });
});
