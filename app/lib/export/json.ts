import { nanoid } from "nanoid";
import {
  resumeContentSchema,
  templateIdSchema,
  type ResumeContent,
  type ResumeDesign,
  type TemplateId,
} from "~/lib/schemas/resume";
import { getTemplate } from "~/components/templates/registry";
import { normalizeDesign } from "~/lib/resume/normalize-design";
import { normalizeSectionOrder } from "~/lib/resume/reorder";
import { getAllSectionIds } from "~/lib/resume/editor-state";

export const MAX_JSON_PAYLOAD_BYTES = 220 * 1024; // 225,280 bytes (~220 KB)
export const CURRENT_SCHEMA_VERSION = 1;

export interface ResumeExportInput {
  title: string;
  templateId?: TemplateId;
  content: ResumeContent;
  design?: ResumeDesign;
}

export interface ResumeJsonEnvelope {
  app: "resumint";
  schemaVersion: number;
  exportedAt: string;
  resume: {
    title: string;
    templateId: TemplateId;
    content: ResumeContent;
    design: ResumeDesign;
  };
}

export interface ParseResumeSuccess {
  ok: true;
  data: {
    title: string;
    templateId: TemplateId;
    content: ResumeContent;
    design: ResumeDesign;
  };
}

export interface ParseResumeError {
  ok: false;
  error: string;
  issues?: string[];
}

export type ParseResumeResult = ParseResumeSuccess | ParseResumeError;

/**
 * Serializes a resume into a standard Resumint JSON backup envelope with 2-space indentation.
 */
export function exportResumeJson(input: ResumeExportInput): string {
  const templateId = input.templateId || "modern";
  const design = input.design || getTemplate(templateId).defaultDesign;

  const envelope: ResumeJsonEnvelope = {
    app: "resumint",
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    resume: {
      title: input.title.trim() || "Resume",
      templateId,
      content: input.content,
      design,
    },
  };

  return JSON.stringify(envelope, null, 2);
}

/**
 * Checks for prototype pollution patterns recursively in raw parsed objects.
 */
function hasPrototypePollution(val: unknown): boolean {
  if (!val || typeof val !== "object") return false;

  if (Array.isArray(val)) {
    return val.some(hasPrototypePollution);
  }

  const obj = val as Record<string, unknown>;
  const keys = Object.keys(obj);

  for (const k of keys) {
    if (k === "__proto__" || k === "constructor" || k === "prototype") {
      return true;
    }
    if (hasPrototypePollution(obj[k])) {
      return true;
    }
  }

  return false;
}

/**
 * Regenerates all item IDs across all sections with fresh nanoid values.
 * Never trust imported IDs.
 */
export function regenerateContentIds(content: ResumeContent): ResumeContent {
  const result: ResumeContent = {
    personal: {
      ...content.personal,
      links: (content.personal.links || []).map((l) => ({
        ...l,
        id: nanoid(),
      })),
    },
    summary: content.summary || "",
    experience: (content.experience || []).map((item) => ({
      ...item,
      id: nanoid(),
    })),
    education: (content.education || []).map((item) => ({
      ...item,
      id: nanoid(),
    })),
    skills: (content.skills || []).map((item) => ({
      ...item,
      id: nanoid(),
    })),
    projects: (content.projects || []).map((item) => ({
      ...item,
      id: nanoid(),
    })),
    certifications: (content.certifications || []).map((item) => ({
      ...item,
      id: nanoid(),
    })),
    awards: (content.awards || []).map((item) => ({
      ...item,
      id: nanoid(),
    })),
    publications: (content.publications || []).map((item) => ({
      ...item,
      id: nanoid(),
    })),
    volunteering: (content.volunteering || []).map((item) => ({
      ...item,
      id: nanoid(),
    })),
    interests: (content.interests || []).map((item) => ({
      ...item,
      id: nanoid(),
    })),
    references: (content.references || []).map((item) => ({
      ...item,
      id: nanoid(),
    })),
    customSections: (content.customSections || []).map((sec) => ({
      ...sec,
      id: nanoid(),
      items: (sec.items || []).map((item) => ({
        ...item,
        id: nanoid(),
      })),
    })),
    hiddenSections: [...(content.hiddenSections || [])],
  };

  const allIds = getAllSectionIds(result);
  result.sectionOrder = normalizeSectionOrder(content.sectionOrder || [], allIds);

  return result;
}

