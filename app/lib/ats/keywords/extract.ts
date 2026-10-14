import { SKILL_ALIAS_MAP, SKILLS_CATALOG } from "../data/skills";
import { STOPWORDS, JOB_POSTING_BOILERPLATE } from "../data/stopwords";
import { tokenize } from "./tokenize";

export interface ExtractedKeyword {
  canonical: string;
  rawForm: string;
  frequency: number;
  importance: number;
  category?: string;
  source: "skill_catalog" | "frequent_phrase";
}

const SECTION_REQUIREMENT_PATTERNS = [
  /requirements?/i,
  /qualifications?/i,
  /must\s+have/i,
  /what\s+you('ll|\s+will)?\s+bring/i,
  /responsibilities/i,
  /who\s+you\s+are/i,
  /core\s+skills?/i,
];

const GENERIC_EXCLUSIONS = new Set([
  "team",
  "work",
  "working",
  "experience",
  "experienced",
  "ability",
  "abilities",
  "skills",
  "skill",
  "role",
  "roles",
  "years",
  "year",
  "candidate",
  "candidates",
  "company",
  "ideal",
  "strong",
  "support",
  "opportunity",
  "opportunities",
  "environment",
  "solutions",
  "knowledge",
  "understanding",
  "position",
  "people",
  "help",
  "need",
  "needs",
  "including",
  "well",
  "good",
  "high",
  "great",
  "part",
  "day",
  "time",
]);

/**
 * Very light English stemmer to reduce plurals and common suffixes without a heavy library.
 */
export function lightStem(word: string): string {
  const w = word.toLowerCase().trim();
  if (w.length <= 3) return w;

  // Protect known technical tokens and acronyms
  if (
    w === "css" ||
    w === "aws" ||
    w === "redis" ||
    w === "express" ||
    w === "postgres" ||
    w === "kubernetes" ||
    w === "k8s" ||
    w === "c++" ||
    w === "c#" ||
    w === ".net" ||
    w === "wi-fi"
  ) {
    return w;
  }

  // -ies -> -y
  if (w.endsWith("ies") && w.length > 5) {
    return w.slice(0, -3) + "y";
  }

  // -ing (length > 6)
  if (w.endsWith("ing") && w.length > 6) {
    return w.slice(0, -3);
  }

  // -ed (length > 5)
  if (w.endsWith("ed") && w.length > 5) {
    return w.slice(0, -2);
  }

  // Plural -s (length > 4)
  if (w.endsWith("s") && !w.endsWith("ss") && !w.endsWith("us") && !w.endsWith("is") && w.length > 4) {
    return w.slice(0, -1);
  }

  return w;
}

/**
 * Extract ranked keywords from a job description.
 */
export function extractKeywords(jobDescription: string): ExtractedKeyword[] {
  if (!jobDescription || !jobDescription.trim()) {
    return [];
  }

  // Segment JD into sections to apply requirement boosts
  const lines = jobDescription.split(/\r?\n/);
  let isInsideRequirementSection = false;

  const normalTextChunks: string[] = [];
  const requirementTextChunks: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if line looks like a section header
    const isHeader =
      /^[A-Z0-9\s:/-]{3,40}$/.test(trimmed) ||
      trimmed.endsWith(":") ||
      trimmed.startsWith("#");

    if (isHeader) {
      isInsideRequirementSection = SECTION_REQUIREMENT_PATTERNS.some((p) =>
        p.test(trimmed)
      );
    }

    if (isInsideRequirementSection) {
      requirementTextChunks.push(trimmed);
    } else {
      normalTextChunks.push(trimmed);
    }
  }

  const normalTokens = tokenize(normalTextChunks.join(" "));
  const reqTokens = tokenize(requirementTextChunks.join(" "));

  // Token frequency counter with requirement boost (1.8x)
  const tokenWeights = new Map<string, { count: number; weight: number }>();

  const processTokens = (tokens: string[], multiplier: number) => {
    for (let i = 0; i < tokens.length; i++) {
      const t1 = tokens[i]!;

      // 1-gram
      const current1 = tokenWeights.get(t1) || { count: 0, weight: 0 };
      tokenWeights.set(t1, {
        count: current1.count + 1,
        weight: current1.weight + multiplier,
      });

      // 2-gram
      if (i + 1 < tokens.length) {
        const t2 = `${t1} ${tokens[i + 1]}`;
        const current2 = tokenWeights.get(t2) || { count: 0, weight: 0 };
        tokenWeights.set(t2, {
          count: current2.count + 1,
          weight: current2.weight + multiplier * 1.2,
        });
      }

      // 3-gram
      if (i + 2 < tokens.length) {
        const t3 = `${t1} ${tokens[i + 1]} ${tokens[i + 2]}`;
        const current3 = tokenWeights.get(t3) || { count: 0, weight: 0 };
        tokenWeights.set(t3, {
          count: current3.count + 1,
          weight: current3.weight + multiplier * 1.4,
        });
      }
    }
  };

  processTokens(normalTokens, 1.0);
  processTokens(reqTokens, 1.8);

  // Match against skills dictionary and frequent terms
  const resultsByCanonical = new Map<string, ExtractedKeyword>();

  for (const [phrase, { count, weight }] of tokenWeights.entries()) {
    const lowerPhrase = phrase.toLowerCase();

    // Check if known skill alias or canonical
    const canonicalSkill = SKILL_ALIAS_MAP.get(lowerPhrase);

    if (canonicalSkill) {
      const existing = resultsByCanonical.get(canonicalSkill);
      // Give known skills a strong base boost (+3.0)
      const importance = (weight + 3.0) * (existing ? 1.2 : 1.0);

      if (!existing || importance > existing.importance) {
        // Find category
        const def = SKILLS_CATALOG.find((s) => s.canonical === canonicalSkill);
        resultsByCanonical.set(canonicalSkill, {
          canonical: canonicalSkill,
          rawForm: phrase,
          frequency: (existing?.frequency || 0) + count,
          importance: Math.round(((existing?.importance || 0) + importance) * 10) / 10,
          category: def?.category,
          source: "skill_catalog",
        });
      }
      continue;
    }

    // For non-catalog terms: filter out stopwords, generic words, and boilerplate
    const words = lowerPhrase.split(" ");
    const hasStopword = words.some(
      (w) =>
        STOPWORDS.has(w) ||
        JOB_POSTING_BOILERPLATE.has(w) ||
        GENERIC_EXCLUSIONS.has(w) ||
        GENERIC_EXCLUSIONS.has(lightStem(w))
    );

    if (hasStopword) continue;
    if (words.some((w) => w.length < 3)) continue;

    // Minimum frequency of 2 for generic extracted phrases
    if (count >= 2 && weight >= 2.0) {
      const canonical = words
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      if (!resultsByCanonical.has(canonical)) {
        resultsByCanonical.set(canonical, {
          canonical,
          rawForm: phrase,
          frequency: count,
          importance: Math.round(weight * 10) / 10,
          source: "frequent_phrase",
        });
      }
    }
  }

  // Sort by importance descending
  const sorted = Array.from(resultsByCanonical.values()).sort(
    (a, b) => b.importance - a.importance
  );

  return sorted;
}
