import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import { createTestDb, makeUser } from "../helpers/factories";
import { setupTestDatabase } from "../helpers/setup-db";
import {
  createResume,
  getResume,
  listResumes,
  updateResume,
  renameResume,
  deleteResume,
  duplicateResume,
} from "~/db/queries/resumes";
import { createDefaultContent, createDefaultDesign } from "~/lib/resume/defaults";

describe("Resumes Query Module", () => {
  beforeAll(async () => {
    await setupTestDatabase(env);
  });

  describe("CRUD Operations", () => {
    it("creates a resume with default content and design if omitted", async () => {
      const db = createTestDb(env);
      const user = await makeUser(db);

      const resume = await createResume(db, user.id);
      expect(resume).toBeDefined();
      expect(resume.id).toHaveLength(12);
      expect(resume.userId).toBe(user.id);
      expect(resume.title).toBe("Untitled Resume");
      expect(resume.templateId).toBe("modern");
      expect(resume.version).toBe(1);
      expect(resume.content.personal.name).toBe("Alex Morgan");
      expect(resume.design.accentColor).toBe("#2563eb");
    });

    it("creates a resume with custom title and templateId", async () => {
      const db = createTestDb(env);
      const user = await makeUser(db);

      const resume = await createResume(db, user.id, {
        title: "Senior Engineer CV",
        templateId: "technical",
      });
      expect(resume.title).toBe("Senior Engineer CV");
      expect(resume.templateId).toBe("technical");
    });

    it("lists resumes returning only lightweight metadata (NO content/design blobs)", async () => {
      const db = createTestDb(env);
      const user = await makeUser(db);

      await createResume(db, user.id, { title: "Resume Alpha" });
      await createResume(db, user.id, { title: "Resume Beta" });

      const list = await listResumes(db, user.id);
      expect(list.length).toBeGreaterThanOrEqual(2);

      const first = list[0]!;
      expect(first).toHaveProperty("id");
      expect(first).toHaveProperty("title");
      expect(first).toHaveProperty("templateId");
      expect(first).toHaveProperty("version");
      expect(first).toHaveProperty("createdAt");
      expect(first).toHaveProperty("updatedAt");
      // CRITICAL: verify content & design blobs are NOT selected to preserve D1 read budget
      expect((first as Record<string, unknown>).content).toBeUndefined();
      expect((first as Record<string, unknown>).design).toBeUndefined();
    });

    it("supports search, sorting, and pagination in listResumes", async () => {
      const db = createTestDb(env);
      const user = await makeUser(db);

      await createResume(db, user.id, { title: "Software Architect" });
      await createResume(db, user.id, { title: "DevOps Engineer" });
      await createResume(db, user.id, { title: "Software Specialist" });

      // Search
      const searchResults = await listResumes(db, user.id, { search: "Software" });
      expect(searchResults.length).toBe(2);
      expect(searchResults.every((r) => r.title.includes("Software"))).toBe(true);

      // Sort by title asc
      const sortedByTitle = await listResumes(db, user.id, { sort: "title" });
      expect(sortedByTitle.length).toBe(3);
      expect(sortedByTitle[0]!.title).toBe("DevOps Engineer");

      // Limit pagination
      const limited = await listResumes(db, user.id, { limit: 2 });
      expect(limited.length).toBe(2);
    });

    it("retrieves full resume by id for owner", async () => {
      const db = createTestDb(env);
      const user = await makeUser(db);

      const created = await createResume(db, user.id, { title: "Full Detail Check" });
      const fetched = await getResume(db, user.id, created.id);

      expect(fetched).not.toBeNull();
      expect(fetched!.id).toBe(created.id);
      expect(fetched!.content).toBeDefined();
      expect(fetched!.design).toBeDefined();
    });

    it("renames an owned resume", async () => {
      const db = createTestDb(env);
      const user = await makeUser(db);

      const resume = await createResume(db, user.id, { title: "Old Title" });
      const renamed = await renameResume(db, user.id, resume.id, "New Title");
      expect(renamed).toBe(true);

      const updated = await getResume(db, user.id, resume.id);
      expect(updated?.title).toBe("New Title");
    });

    it("deletes an owned resume", async () => {
      const db = createTestDb(env);
      const user = await makeUser(db);

      const resume = await createResume(db, user.id);
      const deleted = await deleteResume(db, user.id, resume.id);
      expect(deleted).toBe(true);

      const fetched = await getResume(db, user.id, resume.id);
      expect(fetched).toBeNull();
    });

    it("duplicates an owned resume with (Copy) suffix, new ID, and version 1", async () => {
      const db = createTestDb(env);
      const user = await makeUser(db);

      const original = await createResume(db, user.id, { title: "Master Resume" });
      const copy = await duplicateResume(db, user.id, original.id);

      expect(copy).not.toBeNull();
      expect(copy!.id).not.toBe(original.id);
      expect(copy!.title).toBe("Master Resume (Copy)");
      expect(copy!.version).toBe(1);
      expect(copy!.userId).toBe(user.id);
      expect(copy!.content.personal.name).toBe(original.content.personal.name);
    });
  });

  describe("Authorization Isolation", () => {
    it("prevents User B from accessing, modifying, or duplicating User A's resume", async () => {
      const db = createTestDb(env);
      const userA = await makeUser(db);
      const userB = await makeUser(db);

      const resumeA = await createResume(db, userA.id, { title: "User A Confidential" });

      // User B cannot get User A's resume
      const getResult = await getResume(db, userB.id, resumeA.id);
      expect(getResult).toBeNull();

      // User B cannot update User A's resume
      const updateResult = await updateResume(db, userB.id, resumeA.id, {
        title: "Hacked Title",
        expectedVersion: 1,
      });
      expect(updateResult.ok).toBe(false);
      expect(updateResult.reason).toBe("not_found");

      // User B cannot rename User A's resume
      const renameResult = await renameResume(db, userB.id, resumeA.id, "Hacked Title");
      expect(renameResult).toBe(false);

      // User B cannot delete User A's resume
      const deleteResult = await deleteResume(db, userB.id, resumeA.id);
      expect(deleteResult).toBe(false);

      // User B cannot duplicate User A's resume (returns null)
      const duplicateResult = await duplicateResume(db, userB.id, resumeA.id);
      expect(duplicateResult).toBeNull();

      // Verify User A's resume remains untouched
      const originalCheck = await getResume(db, userA.id, resumeA.id);
      expect(originalCheck?.title).toBe("User A Confidential");
    });
  });

  describe("Optimistic Concurrency Control", () => {
    it("successfully increments version when expectedVersion matches", async () => {
      const db = createTestDb(env);
      const user = await makeUser(db);

      const resume = await createResume(db, user.id, { title: "V1 Resume" });
      expect(resume.version).toBe(1);

      const updated = await updateResume(db, user.id, resume.id, {
        title: "V2 Resume",
        expectedVersion: 1,
      });

      expect(updated.ok).toBe(true);
      if (updated.ok) {
        expect(updated.resume.version).toBe(2);
        expect(updated.resume.title).toBe("V2 Resume");
      }
    });

    it("returns conflict and writes nothing when expectedVersion is stale", async () => {
      const db = createTestDb(env);
      const user = await makeUser(db);

      const resume = await createResume(db, user.id);
      // Advance version to 2
      await updateResume(db, user.id, resume.id, {
        title: "Step 1",
        expectedVersion: 1,
      });

      // Stale attempt with expectedVersion 1
      const staleAttempt = await updateResume(db, user.id, resume.id, {
        title: "Stale Overwrite",
        expectedVersion: 1,
      });

      expect(staleAttempt.ok).toBe(false);
      expect(staleAttempt.reason).toBe("conflict");

      // Verify DB still holds Step 1 with version 2
      const current = await getResume(db, user.id, resume.id);
      expect(current?.version).toBe(2);
      expect(current?.title).toBe("Step 1");
    });
  });

  describe("Validation & Boundary Caps", () => {
    it("rejects invalid JSON content before hitting the database", async () => {
      const db = createTestDb(env);
      const user = await makeUser(db);

      const resume = await createResume(db, user.id);

      // Malformed content (invalid types)
      const invalidContent = {
        personal: "Not an object, invalid schema",
      } as any;

      await expect(
        updateResume(db, user.id, resume.id, {
          content: invalidContent,
          expectedVersion: 1,
        })
      ).rejects.toThrow();
    });

    it("rejects oversized content exceeding section item limits", async () => {
      const db = createTestDb(env);
      const user = await makeUser(db);
      const resume = await createResume(db, user.id);

      const content = createDefaultContent();
      // Cap is 30 experience entries; create 35
      content.experience = Array.from({ length: 35 }).map((_, i) => ({
        id: `exp-${i}`,
        company: `Company ${i}`,
        position: `Role ${i}`,
        location: "City",
        date: { start: "2020", end: "2021", current: false },
        bullets: ["Did things"],
      }));

      await expect(
        updateResume(db, user.id, resume.id, {
          content,
          expectedVersion: 1,
        })
      ).rejects.toThrow();
    });
  });
});
