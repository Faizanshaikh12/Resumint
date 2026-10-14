import { eq, and, desc, asc, count, sql, or, lt, gt } from "drizzle-orm";
import { nanoid } from "nanoid";
import { resumes, shareLinks, resumeSnapshots } from "../schema";
import type { Database } from "../client";
import type { Resume, InsertResume } from "../schema";
import {
  resumeContentSchema,
  resumeDesignSchema,
  templateIdSchema,
  type ResumeContent,
  type ResumeDesign,
  type TemplateId,
} from "~/lib/schemas/resume";
import { createDefaultContent, createDefaultDesign } from "~/lib/resume/defaults";
import { formatDuplicateTitle } from "~/lib/utils/format";

export interface ListResumesOptions {
  search?: string;
  sort?: "updated" | "created" | "title";
  limit?: number;
  cursor?: string;
}

export interface ResumeSummary {
  id: string;
  userId: string;
  title: string;
  templateId: TemplateId;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  hasShareLink: boolean;
  shareSlug?: string | null;
  shareStatus?: "not_shared" | "shared" | "protected" | "expired" | "disabled";
}

export type ListResumesResult = ResumeSummary[] & {
  items: ResumeSummary[];
  nextCursor: string | null;
};

function escapeLikePattern(pattern: string): string {
  return pattern.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function encodeCursor(payload: { v: string | number; id: string }): string {
  try {
    return btoa(JSON.stringify(payload));
  } catch {
    return "";
  }
}

function decodeCursor(cursor?: string | null): { v: string | number; id: string } | null {
  if (!cursor) return null;
  try {
    const raw = atob(cursor);
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      "v" in parsed &&
      "id" in parsed &&
      typeof parsed.id === "string"
    ) {
      return parsed as { v: string | number; id: string };
    }
    return null;
  } catch {
    return null;
  }
}

export async function countResumes(db: Database, userId: string): Promise<number> {
  const [result] = await db
    .select({ total: count() })
    .from(resumes)
    .where(eq(resumes.userId, userId));

  return result?.total ?? 0;
}

export async function createResume(
  db: Database,
  userId: string,
  input?: {
    title?: string;
    templateId?: TemplateId;
    content?: ResumeContent;
    design?: ResumeDesign;
  }
): Promise<Resume> {
  const content = input?.content ? resumeContentSchema.parse(input.content) : createDefaultContent();
  const design = input?.design ? resumeDesignSchema.parse(input.design) : createDefaultDesign();
  const templateId = input?.templateId ? templateIdSchema.parse(input.templateId) : "modern";
  const title = input?.title?.trim() || "Untitled Resume";

  const newResume: InsertResume = {
    id: nanoid(12),
    userId,
    title,
    templateId,
    content,
    design,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const [inserted] = await db.insert(resumes).values(newResume).returning();
  if (!inserted) {
    throw new Error("Failed to insert resume");
  }
  return inserted;
}

export async function listResumes(
  db: Database,
  userId: string,
  options?: ListResumesOptions
): Promise<ListResumesResult> {
  const limit = Math.max(1, Math.min(options?.limit ?? 50, 100));
  const search = options?.search?.trim();
  const sort = options?.sort ?? "updated";

  const conditions = [eq(resumes.userId, userId)];

  if (search) {
    const escaped = escapeLikePattern(search);
    conditions.push(sql`${resumes.title} LIKE ${`%${escaped}%`} ESCAPE '\\'`);
  }

  const cursor = decodeCursor(options?.cursor);

  let orderClauses = [desc(resumes.updatedAt), desc(resumes.id)];

  if (sort === "created") {
    orderClauses = [desc(resumes.createdAt), desc(resumes.id)];
    if (cursor) {
      const cursorDate = new Date(Number(cursor.v));
      if (!isNaN(cursorDate.getTime())) {
        conditions.push(
          or(
            lt(resumes.createdAt, cursorDate),
            and(eq(resumes.createdAt, cursorDate), lt(resumes.id, cursor.id))
          )!
        );
      }
    }
  } else if (sort === "title") {
    orderClauses = [asc(resumes.title), asc(resumes.id)];
    if (cursor) {
      const cursorTitle = String(cursor.v);
      conditions.push(
        or(
          gt(resumes.title, cursorTitle),
          and(eq(resumes.title, cursorTitle), gt(resumes.id, cursor.id))
        )!
      );
    }
  } else {
    // sort === "updated"
    if (cursor) {
      const cursorDate = new Date(Number(cursor.v));
      if (!isNaN(cursorDate.getTime())) {
        conditions.push(
          or(
            lt(resumes.updatedAt, cursorDate),
            and(eq(resumes.updatedAt, cursorDate), lt(resumes.id, cursor.id))
          )!
        );
      }
    }
  }

  const rows = await db
    .select({
      id: resumes.id,
      userId: resumes.userId,
      title: resumes.title,
      templateId: resumes.templateId,
      version: resumes.version,
      createdAt: resumes.createdAt,
      updatedAt: resumes.updatedAt,
      hasShareLink: sql<number>`CASE WHEN ${shareLinks.id} IS NOT NULL THEN 1 ELSE 0 END`.as(
        "hasShareLink"
      ),
      shareSlug: shareLinks.slug,
      shareIsActive: shareLinks.isActive,
      shareExpiresAt: shareLinks.expiresAt,
      hasPassword: sql<number>`CASE WHEN ${shareLinks.passwordHash} IS NOT NULL AND ${shareLinks.passwordHash} != '' THEN 1 ELSE 0 END`.as(
        "hasPassword"
      ),
    })
    .from(resumes)
    .leftJoin(shareLinks, eq(shareLinks.resumeId, resumes.id))
    .where(and(...conditions))
    .orderBy(...orderClauses)
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const rawItems = hasMore ? rows.slice(0, limit) : rows;

  const nowMs = Date.now();
  const items: ResumeSummary[] = rawItems.map((r) => {
    let shareStatus: ResumeSummary["shareStatus"] = "not_shared";
    if (r.shareSlug) {
      const isExpired = r.shareExpiresAt && new Date(r.shareExpiresAt).getTime() < nowMs;
      if (!r.shareIsActive) {
        shareStatus = "disabled";
      } else if (isExpired) {
        shareStatus = "expired";
      } else if (r.hasPassword) {
        shareStatus = "protected";
      } else {
        shareStatus = "shared";
      }
    }

    return {
      id: r.id,
      userId: r.userId,
      title: r.title,
      templateId: r.templateId as TemplateId,
      version: r.version,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      hasShareLink: Boolean(r.hasShareLink),
      shareSlug: r.shareSlug ?? null,
      shareStatus,
    };
  });

  let nextCursor: string | null = null;
  if (hasMore && items.length > 0) {
    const lastItem = items[items.length - 1]!;
    if (sort === "title") {
      nextCursor = encodeCursor({ v: lastItem.title, id: lastItem.id });
    } else if (sort === "created") {
      nextCursor = encodeCursor({ v: lastItem.createdAt.getTime(), id: lastItem.id });
    } else {
      nextCursor = encodeCursor({ v: lastItem.updatedAt.getTime(), id: lastItem.id });
    }
  }

  return Object.assign(items, { items, nextCursor });
}

export async function getResume(
  db: Database,
  userId: string,
  id: string
): Promise<Resume | null> {
  const [resume] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.userId, userId)))
    .limit(1);

  return resume ?? null;
}

