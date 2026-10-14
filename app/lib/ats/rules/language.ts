import type { AtsContext, AtsRule, Check, FieldTarget } from "../types";
import { SAMPLE_PLACEHOLDER_STRINGS } from "../data/placeholders";
import { BUZZWORDS } from "../data/buzzwords";

const FIRST_PERSON_BULLET_REGEX = /\b(i|me|my|myself|we|our|ours|us)\b/i;
const REPEATED_WORDS_REGEX = /\b([a-zA-Z]{2,})\s+\1\b/i;
const STANDALONE_LOWER_I_REGEX = /(^|\s)i(\s|$)/;

export const languageRules: AtsRule = (ctx: AtsContext): Check[] => {
  const checks: Check[] = [];
  const isEnglish = ctx.language === "en";

  // 1. Placeholders (Weight: 3)
  const lowerPlain = ctx.plainText.toLowerCase();
  const foundPlaceholders: string[] = [];
  for (const ph of SAMPLE_PLACEHOLDER_STRINGS) {
    if (ph.length > 3 && lowerPlain.includes(ph)) {
      foundPlaceholders.push(ph);
    }
  }

  if (foundPlaceholders.length === 0) {
    checks.push({
      id: "language-placeholders",
      category: "language",
      weight: 3,
      status: "pass",
      credit: 1,
      title: "Content authenticity",
      message: "No placeholder or dummy text detected.",
    });
  } else {
    checks.push({
      id: "language-placeholders",
      category: "language",
      weight: 3,
      status: "fail",
      credit: 0,
      title: "Content authenticity",
      message: `Sample or placeholder text still present: "${foundPlaceholders.slice(0, 3).join('", "')}".`,
      fix: "Replace placeholder templates with your real experience, skills, and background.",
    });
  }

  // 2. First-person pronouns in bullets (Weight: 2)
  if (!isEnglish) {
    checks.push({
      id: "language-pronouns",
      category: "language",
      weight: 2,
      status: "na",
      credit: 1,
      title: "Pronoun usage",
      message: "First-person pronoun check skipped for non-English content.",
    });
  } else if (ctx.bullets.length === 0) {
    checks.push({
      id: "language-pronouns",
      category: "language",
      weight: 2,
      status: "na",
      credit: 0,
      title: "Pronoun usage",
      message: "No bullet points to evaluate for pronoun usage.",
    });
  } else {
    const pronounTargets: FieldTarget[] = [];
    for (const b of ctx.bullets) {
      if (FIRST_PERSON_BULLET_REGEX.test(b.text)) {
        pronounTargets.push({
          sectionId: b.sectionId,
          itemId: b.itemId,
          bulletIndex: b.bulletIndex,
        });
      }
    }

    if (pronounTargets.length === 0) {
      checks.push({
        id: "language-pronouns",
        category: "language",
        weight: 2,
        status: "pass",
        credit: 1,
        title: "Pronoun usage",
        message: "No first-person pronouns in bullet points. Uses standard implied third/first-person resume voice.",
      });
    } else {
      checks.push({
        id: "language-pronouns",
        category: "language",
        weight: 2,
        status: "warn",
        credit: 0.5,
        title: "Pronoun usage",
        message: `${pronounTargets.length} bullet point${pronounTargets.length > 1 ? "s contain" : " contains"} first-person pronouns ('I', 'me', 'my', 'we').`,
        fix: "Remove personal pronouns from bullet points (e.g. replace 'I built the API' with 'Built the API').",
        targets: pronounTargets.slice(0, 3),
      });
    }
  }

  // 3. Whole-resume Buzzwords / Cliches (Weight: 2)
  if (!isEnglish) {
    checks.push({
      id: "language-buzzwords",
      category: "language",
      weight: 2,
      status: "na",
      credit: 1,
      title: "Buzzword density",
      message: "Buzzword density check skipped for non-English content.",
    });
  } else {
    const foundBuzzwords: string[] = [];
    for (const b of BUZZWORDS) {
      if (lowerPlain.includes(b)) {
        foundBuzzwords.push(b);
      }
    }

    const density = foundBuzzwords.length / Math.max(1, ctx.wordCount);
    if (foundBuzzwords.length >= 5 || density > 0.05) {
      checks.push({
        id: "language-buzzwords",
        category: "language",
        weight: 2,
        status: "warn",
        credit: 0.5,
        title: "Buzzword density",
        message: `High frequency of generic cliches detected: ${foundBuzzwords.slice(0, 4).join(", ")}.`,
        fix: "Replace buzzwords with specific achievements, metrics, or technical tools.",
      });
    } else {
      checks.push({
        id: "language-buzzwords",
        category: "language",
        weight: 2,
        status: "pass",
        credit: 1,
        title: "Buzzword density",
        message: "Resume avoids excessive cliches and buzzwords.",
      });
    }
  }

  // 4. Formatting Cleanliness (Typos: repeated words, double spaces, lowercase 'i') (Weight: 2)
  const formattingIssues: string[] = [];
  const formattingTargets: FieldTarget[] = [];

  for (const b of ctx.bullets) {
    if (REPEATED_WORDS_REGEX.test(b.text)) {
      const match = b.text.match(REPEATED_WORDS_REGEX);
      formattingIssues.push(`repeated word "${match?.[0]}"`);
      formattingTargets.push({
        sectionId: b.sectionId,
        itemId: b.itemId,
        bulletIndex: b.bulletIndex,
      });
    }
    if (/\s{2,}/.test(b.text)) {
      formattingIssues.push("double space");
      formattingTargets.push({
        sectionId: b.sectionId,
        itemId: b.itemId,
        bulletIndex: b.bulletIndex,
      });
    }
    if (isEnglish && STANDALONE_LOWER_I_REGEX.test(b.text)) {
      formattingIssues.push("lowercase 'i'");
      formattingTargets.push({
        sectionId: b.sectionId,
        itemId: b.itemId,
        bulletIndex: b.bulletIndex,
      });
    }
  }

  if (formattingIssues.length === 0) {
    checks.push({
      id: "language-formatting-cleanliness",
      category: "language",
      weight: 2,
      status: "pass",
      credit: 1,
      title: "Typographic cleanliness",
      message: "No repeated duplicate words or extraneous spaces detected.",
    });
  } else {
    checks.push({
      id: "language-formatting-cleanliness",
      category: "language",
      weight: 2,
      status: "warn",
      credit: 0.5,
      title: "Typographic cleanliness",
      message: `Found formatting irregularities: ${formattingIssues.slice(0, 2).join(", ")}.`,
      fix: "Remove repeated words and double spaces.",
      targets: formattingTargets.slice(0, 3),
    });
  }

  // 5. Trailing punctuation consistency across bullets (Weight: 1)
  if (ctx.bullets.length >= 2) {
    let withPeriod = 0;
    let withoutPeriod = 0;

    for (const b of ctx.bullets) {
      if (b.text.endsWith(".")) {
        withPeriod++;
      } else {
        withoutPeriod++;
      }
    }

    const total = ctx.bullets.length;
    // If either all have periods or none have periods -> consistent!
    if (withPeriod === total || withoutPeriod === total) {
      checks.push({
        id: "language-punctuation-consistency",
        category: "language",
        weight: 1,
        status: "pass",
        credit: 1,
        title: "Punctuation consistency",
        message: withPeriod === total
          ? "All bullet points consistently end with a period."
          : "All bullet points consistently omit trailing periods.",
      });
    } else {
      checks.push({
        id: "language-punctuation-consistency",
        category: "language",
        weight: 1,
        status: "warn",
        credit: 0.5,
        title: "Punctuation consistency",
        message: `Inconsistent bullet punctuation: ${withPeriod} end with periods and ${withoutPeriod} do not.`,
        fix: "Choose one style across all bullet points: either end every bullet with a period, or omit periods from all of them.",
      });
    }
  } else if (ctx.bullets.length === 1) {
    checks.push({
      id: "language-punctuation-consistency",
      category: "language",
      weight: 1,
      status: "pass",
      credit: 1,
      title: "Punctuation consistency",
      message: "Bullet punctuation is consistent.",
    });
  } else {
    checks.push({
      id: "language-punctuation-consistency",
      category: "language",
      weight: 1,
      status: "na",
      credit: 0,
      title: "Punctuation consistency",
      message: "No bullets to evaluate for punctuation consistency.",
    });
  }

  return checks;
};
