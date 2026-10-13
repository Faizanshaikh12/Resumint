import { eq, and, desc, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { resumeSnapshots, resumes, type ResumeSnapshot, type Resume } from "../schema";
import type { Database } from "../client";
import { getResume } from "./resumes";

export const MAX_SNAPSHOTS_PER_RESUME = 20;

export async function createSnapshot(
  db: Database,
  userId: string,
  resumeId: string,
  label?: string
): Promise<ResumeSnapshot | null> {
  const resume = await getResume(db, userId, resumeId);
  if (!resume) return null;

  const newSnapshot = {
    id: nanoid(),
    resumeId,
    content: resume.content,
    design: resume.design,
    label: label?.trim() || null,
    createdAt: new Date(),
  };

  const [inserted] = await db.insert(resumeSnapshots).values(newSnapshot).returning();
  if (!inserted) return null;

  // Auto-prune older snapshots beyond newest 20
  await pruneSnapshots(db, resumeId);

  return inserted;
}

export async function listSnapshots(
  db: Database,
  userId: string,
  resumeId: string
): Promise<ResumeSnapshot[]> {
  const resume = await getResume(db, userId, resumeId);
  if (!resume) return [];

  return db
    .select()
    .from(resumeSnapshots)
    .where(eq(resumeSnapshots.resumeId, resumeId))
    .orderBy(desc(resumeSnapshots.createdAt));
}

export async function restoreSnapshot(
  db: Database,
  userId: string,
  resumeId: string,
  snapshotId: string
): Promise<Resume | null> {
  const resume = await getResume(db, userId, resumeId);
  if (!resume) return null;

  const [snapshot] = await db
    .select()
    .from(resumeSnapshots)
    .where(and(eq(resumeSnapshots.id, snapshotId), eq(resumeSnapshots.resumeId, resumeId)))
    .limit(1);

  if (!snapshot) return null;

  // 1. Create a pre-restore snapshot of current state
  await db.insert(resumeSnapshots).values({
    id: nanoid(),
    resumeId,
    content: resume.content,
    design: resume.design,
    label: `Pre-restore (v${resume.version})`,
    createdAt: new Date(),
  });

  // 2. Update resume with the snapshot's content and design, bumping version
  const [restored] = await db
    .update(resumes)
    .set({
      content: snapshot.content,
      design: snapshot.design,
      version: resume.version + 1,
      updatedAt: new Date(),
    })
    .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)))
    .returning();

  // 3. Ensure prune limits
  await pruneSnapshots(db, resumeId);

  return restored ?? null;
}

async function pruneSnapshots(db: Database, resumeId: string): Promise<void> {
  // Retrieve all snapshot IDs ordered newest first
  const existing = await db
    .select({ id: resumeSnapshots.id })
    .from(resumeSnapshots)
    .where(eq(resumeSnapshots.resumeId, resumeId))
    .orderBy(desc(resumeSnapshots.createdAt));

  if (existing.length > MAX_SNAPSHOTS_PER_RESUME) {
    const toDelete = existing.slice(MAX_SNAPSHOTS_PER_RESUME).map((s) => s.id);
    if (toDelete.length > 0) {
      await db.delete(resumeSnapshots).where(inArray(resumeSnapshots.id, toDelete));
    }
  }
}
