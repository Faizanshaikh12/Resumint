import type { AtsContext } from "../types";
import { SKILLS_CATALOG } from "../data/skills";
import { extractKeywords, type ExtractedKeyword } from "./extract";

export interface MatchedKeyword {
  canonical: string;
  category?: string;
  count: number;
}

export interface MissingKeyword {
  canonical: string;
  category?: string;
  importance: number;
  placementHint: string;
  warningNote: string;
}

export interface JobMatchResult {
  matchPercent: number;
  matched: MatchedKeyword[];
  missing: MissingKeyword[];
  stuffingWarning?: string;
  totalKeywords: number;
}

/**
 * Escapes special regex characters in a search string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Checks whether a keyword or any of its known aliases exists in plain text.
 * Strictly respects word boundaries so "Java" doesn't match "JavaScript", "Go" doesn't match "going", etc.
 */
export function checkTermMatch(
  term: string,
  aliases: string[],
  text: string
): { isMatched: boolean; matchCount: number } {
  const termsToTest = [term, ...aliases];
  let totalMatches = 0;

  for (const t of termsToTest) {
    const trimmed = t.trim();
    if (!trimmed) continue;

    let regex: RegExp;

    // Special cases with punctuation or short single letters
    if (trimmed.toLowerCase() === "c++") {
      regex = /(^|[^a-zA-Z0-9])c\+\+([^a-zA-Z0-9]|$)/gi;
    } else if (trimmed.toLowerCase() === "c#") {
      regex = /(^|[^a-zA-Z0-9])c#([^a-zA-Z0-9]|$)/gi;
    } else if (trimmed.toLowerCase() === ".net") {
      regex = /(^|[^a-zA-Z0-9])\.net([^a-zA-Z0-9]|$)/gi;
    } else if (trimmed.toLowerCase() === "r" || trimmed.toLowerCase() === "c") {
      regex = new RegExp(`(^|[^a-zA-Z0-9+#])${escapeRegex(trimmed)}([^a-zA-Z0-9+#]|$)`, "gi");
    } else if (trimmed.includes("/") || trimmed.includes(".")) {
      regex = new RegExp(`(^|[^a-zA-Z0-9])${escapeRegex(trimmed)}([^a-zA-Z0-9]|$)`, "gi");
    } else {
      // Standard word boundaries
      regex = new RegExp(`\\b${escapeRegex(trimmed)}\\b`, "gi");
    }

    const matches = text.match(regex);
    if (matches && matches.length > 0) {
      totalMatches += matches.length;
    }
  }

  return {
    isMatched: totalMatches > 0,
    matchCount: totalMatches,
  };
}

/**
 * Matches extracted job description keywords against visible resume content.
 */
export function matchJobDescription(
  jobDescription: string,
  ctx: AtsContext
): JobMatchResult {
  if (!jobDescription || !jobDescription.trim()) {
    return {
      matchPercent: 0,
      matched: [],
      missing: [],
      totalKeywords: 0,
    };
  }

  const extracted = extractKeywords(jobDescription);
  if (extracted.length === 0) {
    return {
      matchPercent: 0,
      matched: [],
      missing: [],
      totalKeywords: 0,
    };
  }

  const resumeText = ctx.plainText;
  const matched: MatchedKeyword[] = [];
  const missing: MissingKeyword[] = [];

  let matchedImportance = 0;
  let totalImportance = 0;

  // Track counts for keyword stuffing guard
  const keywordOccurrences = new Map<string, number>();

  for (const item of extracted) {
    totalImportance += item.importance;

    // Retrieve all known aliases for the skill
    const skillDef = SKILLS_CATALOG.find((s) => s.canonical === item.canonical);
    const aliases = skillDef?.aliases || [];
    if (item.rawForm && item.rawForm.toLowerCase() !== item.canonical.toLowerCase()) {
      aliases.push(item.rawForm);
    }

    const matchCheck = checkTermMatch(item.canonical, aliases, resumeText);

    if (matchCheck.isMatched) {
      matchedImportance += item.importance;
      matched.push({
        canonical: item.canonical,
        category: item.category,
        count: matchCheck.matchCount,
      });
      keywordOccurrences.set(item.canonical, matchCheck.matchCount);
    } else {
      // Determine helpful placement hint
      let placement = "Experience bullets or Skills section";
      if (item.category === "languages" || item.category === "databases" || item.category === "cloud_devops") {
        placement = "Skills section or technical project description";
      } else if (item.category === "product_design" || item.category === "practices") {
        placement = "Summary or relevant role accomplishments";
      }

      missing.push({
        canonical: item.canonical,
        category: item.category,
        importance: item.importance,
        placementHint: placement,
        warningNote: "Add only if true for you",
      });
    }
  }

  // Calculate weighted keyword coverage percentage
  const rawPercent =
    totalImportance > 0 ? (matchedImportance / totalImportance) * 100 : 0;
  const matchPercent = Math.min(100, Math.max(0, Math.round(rawPercent)));

  // Stuffing Guard: Check for unnatural repetition or comma-dumps
  let stuffingWarning: string | undefined;
  for (const [kw, count] of keywordOccurrences.entries()) {
    // If a single technical keyword appears >= 7 times and accounts for > 1.5% of total words
    if (count >= 7 && count / Math.max(1, ctx.wordCount) > 0.015) {
      stuffingWarning = `Keyword "${kw}" appears ${count} times. Overusing keywords risks being flagged for keyword-stuffing.`;
      break;
    }
  }

  // Top ~15 missing keywords ranked by importance
  const rankedMissing = missing.slice(0, 15);

  return {
    matchPercent,
    matched,
    missing: rankedMissing,
    stuffingWarning,
    totalKeywords: extracted.length,
  };
}
