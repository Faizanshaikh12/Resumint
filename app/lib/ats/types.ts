import type { ResumeContent, ResumeDesign } from "~/lib/schemas/resume";

export type CheckStatus = "pass" | "warn" | "fail" | "na";

export type CategoryId =
  | "contact"
  | "structure"
  | "summary"
  | "experience"
  | "dates"
  | "length"
  | "language";

export interface FieldTarget {
  sectionId: string;
  itemId?: string;
  field?: string;
  bulletIndex?: number;
}

export interface Check {
  id: string; // stable, kebab-case identifier
  category: CategoryId;
  weight: number;
  status: CheckStatus;
  credit: number; // 0..1 (pass=1, warn=0.5 default, fail=0, na excluded)
  title: string;
  message: string; // what was found
  fix?: string; // what to do
  targets?: FieldTarget[]; // where in the editor
}

export interface CategoryScore {
  id: CategoryId;
  label: string;
  weight: number;
  earned: number;
  maxPossible: number;
  score: number; // 0..100 percentage
}

export type ScoreLabel = "Needs work" | "Good start" | "Strong" | "Excellent";

export interface AtsReport {
  score: number; // 0..100 rounded
  label: ScoreLabel;
  categories: CategoryScore[];
  checks: Check[];
  topFixes: Check[];
  meta: {
    wordCount: number;
    pageCount?: number;
    language: "en" | "other";
  };
}

export interface BulletTarget {
  sectionId: string;
  itemId: string;
  bulletIndex: number;
  text: string;
  roleTitle?: string;
  isCurrentRole?: boolean;
}

export interface AtsContext {
  content: ResumeContent;
  design?: ResumeDesign;
  visibleSections: string[];
  plainText: string;
  wordCount: number;
  bullets: BulletTarget[];
  language: "en" | "other";
  now: Date;
  pageCount?: number;
}

export type AtsRule = (ctx: AtsContext) => Check | Check[] | null;

export const CATEGORY_DEFINITIONS: Record<CategoryId, { label: string; weight: number }> = {
  contact: { label: "Contact & Basics", weight: 15 },
  structure: { label: "Structure & Sections", weight: 15 },
  summary: { label: "Summary", weight: 10 },
  experience: { label: "Experience & Bullets", weight: 30 },
  dates: { label: "Dates & Chronology", weight: 10 },
  length: { label: "Length & Formatting", weight: 10 },
  language: { label: "Language & Style", weight: 10 },
};

export function getScoreLabel(score: number): ScoreLabel {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Strong";
  if (score >= 40) return "Good start";
  return "Needs work";
}
