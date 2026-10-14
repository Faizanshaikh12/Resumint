import type { ResumeContent, ResumeDesign } from "~/lib/schemas/resume";
import type {
  AtsReport,
  CategoryId,
  CategoryScore,
  Check,
} from "./types";
import { CATEGORY_DEFINITIONS, getScoreLabel } from "./types";
import { buildAtsContext } from "./context";
import { ATS_RULES_REGISTRY } from "./rules/registry";

export interface AnalyzeOptions {
  now?: Date;
  pageCount?: number;
}

export function analyze(
  content: ResumeContent,
  design?: ResumeDesign,
  options?: AnalyzeOptions
): AtsReport {
  const ctx = buildAtsContext(content, design, options);

  // Run all registered rules
  const allChecks: Check[] = [];
  for (const rule of ATS_RULES_REGISTRY) {
    const res = rule(ctx);
    if (!res) continue;
    if (Array.isArray(res)) {
      allChecks.push(...res);
    } else {
      allChecks.push(res);
    }
  }

  // Group checks by category
  const checksByCategory = new Map<CategoryId, Check[]>();
  for (const check of allChecks) {
    const list = checksByCategory.get(check.category) || [];
    list.push(check);
    checksByCategory.set(check.category, list);
  }

  // Calculate scores per category and total score with NA renormalization
  const categoryScores: CategoryScore[] = [];
  let totalEarned = 0;
  let totalApplicableWeight = 0;

  for (const [catId, def] of Object.entries(CATEGORY_DEFINITIONS) as [
    CategoryId,
    { label: string; weight: number },
  ][]) {
    const catChecks = checksByCategory.get(catId) || [];
    let catEarned = 0;
    let catApplicable = 0;

    for (const check of catChecks) {
      if (check.status === "na") continue;
      catApplicable += check.weight;
      catEarned += check.credit * check.weight;
    }

    totalEarned += catEarned;
    totalApplicableWeight += catApplicable;

    const catScore =
      catApplicable > 0 ? Math.round((catEarned / catApplicable) * 100) : 100;

    categoryScores.push({
      id: catId,
      label: def.label,
      weight: def.weight,
      earned: Math.round(catEarned * 10) / 10,
      maxPossible: catApplicable,
      score: catScore,
    });
  }

  const rawScore =
    totalApplicableWeight > 0
      ? (totalEarned / totalApplicableWeight) * 100
      : 0;
  const score = Math.min(100, Math.max(0, Math.round(rawScore)));
  const label = getScoreLabel(score);

  // Calculate top 3 fixes ranked by recoverable points
  const candidateFixes = allChecks.filter(
    (c) => (c.status === "fail" || c.status === "warn") && c.fix
  );

  candidateFixes.sort((a, b) => {
    const gainA = a.weight * (1 - a.credit);
    const gainB = b.weight * (1 - b.credit);
    return gainB - gainA;
  });

  const topFixes = candidateFixes.slice(0, 3);

  return {
    score,
    label,
    categories: categoryScores,
    checks: allChecks,
    topFixes,
    meta: {
      wordCount: ctx.wordCount,
      pageCount: ctx.pageCount,
      language: ctx.language,
    },
  };
}
