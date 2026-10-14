import type { AtsContext, AtsRule, Check } from "../types";

export const structureRules: AtsRule = (ctx: AtsContext): Check[] => {
  const checks: Check[] = [];
  const visible = new Set(ctx.visibleSections);

  const hasExperience =
    visible.has("experience") && (ctx.content.experience?.length || 0) > 0;
  const hasProjects =
    visible.has("projects") && (ctx.content.projects?.length || 0) > 0;
  const hasEducation =
    visible.has("education") && (ctx.content.education?.length || 0) > 0;
  const hasSkills =
    visible.has("skills") &&
    (ctx.content.skills || []).some((s) => s.items && s.items.length > 0);

  // 1. Core sections: Experience (or Projects) + Education + Skills (Weight: 7)
  const missingCore: string[] = [];
  if (!hasExperience && !hasProjects) {
    missingCore.push("Experience or Projects");
  }
  if (!hasEducation) {
    missingCore.push("Education");
  }
  if (!hasSkills) {
    missingCore.push("Skills");
  }

  if (missingCore.length === 0) {
    const isStudentFormat = !hasExperience && hasProjects;
    checks.push({
      id: "structure-core-sections",
      category: "structure",
      weight: 7,
      status: "pass",
      credit: 1,
      title: "Core resume sections",
      message: isStudentFormat
        ? "Essential sections present (using Projects for practical experience, plus Education and Skills)."
        : "All essential core sections present (Experience, Education, Skills).",
      targets: [{ sectionId: "experience" }],
    });
  } else if (missingCore.length === 1 && !hasExperience && hasProjects) {
    // Has projects, education, skills -> this already has missingCore.length === 0
    checks.push({
      id: "structure-core-sections",
      category: "structure",
      weight: 7,
      status: "pass",
      credit: 1,
      title: "Core resume sections",
      message: "Projects, Education, and Skills sections are present.",
      targets: [{ sectionId: "projects" }],
    });
  } else {
    checks.push({
      id: "structure-core-sections",
      category: "structure",
      weight: 7,
      status: missingCore.length >= 2 ? "fail" : "warn",
      credit: missingCore.length >= 2 ? 0 : 0.5,
      title: "Core resume sections",
      message: `Missing essential standard sections: ${missingCore.join(", ")}.`,
      fix: `Add the missing ${missingCore.join(", ")} section${missingCore.length > 1 ? "s" : ""} to provide standard ATS structural landmarks.`,
      targets: [{ sectionId: "experience" }],
    });
  }

  // 2. Standard section headings (Weight: 3)
  // Flag unusual custom headings that look like standard sections
  const customSections = ctx.content.customSections || {};
  const unusualHeadings: { id: string; title: string; suggested: string }[] = [];
  const standardLookalikes: Record<string, string> = {
    jobs: "Experience",
    "my jobs": "Experience",
    "work history": "Experience",
    employment: "Experience",
    "my work": "Experience",
    schooling: "Education",
    academics: "Education",
    degrees: "Education",
    abilities: "Skills",
    competencies: "Skills",
    tech: "Skills",
  };

  for (const [id, custom] of Object.entries(customSections)) {
    if (!visible.has(id)) continue;
    const lowerTitle = (custom.title || "").toLowerCase().trim();
    if (standardLookalikes[lowerTitle]) {
      unusualHeadings.push({
        id,
        title: custom.title,
        suggested: standardLookalikes[lowerTitle]!,
      });
    }
  }

  if (unusualHeadings.length > 0) {
    checks.push({
      id: "structure-headings",
      category: "structure",
      weight: 3,
      status: "warn",
      credit: 0.5,
      title: "Standard section headings",
      message: `Custom heading "${unusualHeadings[0]?.title}" may confuse older ATS parsers.`,
      fix: `Use standard heading "${unusualHeadings[0]?.suggested}" so automated parsers recognize the category accurately.`,
      targets: [{ sectionId: unusualHeadings[0]!.id }],
    });
  } else {
    checks.push({
      id: "structure-headings",
      category: "structure",
      weight: 3,
      status: "pass",
      credit: 1,
      title: "Standard section headings",
      message: "All section headings follow recognized ATS industry conventions.",
    });
  }

  // 3. Sensible section order (Weight: 3)
  // e.g. summary should be near top before experience/education, experience or education before skills/languages
  const order = ctx.visibleSections;
  const summaryIdx = order.indexOf("summary");
  const expIdx = order.indexOf("experience");
  const eduIdx = order.indexOf("education");

  let orderWarning: string | null = null;
  if (summaryIdx !== -1 && expIdx !== -1 && summaryIdx > expIdx) {
    orderWarning = "Professional Summary appears after Experience.";
  } else if (summaryIdx !== -1 && eduIdx !== -1 && summaryIdx > eduIdx && expIdx === -1) {
    orderWarning = "Professional Summary appears after Education.";
  }

  if (orderWarning) {
    checks.push({
      id: "structure-order",
      category: "structure",
      weight: 3,
      status: "warn",
      credit: 0.5,
      title: "Section flow & order",
      message: orderWarning,
      fix: "Move your Summary to the top of your resume, immediately beneath contact information.",
      targets: [{ sectionId: "summary" }],
    });
  } else {
    checks.push({
      id: "structure-order",
      category: "structure",
      weight: 3,
      status: "pass",
      credit: 1,
      title: "Section flow & order",
      message: "Sections follow a logical, professional reading order.",
    });
  }

  // 4. Duplicate sections (Weight: 2)
  const seenSections = new Set<string>();
  const duplicates: string[] = [];
  const rawOrder = ctx.content.sectionOrder || [];
  for (const s of rawOrder) {
    if (seenSections.has(s)) {
      duplicates.push(s);
    }
    seenSections.add(s);
  }

  if (duplicates.length > 0) {
    checks.push({
      id: "structure-duplicates",
      category: "structure",
      weight: 2,
      status: "fail",
      credit: 0,
      title: "Section duplicates",
      message: `Duplicated section found in layout: ${duplicates.join(", ")}.`,
      fix: "Remove duplicate sections from your resume structure.",
    });
  } else {
    checks.push({
      id: "structure-duplicates",
      category: "structure",
      weight: 2,
      status: "pass",
      credit: 1,
      title: "Section uniqueness",
      message: "No duplicate sections found.",
    });
  }

  return checks;
};
