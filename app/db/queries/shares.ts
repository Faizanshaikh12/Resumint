import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { shareLinks, resumes, type ShareLink, type InsertShareLink } from "../schema";
import type { Database } from "../client";
import { getResume } from "./resumes";
import type { ResumeContent, ResumeDesign } from "~/lib/schemas/resume";

export interface UpsertShareLinkOptions {
  allowDownload?: boolean;
  noindex?: boolean;
  passwordHash?: string | null;
  expiresAt?: Date | null;
}

export async function upsertShareLink(
  db: Database,
  userId: string,
  resumeId: string,
  options?: UpsertShareLinkOptions
): Promise<ShareLink | null> {
  const resume = await getResume(db, userId, resumeId);
  if (!resume) return null;

  const [existing] = await db
    .select()
    .from(shareLinks)
    .where(eq(shareLinks.resumeId, resumeId))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(shareLinks)
      .set({
        isActive: true,
        allowDownload: options?.allowDownload ?? existing.allowDownload,
        noindex: options?.noindex ?? existing.noindex,
        passwordHash:
          options?.passwordHash !== undefined ? options.passwordHash : existing.passwordHash,
        expiresAt: options?.expiresAt !== undefined ? options.expiresAt : existing.expiresAt,
      })
      .where(eq(shareLinks.id, existing.id))
      .returning();
    return updated ?? null;
  }

  const newLink: InsertShareLink = {
    id: nanoid(),
    resumeId,
    slug: nanoid(14),
    isActive: true,
    allowDownload: options?.allowDownload ?? true,
    noindex: options?.noindex ?? true,
    passwordHash: options?.passwordHash ?? null,
    expiresAt: options?.expiresAt ?? null,
    viewCount: 0,
    createdAt: new Date(),
  };

  const [inserted] = await db.insert(shareLinks).values(newLink).returning();
  return inserted ?? null;
}

export async function regenerateSlug(
  db: Database,
  userId: string,
  resumeId: string
): Promise<ShareLink | null> {
  const resume = await getResume(db, userId, resumeId);
  if (!resume) return null;

  const [updated] = await db
    .update(shareLinks)
    .set({
      slug: nanoid(14),
      isActive: true,
    })
    .where(eq(shareLinks.resumeId, resumeId))
    .returning();

  return updated ?? null;
}

export async function revokeShareLink(
  db: Database,
  userId: string,
  resumeId: string
): Promise<boolean> {
  const resume = await getResume(db, userId, resumeId);
  if (!resume) return false;

  const result = await db
    .update(shareLinks)
    .set({ isActive: false })
    .where(eq(shareLinks.resumeId, resumeId));

  return (result.meta?.changes ?? 0) > 0;
}

export async function deleteShareLink(
  db: Database,
  userId: string,
  resumeId: string
): Promise<boolean> {
  const resume = await getResume(db, userId, resumeId);
  if (!resume) return false;

  const result = await db.delete(shareLinks).where(eq(shareLinks.resumeId, resumeId));
  return (result.meta?.changes ?? 0) > 0;
}

export interface PublicResumeData {
  title: string;
  templateId: string;
  content: ResumeContent;
  design: ResumeDesign;
  allowDownload: boolean;
  noindex: boolean;
  hasPassword: boolean;
}

export type PublicResumeResult =
  | { status: "ok"; data: PublicResumeData }
  | { status: "not_found" }
  | { status: "revoked" }
  | { status: "expired" }
  | { status: "password_required"; hasPassword: true };

export async function getPublicResumeBySlug(
  db: Database,
  slug: string
): Promise<PublicResumeResult> {
  const [link] = await db
    .select({
      id: shareLinks.id,
      resumeId: shareLinks.resumeId,
      isActive: shareLinks.isActive,
      allowDownload: shareLinks.allowDownload,
      noindex: shareLinks.noindex,
      passwordHash: shareLinks.passwordHash,
      expiresAt: shareLinks.expiresAt,
    })
    .from(shareLinks)
    .where(eq(shareLinks.slug, slug))
    .limit(1);

  if (!link) {
    return { status: "not_found" };
  }

  if (!link.isActive) {
    return { status: "revoked" };
  }

  if (link.expiresAt && new Date(link.expiresAt).getTime() < Date.now()) {
    return { status: "expired" };
  }

  if (link.passwordHash) {
    return { status: "password_required", hasPassword: true };
  }

  // Fetch the attached resume details (sanitized projection)
  const [resume] = await db
    .select({
      title: resumes.title,
      templateId: resumes.templateId,
      content: resumes.content,
      design: resumes.design,
    })
    .from(resumes)
    .where(eq(resumes.id, link.resumeId))
    .limit(1);

  if (!resume) {
    return { status: "not_found" };
  }

  return {
    status: "ok",
    data: {
      title: resume.title,
      templateId: resume.templateId,
      content: resume.content,
      design: resume.design,
      allowDownload: link.allowDownload,
      noindex: link.noindex,
      hasPassword: false,
    },
  };
}

export async function recordView(
  db: Database,
  slug: string,
  options: { isBot: boolean }
): Promise<boolean> {
  // Never write to D1 if the requester is an automated bot/crawler (protects free-tier write budget)
  if (options.isBot) {
    return false;
  }

  const result = await db
    .update(shareLinks)
    .set({
      viewCount: sql`${shareLinks.viewCount} + 1`,
    })
    .where(eq(shareLinks.slug, slug));

  return (result.meta?.changes ?? 0) > 0;
}
