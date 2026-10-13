import { z } from "zod";
import { templateIdSchema } from "./resume";

export const resumeTitleSchema = z
  .string()
  .trim()
  .min(1, "Title cannot be empty")
  .max(100, "Title cannot exceed 100 characters");

export const sampleIdSchema = z.enum(["developer", "student", "designer"]);
export type SampleId = z.infer<typeof sampleIdSchema>;

export const createResumeActionSchema = z.object({
  intent: z.literal("create"),
  source: z.enum(["blank", "sample"]).default("blank"),
  sampleId: sampleIdSchema.optional(),
  title: resumeTitleSchema.optional(),
  templateId: templateIdSchema.optional(),
});

export const renameResumeActionSchema = z.object({
  intent: z.literal("rename"),
  id: z.string().min(1, "Resume ID is required"),
  title: resumeTitleSchema,
});

export const duplicateResumeActionSchema = z.object({
  intent: z.literal("duplicate"),
  id: z.string().min(1, "Resume ID is required"),
});

export const deleteResumeActionSchema = z.object({
  intent: z.literal("delete"),
  id: z.string().min(1, "Resume ID is required"),
});

export const dashboardActionSchema = z.discriminatedUnion("intent", [
  createResumeActionSchema,
  renameResumeActionSchema,
  duplicateResumeActionSchema,
  deleteResumeActionSchema,
]);

export type CreateResumeAction = z.infer<typeof createResumeActionSchema>;
export type RenameResumeAction = z.infer<typeof renameResumeActionSchema>;
export type DuplicateResumeAction = z.infer<typeof duplicateResumeActionSchema>;
export type DeleteResumeAction = z.infer<typeof deleteResumeActionSchema>;
export type DashboardAction = z.infer<typeof dashboardActionSchema>;

/**
 * Standard typed action response returned to route fetchers and forms
 */
export type ActionResult<T = unknown> =
  | { ok: true; data: T; error?: never; fieldErrors?: never }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined>; data?: never };

export const dashboardQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .default("")
    .catch(""),
  sort: z.enum(["updated", "created", "title"]).default("updated").catch("updated"),
  cursor: z.string().optional(),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
