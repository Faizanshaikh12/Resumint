import { eq, and, desc, asc, like } from "drizzle-orm";
import { nanoid } from "nanoid";
import { resumes } from "../schema";
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

export interface ListResumesOptions {
  search?: string;
  sort?: "updated" | "created" | "title";
  limit?: number;
}

export type ResumeSummary = Omit<Resume, "content" | "design">;

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
): Promise<ResumeSummary[]> {
  const limit = Math.min(options?.limit ?? 50, 100);
  const search = options?.search?.trim();

  let orderBy = desc(resumes.updatedAt);
  if (options?.sort === "created") orderBy = desc(resumes.createdAt);
  if (options?.sort === "title") orderBy = asc(resumes.title);

  const whereClause = search
    ? and(eq(resumes.userId, userId), like(resumes.title, `%${search}%`))
    : eq(resumes.userId, userId);

  return db
    .select({
      id: resumes.id,
      userId: resumes.userId,
      title: resumes.title,
      templateId: resumes.templateId,
      version: resumes.version,
      createdAt: resumes.createdAt,
      updatedAt: resumes.updatedAt,
    })
    .from(resumes)
    .where(whereClause)
    .orderBy(orderBy)
    .limit(limit);
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
  // Validate payloads if provided
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

  // Execute update with optimistic concurrency inside SQL
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

  // Determine if it was not found or a version conflict
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
  const result = await db
    .update(resumes)
    .set({ title: title.trim(), updatedAt: new Date() })
    .where(and(eq(resumes.id, id), eq(resumes.userId, userId)));

  return (result.meta?.changes ?? 0) > 0;
}

export async function deleteResume(
  db: Database,
  userId: string,
  id: string
): Promise<boolean> {
  const result = await db
    .delete(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.userId, userId)));

  return (result.meta?.changes ?? 0) > 0;
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
    title: `${original.title} (Copy)`,
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
