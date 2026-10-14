import type { AtsContext, AtsRule, Check, FieldTarget } from "../types";

export const lengthRules: AtsRule = (ctx: AtsContext): Check[] => {
  const checks: Check[] = [];

  // 1. Page count (Weight: 3)
  if (ctx.pageCount !== undefined) {
    if (ctx.pageCount >= 1 && ctx.pageCount <= 2) {
      checks.push({
        id: "length-page-count",
        category: "length",
        weight: 3,
        status: "pass",
        credit: 1,
        title: "Page count",
        message: `Resume fits cleanly within ${ctx.pageCount} page${ctx.pageCount > 1 ? "s" : ""} (1-2 pages is industry standard).`,
      });
    } else if (ctx.pageCount === 3) {
      checks.push({
        id: "length-page-count",
        category: "length",
        weight: 3,
        status: "warn",
        credit: 0.5,
        title: "Page count",
        message: "Resume extends to 3 pages. Recruiters typically prefer 1 or 2 pages.",
        fix: "Trim older roles or tighten bullet spacing to fit within 2 pages.",
      });
    } else {
      checks.push({
        id: "length-page-count",
        category: "length",
        weight: 3,
        status: "fail",
        credit: 0,
        title: "Page count",
        message: `Resume is ${ctx.pageCount} pages long, which is significantly longer than standard.`,
        fix: "Condense your resume to 1-2 pages by focusing strictly on the last 10 years of relevant experience.",
      });
    }
  } else {
    // Estimating based on word count if pageCount not passed
    if (ctx.wordCount <= 850) {
      checks.push({
        id: "length-page-count",
        category: "length",
        weight: 3,
        status: "pass",
        credit: 1,
        title: "Estimated page fit",
        message: "Resume length appears well-suited to fit within 1-2 pages.",
      });
    } else {
      checks.push({
        id: "length-page-count",
        category: "length",
        weight: 3,
        status: "warn",
        credit: 0.5,
        title: "Estimated page fit",
        message: "High word count may cause your resume to spill onto an unnecessary page.",
        fix: "Check your preview to ensure your content fits cleanly on 1-2 pages.",
      });
    }
  }

  // 2. Word count (Weight: 3, ideal 300 - 900 words)
  const wc = ctx.wordCount;
  if (wc >= 300 && wc <= 950) {
    checks.push({
      id: "length-word-count",
      category: "length",
      weight: 3,
      status: "pass",
      credit: 1,
      title: "Total word volume",
      message: `Optimal word count (${wc} words). Easy for hiring managers to scan in 30 seconds.`,
    });
  } else if (wc < 200) {
    checks.push({
      id: "length-word-count",
      category: "length",
      weight: 3,
      status: "fail",
      credit: 0,
      title: "Total word volume",
      message: `Resume is too sparse (${wc} words). Recommended is 350-900 words.`,
      fix: "Add more accomplishment bullets, technical skills, or project details to give recruiters sufficient substance.",
    });
  } else if (wc < 300) {
    checks.push({
      id: "length-word-count",
      category: "length",
      weight: 3,
      status: "warn",
      credit: 0.5,
      title: "Total word volume",
      message: `Resume is on the shorter side (${wc} words). Aim for at least 300-350 words.`,
      fix: "Expand slightly on key projects and quantifiable achievements.",
    });
  } else if (wc <= 1200) {
    checks.push({
      id: "length-word-count",
      category: "length",
      weight: 3,
      status: "warn",
      credit: 0.5,
      title: "Total word volume",
      message: `Resume is somewhat verbose (${wc} words). Recommended is 350-900 words.`,
      fix: "Tighten word choice and eliminate redundant adjectives to increase punchiness.",
    });
  } else {
    checks.push({
      id: "length-word-count",
      category: "length",
      weight: 3,
      status: "fail",
      credit: 0,
      title: "Total word volume",
      message: `Resume exceeds recommended length (${wc} words).`,
      fix: "Drastically condense older roles and trim long descriptions so the resume remains skimmable.",
    });
  }

  // 3. Giant paragraphs (Weight: 2, paragraphs > 80 words)
  const paragraphTargets: FieldTarget[] = [];
  const countWords = (t: string) => (t.match(/[a-z0-9+#.-]+/gi) || []).length;

  if (ctx.content.summary?.body) {
    if (countWords(ctx.content.summary.body) > 85) {
      paragraphTargets.push({ sectionId: "summary", field: "body" });
    }
  }

  for (const exp of ctx.content.experience || []) {
    if (exp.summary && countWords(exp.summary) > 80) {
      paragraphTargets.push({
        sectionId: "experience",
        itemId: exp.id,
        field: "summary",
      });
    }
  }

  for (const proj of ctx.content.projects || []) {
    if (proj.description && countWords(proj.description) > 80) {
      paragraphTargets.push({
        sectionId: "projects",
        itemId: proj.id,
        field: "description",
      });
    }
  }

  if (paragraphTargets.length === 0) {
    checks.push({
      id: "length-paragraphs",
      category: "length",
      weight: 2,
      status: "pass",
      credit: 1,
      title: "Scannability & paragraphs",
      message: "No overly dense blocks of text. Information is broken into skimmable units.",
    });
  } else {
    checks.push({
      id: "length-paragraphs",
      category: "length",
      weight: 2,
      status: "warn",
      credit: 0.5,
      title: "Scannability & paragraphs",
      message: "Found dense paragraphs exceeding 80 words. Recruiters often skip large text blocks.",
      fix: "Break long paragraphs into punchy bullet points to improve visual hierarchy and skimmability.",
      targets: paragraphTargets.slice(0, 3),
    });
  }

  // 4. Skills list item count (Weight: 2, ideal 5-25 items total)
  let totalSkills = 0;
  for (const sk of ctx.content.skills || []) {
    if (sk.items) {
      totalSkills += sk.items.filter((item) => item?.trim()).length;
    }
  }

  if (totalSkills >= 5 && totalSkills <= 25) {
    checks.push({
      id: "length-skills-count",
      category: "length",
      weight: 2,
      status: "pass",
      credit: 1,
      title: "Skills section size",
      message: `Optimal number of technical and core skills (${totalSkills} items).`,
      targets: [{ sectionId: "skills" }],
    });
  } else if (totalSkills < 5) {
    checks.push({
      id: "length-skills-count",
      category: "length",
      weight: 2,
      status: totalSkills === 0 ? "fail" : "warn",
      credit: totalSkills === 0 ? 0 : 0.5,
      title: "Skills section size",
      message: `Skills section has ${totalSkills} item${totalSkills === 1 ? "" : "s"}. Recommended is 5-25 items.`,
      fix: "Include 5-15 relevant technologies, tools, and methodologies you are proficient with.",
      targets: [{ sectionId: "skills" }],
    });
  } else {
    checks.push({
      id: "length-skills-count",
      category: "length",
      weight: 2,
      status: "warn",
      credit: 0.5,
      title: "Skills section size",
      message: `High number of skills listed (${totalSkills} items). More than 25 can dilute your core expertise.`,
      fix: "Focus on your strongest and most relevant skills; remove outdated or obvious skills.",
      targets: [{ sectionId: "skills" }],
    });
  }

  return checks;
};
