import type { AtsContext, AtsRule, Check } from "../types";
import { BUZZWORDS } from "../data/buzzwords";

export const summaryRules: AtsRule = (ctx: AtsContext): Check[] => {
  const checks: Check[] = [];
  const isEnglish = ctx.language === "en";
  const summaryBody = ctx.content.summary?.body?.trim() || "";
  const isVisible = ctx.visibleSections.includes("summary") && summaryBody.length > 0;

  // 1. Presence (Weight: 4)
  if (!isVisible) {
    checks.push({
      id: "summary-presence",
      category: "summary",
      weight: 4,
      status: "warn",
      credit: 0,
      title: "Professional summary",
      message: "No professional summary included or section is hidden.",
      fix: "Add a concise 2-4 sentence summary highlighting your core skills, background, and career focus.",
      targets: [{ sectionId: "summary", field: "body" }],
    });

    checks.push({
      id: "summary-length",
      category: "summary",
      weight: 3,
      status: "fail",
      credit: 0,
      title: "Summary length",
      message: "Summary is empty.",
      fix: "Aim for 25-80 words (2-4 punchy sentences).",
      targets: [{ sectionId: "summary", field: "body" }],
    });

    checks.push({
      id: "summary-first-person",
      category: "summary",
      weight: 2,
      status: isEnglish ? "fail" : "na",
      credit: 0,
      title: "Summary opening voice",
      message: "Summary is missing.",
      fix: "Write in implied first person (e.g. 'Software engineer with 5 years experience...' instead of 'I am a software engineer').",
      targets: [{ sectionId: "summary", field: "body" }],
    });

    checks.push({
      id: "summary-buzzwords",
      category: "summary",
      weight: 1,
      status: isEnglish ? "fail" : "na",
      credit: 0,
      title: "Summary buzzword density",
      message: "Summary is missing.",
      targets: [{ sectionId: "summary", field: "body" }],
    });

    return checks;
  }

  // Summary is present!
  checks.push({
    id: "summary-presence",
    category: "summary",
    weight: 4,
    status: "pass",
    credit: 1,
    title: "Professional summary",
    message: "Professional summary section is present.",
    targets: [{ sectionId: "summary", field: "body" }],
  });

  const words = summaryBody.match(/[a-z0-9+#.-]+/gi) || [];
  const wordCount = words.length;

  // 2. Length (Weight: 3, ideal 25-80 words)
  if (wordCount < 20) {
    checks.push({
      id: "summary-length",
      category: "summary",
      weight: 3,
      status: "warn",
      credit: 0.5,
      title: "Summary length",
      message: `Summary is brief (${wordCount} words). Recommended is 25-80 words.`,
      fix: "Expand slightly to highlight 2-3 key achievements, core specializations, or career trajectory.",
      targets: [{ sectionId: "summary", field: "body" }],
    });
  } else if (wordCount > 90) {
    checks.push({
      id: "summary-length",
      category: "summary",
      weight: 3,
      status: "warn",
      credit: 0.5,
      title: "Summary length",
      message: `Summary is lengthy (${wordCount} words). Recommended is 25-80 words.`,
      fix: "Condense your summary to 3-4 impactful sentences to keep recruiters engaged.",
      targets: [{ sectionId: "summary", field: "body" }],
    });
  } else {
    checks.push({
      id: "summary-length",
      category: "summary",
      weight: 3,
      status: "pass",
      credit: 1,
      title: "Summary length",
      message: `Optimal summary length (${wordCount} words).`,
      targets: [{ sectionId: "summary", field: "body" }],
    });
  }

  // 3. First person opening (Weight: 2)
  if (!isEnglish) {
    checks.push({
      id: "summary-first-person",
      category: "summary",
      weight: 2,
      status: "na",
      credit: 1,
      title: "Summary opening voice",
      message: "Language-specific voice check skipped for non-English content.",
    });
  } else {
    const startsWithFirstPerson = /^(\s*I\s+|\s*I['’]m\b|\s*I\s+am\b|\s*I\s+have\b|\s*My\s+)/i.test(
      summaryBody
    );
    if (startsWithFirstPerson) {
      checks.push({
        id: "summary-first-person",
        category: "summary",
        weight: 2,
        status: "warn",
        credit: 0.5,
        title: "Summary opening voice",
        message: "Summary begins with first-person pronoun ('I' or 'My').",
        fix: "Resume convention favors implied first person. Start with your title or a strong adjective (e.g. 'Full-stack engineer with...' instead of 'I am a full-stack engineer...').",
        targets: [{ sectionId: "summary", field: "body" }],
      });
    } else {
      checks.push({
        id: "summary-first-person",
        category: "summary",
        weight: 2,
        status: "pass",
        credit: 1,
        title: "Summary opening voice",
        message: "Summary uses professional implied first-person styling.",
        targets: [{ sectionId: "summary", field: "body" }],
      });
    }
  }

  // 4. Buzzword density (Weight: 1)
  if (!isEnglish) {
    checks.push({
      id: "summary-buzzwords",
      category: "summary",
      weight: 1,
      status: "na",
      credit: 1,
      title: "Summary buzzword density",
      message: "Buzzword check skipped for non-English content.",
    });
  } else {
    const lowerBody = summaryBody.toLowerCase();
    const foundBuzzwords: string[] = [];
    for (const b of BUZZWORDS) {
      if (lowerBody.includes(b)) {
        foundBuzzwords.push(b);
      }
    }
    const buzzwordDensity = foundBuzzwords.length / Math.max(1, wordCount);
    if (foundBuzzwords.length >= 3 || buzzwordDensity > 0.08) {
      checks.push({
        id: "summary-buzzwords",
        category: "summary",
        weight: 1,
        status: "warn",
        credit: 0.5,
        title: "Summary buzzwords",
        message: `High density of generic buzzwords found: ${foundBuzzwords.slice(0, 3).join(", ")}.`,
        fix: "Replace generic buzzwords (e.g. 'rockstar', 'hardworking', 'go-getter') with concrete skills and quantifiable results.",
        targets: [{ sectionId: "summary", field: "body" }],
      });
    } else {
      checks.push({
        id: "summary-buzzwords",
        category: "summary",
        weight: 1,
        status: "pass",
        credit: 1,
        title: "Summary buzzwords",
        message: "Summary focuses on concrete skills without generic cliches.",
        targets: [{ sectionId: "summary", field: "body" }],
      });
    }
  }

  return checks;
};