export interface UpdateResumeInput {
  title?: string;
  templateId?: TemplateId;
  content?: ResumeContent;
  design?: ResumeDesign;
  expectedVersion: number;
}

export type UpdateResumeResult =
  | { ok: true; resume: Resume }
  | { ok: false; reason: "conflict" | "not_found" };

export async function updateResume(
  db: Database,
  userId: string,
  id: string,
  input: UpdateResumeInput
): Promise<UpdateResumeResult> {
  const validatedContent = input.content ? resumeContentSchema.parse(input.content) : undefined;
  const validatedDesign = input.design ? resumeDesignSchema.parse(input.design) : undefined;
  const validatedTemplate = input.templateId ? templateIdSchema.parse(input.templateId) : undefined;

  const updateFields: Partial<InsertResume> = {
    updatedAt: new Date(),
  };

  if (input.title !== undefined) updateFields.title = input.title.trim();
  if (validatedTemplate !== undefined) updateFields.templateId = validatedTemplate;
  if (validatedContent !== undefined) updateFields.content = validatedContent;
  if (validatedDesign !== undefined) updateFields.design = validatedDesign;

  const result = await db
    .update(resumes)
    .set({
      ...updateFields,
      version: input.expectedVersion + 1,
    })
    .where(
      and(
        eq(resumes.id, id),
        eq(resumes.userId, userId),
        eq(resumes.version, input.expectedVersion)
      )
    )
    .returning();

  const updated = result[0];
  if (updated) {
    return { ok: true, resume: updated };
  }

  const existing = await getResume(db, userId, id);
  if (!existing) {
    return { ok: false, reason: "not_found" };
  }

  return { ok: false, reason: "conflict" };
}

export async function renameResume(
  db: Database,
  userId: string,
  id: string,
  title: string
): Promise<boolean> {
  const trimmed = title.trim();
  if (!trimmed) return false;

  const [existing] = await db
    .select({ title: resumes.title })
    .from(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.userId, userId)))
    .limit(1);

  if (!existing) return false;

  // No-op if unchanged: do not perform a DB write
  if (existing.title === trimmed) {
    return true;
  }

  const result = await db
    .update(resumes)
    .set({ title: trimmed, updatedAt: new Date() })
    .where(and(eq(resumes.id, id), eq(resumes.userId, userId)));

  return (result.meta?.changes ?? 0) > 0;
}

export async function deleteResume(
  db: Database,
  userId: string,
  id: string
): Promise<boolean> {
  const target = await getResume(db, userId, id);
  if (!target) return false;

  await db.batch([
    db.delete(shareLinks).where(eq(shareLinks.resumeId, id)),
    db.delete(resumeSnapshots).where(eq(resumeSnapshots.resumeId, id)),
    db.delete(resumes).where(and(eq(resumes.id, id), eq(resumes.userId, userId))),
  ]);

  return true;
}

export async function duplicateResume(
  db: Database,
  userId: string,
  id: string
): Promise<Resume | null> {
  const original = await getResume(db, userId, id);
  if (!original) return null;

  const newResume: InsertResume = {
    id: nanoid(12),
    userId,
    title: formatDuplicateTitle(original.title),
    templateId: original.templateId,
    content: original.content,
    design: original.design,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const [duplicated] = await db.insert(resumes).values(newResume).returning();
  return duplicated ?? null;
}
