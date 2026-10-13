import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import { createTestDb, makeUser } from "../helpers/factories";
import { setupTestDatabase } from "../helpers/setup-db";
import { createResume, updateResume, getResume } from "~/db/queries/resumes";
import {
  createSnapshot,
  listSnapshots,
  restoreSnapshot,
  MAX_SNAPSHOTS_PER_RESUME,
} from "~/db/queries/snapshots";

describe("Snapshots Query Module", () => {
  beforeAll(async () => {
    await setupTestDatabase(env);
  });

  it("creates a snapshot for owned resume with custom label", async () => {
    const db = createTestDb(env);
    const user = await makeUser(db);
    const resume = await createResume(db, user.id, { title: "Snapshot Base" });

    const snapshot = await createSnapshot(db, user.id, resume.id, "Milestone 1");
    expect(snapshot).not.toBeNull();
    expect(snapshot!.resumeId).toBe(resume.id);
    expect(snapshot!.label).toBe("Milestone 1");
    expect(snapshot!.content).toEqual(resume.content);
    expect(snapshot!.design).toEqual(resume.design);
  });

  it("lists snapshots in descending chronological order", async () => {
    const db = createTestDb(env);
    const user = await makeUser(db);
    const resume = await createResume(db, user.id);

    await createSnapshot(db, user.id, resume.id, "Snap A");
    await createSnapshot(db, user.id, resume.id, "Snap B");

    const list = await listSnapshots(db, user.id, resume.id);
    expect(list.length).toBe(2);
    expect(list[0]!.label).toBe("Snap B");
    expect(list[1]!.label).toBe("Snap A");
  });

  it("restores snapshot, bumps resume version, and creates a pre-restore backup", async () => {
    const db = createTestDb(env);
    const user = await makeUser(db);
    const resume = await createResume(db, user.id);

    // Initial snapshot at version 1
    const originalSnap = await createSnapshot(db, user.id, resume.id, "Original State");
    expect(originalSnap).not.toBeNull();

    // Mutate resume to version 2 with altered name
    const modifiedContent = {
      ...resume.content,
      personal: { ...resume.content.personal, name: "Mutated Name" },
    };
    await updateResume(db, user.id, resume.id, {
      content: modifiedContent,
      expectedVersion: 1,
    });

    const updated = await getResume(db, user.id, resume.id);
    expect(updated?.version).toBe(2);
    expect(updated?.content.personal.name).toBe("Mutated Name");

    // Restore to original snapshot
    const restored = await restoreSnapshot(db, user.id, resume.id, originalSnap!.id);
    expect(restored).not.toBeNull();
    expect(restored!.version).toBe(3); // Version bumped
    expect(restored!.content.personal.name).toBe(resume.content.personal.name);

    // Verify pre-restore snapshot was generated
    const allSnaps = await listSnapshots(db, user.id, resume.id);
    const preRestoreSnap = allSnaps.find((s) => s.label?.startsWith("Pre-restore"));
    expect(preRestoreSnap).toBeDefined();
    expect(preRestoreSnap?.content.personal.name).toBe("Mutated Name");
  });

  it("prunes snapshots to retain at most 20 newest snapshots", async () => {
    const db = createTestDb(env);
    const user = await makeUser(db);
    const resume = await createResume(db, user.id);

    // Create 25 snapshots
    for (let i = 1; i <= 25; i++) {
      await createSnapshot(db, user.id, resume.id, `Snap ${i}`);
    }

    const snaps = await listSnapshots(db, user.id, resume.id);
    expect(snaps.length).toBe(MAX_SNAPSHOTS_PER_RESUME);
    expect(snaps[0]!.label).toBe("Snap 25");
  });

  it("enforces authorization isolation on snapshots", async () => {
    const db = createTestDb(env);
    const userA = await makeUser(db);
    const userB = await makeUser(db);

    const resumeA = await createResume(db, userA.id);
    const snapA = await createSnapshot(db, userA.id, resumeA.id, "Owner Snap");

    // User B cannot create snapshot for User A's resume
    const unauthorizedCreate = await createSnapshot(db, userB.id, resumeA.id, "Intruder Snap");
    expect(unauthorizedCreate).toBeNull();

    // User B cannot list snapshots of User A's resume
    const unauthorizedList = await listSnapshots(db, userB.id, resumeA.id);
    expect(unauthorizedList).toEqual([]);

    // User B cannot restore User A's snapshot
    const unauthorizedRestore = await restoreSnapshot(db, userB.id, resumeA.id, snapA!.id);
    expect(unauthorizedRestore).toBeNull();
  });
});
