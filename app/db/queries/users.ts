import { eq, inArray, lt } from "drizzle-orm";
import type { DrizzleD1 } from "../helpers.server";
import { user, session, account, resumes, resumeSnapshots, shareLinks } from "../schema";
import type { ResumeContent, ResumeDesign } from "~/lib/schemas/resume";

export interface UserAccountStats {
  email: string;
  name: string;
  createdAt: Date;
  resumeCount: number;
}

export interface ExportedResumeRecord {
  id: string;
  title: string;
  templateId: string;
  content: ResumeContent;
  design: ResumeDesign;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDataExportEnvelope {
  app: "resumint";
  schemaVersion: 1;
  exportedAt: string;
  userId: string;
  userEmail: string;
  resumeCount: number;
  resumes: ExportedResumeRecord[];
}

/**
 * Retrieves high-level account stats for the settings page.
 */
export async function getUserAccountStats(
  db: DrizzleD1,
  userId: string
): Promise<UserAccountStats | null> {
  const userRecord = await db
    .select({
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.id, userId))
    .get();

  if (!userRecord) return null;

  const userResumes = await db
    .select({ id: resumes.id })
    .from(resumes)
    .where(eq(resumes.userId, userId))
    .all();

  return {
    email: userRecord.email,
    name: userRecord.name,
    createdAt: userRecord.createdAt,
    resumeCount: userResumes.length,
  };
}

/**
 * Exports all resumes belonging to a user in standard Phase 7 envelope format.
 */
export async function exportAllUserData(
  db: DrizzleD1,
  userId: string,
  userEmail: string
): Promise<UserDataExportEnvelope> {
  const userResumes = await db
    .select({
      id: resumes.id,
      title: resumes.title,
      templateId: resumes.templateId,
      content: resumes.content,
      design: resumes.design,
      version: resumes.version,
      createdAt: resumes.createdAt,
      updatedAt: resumes.updatedAt,
    })
    .from(resumes)
    .where(eq(resumes.userId, userId))
    .all();

  return {
    app: "resumint",
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    userId,
    userEmail,
    resumeCount: userResumes.length,
    resumes: userResumes as ExportedResumeRecord[],
  };
}

/**
 * Permanently deletes a user and cascades all related records (resumes,
 * snapshots, share links, sessions, accounts) with defensive sequential deletes.
 */
export async function deleteUserAccount(db: DrizzleD1, userId: string): Promise<void> {
  // 1. Find all user's resume IDs
  const userResumes = await db
    .select({ id: resumes.id })
    .from(resumes)
    .where(eq(resumes.userId, userId))
    .all();

  const resumeIds = userResumes.map((r) => r.id);

  if (resumeIds.length > 0) {
    // 2. Delete share links associated with those resumes
    await db.delete(shareLinks).where(inArray(shareLinks.resumeId, resumeIds)).run();

    // 3. Delete snapshots associated with those resumes
    await db.delete(resumeSnapshots).where(inArray(resumeSnapshots.resumeId, resumeIds)).run();

    // 4. Delete the resumes
    await db.delete(resumes).where(eq(resumes.userId, userId)).run();
  }

  // 5. Delete authentication sessions and accounts
  await db.delete(session).where(eq(session.userId, userId)).run();
  await db.delete(account).where(eq(account.userId, userId)).run();

  // 6. Delete the user record
  await db.delete(user).where(eq(user.id, userId)).run();
}

/**
 * Maintenance query: cleans up expired sessions.
 */
export async function cleanupExpiredSessions(db: DrizzleD1, now = new Date()): Promise<number> {
  const result = await db.delete(session).where(lt(session.expiresAt, now)).run();
  return result.meta.changes;
}