/**
 * Parses and strictly validates a Resumint JSON export.
 * Enforces size limits BEFORE parsing, guards against prototype pollution,
 * validates schema versions and schemas with Zod, and regenerates all internal IDs.
 */
export function parseResumeJson(text: string): ParseResumeResult {
  if (typeof text !== "string") {
    return { ok: false, error: "Input must be a JSON string" };
  }

  // 1. Strict byte/character cap BEFORE JSON.parse
  if (text.length > MAX_JSON_PAYLOAD_BYTES) {
    return { ok: false, error: "File exceeds maximum size limit (220 KB)" };
  }

  // 2. Prototype pollution check on raw text
  if (/"(?:__proto__|constructor|prototype)"\s*:/.test(text)) {
    return { ok: false, error: "Security violation: prototype pollution detected" };
  }

  // 3. Parse JSON
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "Malformed JSON file" };
  }

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "Invalid resume JSON: expected an object" };
  }

  // 3. Prototype pollution check
  if (hasPrototypePollution(raw)) {
    return { ok: false, error: "Security violation: prototype pollution detected" };
  }

  const envelope = raw as Record<string, unknown>;

  // 4. Verify Resumint application identifier
  if (envelope["app"] !== "resumint") {
    return { ok: false, error: "Not a valid Resumint resume backup file" };
  }

  // 5. Version verification with future migration hook
  const schemaVer = envelope["schemaVersion"];
  if (typeof schemaVer !== "number" || schemaVer < 1) {
    return { ok: false, error: "Missing or invalid schemaVersion in resume file" };
  }

  if (schemaVer > CURRENT_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `File was created by a newer version of Resumint (v${schemaVer}). Please export with a compatible version.`,
    };
  }

  // 6. Validate inner resume payload
  const resume = envelope["resume"];
  if (!resume || typeof resume !== "object" || Array.isArray(resume)) {
    return { ok: false, error: "Missing 'resume' payload in envelope" };
  }

  const resumeObj = resume as Record<string, unknown>;

  // Title: trimmed 1-100 characters with fallback
  let title = "Imported Resume";
  if (typeof resumeObj["title"] === "string" && resumeObj["title"].trim()) {
    title = resumeObj["title"].trim().slice(0, 100);
  }

  // TemplateId: validated against schema with fallback to modern
  let templateId: TemplateId = "modern";
  if (resumeObj["templateId"]) {
    const parsedTemplate = templateIdSchema.safeParse(resumeObj["templateId"]);
    if (parsedTemplate.success) {
      templateId = parsedTemplate.data;
    }
  }

  // Content: strictly validated via resumeContentSchema
  const contentResult = resumeContentSchema.safeParse(resumeObj["content"]);
  if (!contentResult.success) {
    const issueList = contentResult.error.issues.map(
      (iss) => `${iss.path.join(".") || "root"}: ${iss.message}`
    );
    return {
      ok: false,
      error: "Invalid resume content structure",
      issues: issueList.slice(0, 5), // Provide up to first 5 issues
    };
  }

  // Design: normalize against template supports
  const templateMeta = getTemplate(templateId);
  const design = normalizeDesign(resumeObj["design"], templateMeta.supports);

  // 7. Regenerate all item IDs to prevent collisions and sanitize
  const cleanContent = regenerateContentIds(contentResult.data);

  return {
    ok: true,
    data: {
      title,
      templateId,
      content: cleanContent,
      design,
    },
  };
}
