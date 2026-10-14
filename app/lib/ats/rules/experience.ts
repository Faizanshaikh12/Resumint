import type { AtsContext, AtsRule, Check, FieldTarget } from "../types";
import { isActionVerb, WEAK_OPENING_PHRASES } from "../data/action-verbs";

const QUANTIFIED_REGEX =
  /(\b\d+([.,]\d+)?\s*(%|percent|k|m|b|x|users|clients|engineers|people|team members|customers|leads|sales|dollars|usd|eur|gbp)?\b|[$€£¥]\s*\d+|\b\d+\+\b|\b(one|two|three|four|five|six|seven|eight|nine|ten)\b(?=\s+(engineers|team members|members|projects|clients|departments)))/i;

export const experienceRules: AtsRule = (ctx: AtsContext): Check[] => {
  const checks: Check[] = [];
  const isEnglish = ctx.language === "en";

  // Check if we have experience bullets or fall back to projects bullets (student mode)
  const expItems = ctx.content.experience || [];
  const projItems = ctx.content.projects || [];
  const hasExperience = expItems.length > 0;
  const hasProjects = projItems.length > 0;

  // Filter bullets for evaluation
  let targetBullets = ctx.bullets.filter((b) => b.sectionId === "experience");
  let isStudentMode = false;

  if (targetBullets.length === 0 && !hasExperience && hasProjects) {
    targetBullets = ctx.bullets.filter((b) => b.sectionId === "projects");
    isStudentMode = true;
  }

  // If neither has any bullets
  if (targetBullets.length === 0) {
    checks.push({
      id: "experience-action-verbs",
      category: "experience",
      weight: 8,
      status: "fail",
      credit: 0,
      title: "Action-oriented accomplishments",
      message: "No experience or project accomplishment bullets found.",
      fix: "Add bullet points to your experience or projects highlighting what you achieved.",
      targets: [{ sectionId: hasExperience ? "experience" : "projects" }],
    });

    checks.push({
      id: "experience-quantified",
      category: "experience",
      weight: 8,
      status: "fail",
      credit: 0,
      title: "Measurable metrics & impact",
      message: "No quantified results found in your experience.",
      fix: "Include numbers, percentages, or metrics (e.g. 'boosted performance by 35%').",
      targets: [{ sectionId: hasExperience ? "experience" : "projects" }],
    });

    checks.push({
      id: "experience-bullet-length",
      category: "experience",
      weight: 6,
      status: "fail",
      credit: 0,
      title: "Bullet point length",
      message: "No bullet points to evaluate.",
      targets: [{ sectionId: hasExperience ? "experience" : "projects" }],
    });

    checks.push({
      id: "experience-bullets-per-role",
      category: "experience",
      weight: 4,
      status: "fail",
      credit: 0,
      title: "Depth per role",
      message: "Roles lack bullet points.",
      targets: [{ sectionId: hasExperience ? "experience" : "projects" }],
    });

    checks.push({
      id: "experience-repeated-verbs",
      category: "experience",
      weight: 4,
      status: "fail",
      credit: 0,
      title: "Action verb variety",
      message: "No bullets to evaluate for verb variety.",
      targets: [{ sectionId: hasExperience ? "experience" : "projects" }],
    });

    return checks;
  }

  // 1. Action Verbs (Weight: 8)
  if (!isEnglish) {
    checks.push({
      id: "experience-action-verbs",
      category: "experience",
      weight: 8,
      status: "na",
      credit: 1,
      title: "Action verb openings",
      message: "English action verb check skipped for non-English content.",
    });
  } else {
    let weakCount = 0;
    let tenseMismatchCount = 0;
    let validActionCount = 0;
    const flaggedTargets: FieldTarget[] = [];
    const weakFlaggedExamples: string[] = [];

    for (const b of targetBullets) {
      const lowerText = b.text.toLowerCase().trim();

      // Check weak phrases
      let isWeak = false;
      for (const phrase of WEAK_OPENING_PHRASES) {
        if (lowerText.startsWith(phrase)) {
          weakCount++;
          isWeak = true;
          weakFlaggedExamples.push(`"${phrase}"`);
          flaggedTargets.push({
            sectionId: b.sectionId,
            itemId: b.itemId,
            bulletIndex: b.bulletIndex,
          });
          break;
        }
      }

      if (isWeak) continue;

      // Check first person opening "I built..."
      if (/^i\s+/i.test(lowerText) || /^i['’]m\b/i.test(lowerText)) {
        weakCount++;
        weakFlaggedExamples.push(`"I..."`);
        flaggedTargets.push({
          sectionId: b.sectionId,
          itemId: b.itemId,
          bulletIndex: b.bulletIndex,
        });
        continue;
      }

      // Check first word
      const firstWord = (b.text.match(/^[a-zA-Z]+/)?.[0] || "").toLowerCase();
      const verbCheck = isActionVerb(firstWord, b.isCurrentRole);

      if (verbCheck.isValid) {
        validActionCount++;
        // Tense heuristic check: if past role and present verb, or current role and past verb
        if (b.isCurrentRole && verbCheck.tense === "past") {
          tenseMismatchCount++;
        } else if (!b.isCurrentRole && verbCheck.tense === "present") {
          tenseMismatchCount++;
        }
      } else {
        weakCount++;
        flaggedTargets.push({
          sectionId: b.sectionId,
          itemId: b.itemId,
          bulletIndex: b.bulletIndex,
        });
      }
    }

    const total = targetBullets.length;
    const actionRatio = validActionCount / Math.max(1, total);

    if (weakCount === 0 && tenseMismatchCount === 0) {
      checks.push({
        id: "experience-action-verbs",
        category: "experience",
        weight: 8,
        status: "pass",
        credit: 1,
        title: "Action verb openings",
        message: `All ${total} bullets start with strong, decisive action verbs in the appropriate tense.`,
        targets: flaggedTargets.length > 0 ? flaggedTargets : undefined,
      });
    } else if (actionRatio >= 0.75 && weakCount <= 2 && tenseMismatchCount <= 2) {
      checks.push({
        id: "experience-action-verbs",
        category: "experience",
        weight: 8,
        status: "warn",
        credit: 0.75,
        title: "Action verb openings",
        message: `${validActionCount} of ${total} bullets start with strong action verbs. Some bullets could be strengthened${tenseMismatchCount > 0 ? " or have tense mismatches" : ""}.`,
        fix: "Start every bullet with a strong action verb (e.g. 'Architected', 'Spearheaded', 'Optimized'). Use past tense for former roles and present tense for current roles.",
        targets: flaggedTargets.slice(0, 3),
      });
    } else {
      checks.push({
        id: "experience-action-verbs",
        category: "experience",
        weight: 8,
        status: "warn", // Prompt: Tense check is HEURISTIC: mark warn at most, never fail
        credit: Math.max(0.25, Math.round(actionRatio * 100) / 100),
        title: "Action verb openings",
        message: `${total - validActionCount} bullets lack a strong opening action verb${weakFlaggedExamples.length > 0 ? ` (e.g. ${weakFlaggedExamples[0]})` : ""}.`,
        fix: "Replace passive phrases ('Responsible for', 'Worked on', 'Helped with') with proactive accomplishment verbs.",
        targets: flaggedTargets.slice(0, 3),
      });
    }
  }

  // 2. Quantified Metrics (Weight: 8)
  let quantifiedCount = 0;
  const unquantifiedTargets: FieldTarget[] = [];
  for (const b of targetBullets) {
    if (QUANTIFIED_REGEX.test(b.text)) {
      quantifiedCount++;
    } else {
      unquantifiedTargets.push({
        sectionId: b.sectionId,
        itemId: b.itemId,
        bulletIndex: b.bulletIndex,
      });
    }
  }

  const quantRatio = quantifiedCount / Math.max(1, targetBullets.length);
  if (quantRatio >= 0.5) {
    checks.push({
      id: "experience-quantified",
      category: "experience",
      weight: 8,
      status: "pass",
      credit: 1,
      title: "Measurable metrics & impact",
      message: `${quantifiedCount} of ${targetBullets.length} bullets include quantifiable metrics (percentages, numbers, scale).`,
    });
  } else if (quantifiedCount > 0) {
    checks.push({
      id: "experience-quantified",
      category: "experience",
      weight: 8,
      status: "warn",
      credit: 0.5,
      title: "Measurable metrics & impact",
      message: `Only ${quantifiedCount} of ${targetBullets.length} bullets contain quantifiable data.`,
      fix: "Add measurable evidence of your impact (e.g. 'cut load time by 40%', 'managed $50k budget', 'scaled to 10k users').",
      targets: unquantifiedTargets.slice(0, 3),
    });
  } else {
    checks.push({
      id: "experience-quantified",
      category: "experience",
      weight: 8,
      status: "fail",
      credit: 0,
      title: "Measurable metrics & impact",
      message: "No quantifiable results or numbers found in your accomplishment bullets.",
      fix: "Quantify your achievements: include numbers, dollar amounts, team sizes, or percentages to demonstrate tangible business impact.",
      targets: unquantifiedTargets.slice(0, 3),
    });
  }

  // 3. Bullet Length (Weight: 6, ideal ~8-30 words)
  let irregularLengthCount = 0;
  const lengthFlaggedTargets: FieldTarget[] = [];
  for (const b of targetBullets) {
    const wordCount = (b.text.match(/[a-z0-9+#.-]+/gi) || []).length;
    if (wordCount < 6 || wordCount > 35) {
      irregularLengthCount++;
      lengthFlaggedTargets.push({
        sectionId: b.sectionId,
        itemId: b.itemId,
        bulletIndex: b.bulletIndex,
      });
    }
  }

  if (irregularLengthCount === 0) {
    checks.push({
      id: "experience-bullet-length",
      category: "experience",
      weight: 6,
      status: "pass",
      credit: 1,
      title: "Bullet point length",
      message: "All accomplishment bullets are concise and easy to scan (8-30 words).",
    });
  } else if (irregularLengthCount <= 2) {
    checks.push({
      id: "experience-bullet-length",
      category: "experience",
      weight: 6,
      status: "warn",
      credit: 0.5,
      title: "Bullet point length",
      message: `${irregularLengthCount} bullet${irregularLengthCount > 1 ? "s are" : " is"} either too brief (< 6 words) or too long (> 35 words).`,
      fix: "Aim for 1-2 lines per bullet (~8-30 words) for optimal readability and skimmability.",
      targets: lengthFlaggedTargets.slice(0, 3),
    });
  } else {
    checks.push({
      id: "experience-bullet-length",
      category: "experience",
      weight: 6,
      status: "fail",
      credit: 0,
      title: "Bullet point length",
      message: `${irregularLengthCount} bullets are outside the ideal 8-30 word range.`,
      fix: "Condense long narrative blocks into concise bullets and expand single-phrase fragments into full accomplishments.",
      targets: lengthFlaggedTargets.slice(0, 3),
    });
  }

  // 4. Bullets per role (Weight: 4, ideal 2-6 bullets per role)
  const roleCounts: { id: string; title: string; count: number }[] = [];
  if (!isStudentMode) {
    for (const exp of expItems) {
      const bCount = (exp.bullets || []).filter((b) => b?.trim()).length;
      roleCounts.push({
        id: exp.id,
        title: exp.position || exp.company || "Role",
        count: bCount,
      });
    }
  } else {
    for (const proj of projItems) {
      const bCount = (proj.highlights || []).filter((b) => b?.trim()).length;
      roleCounts.push({
        id: proj.id,
        title: proj.name || "Project",
        count: bCount,
      });
    }
  }

  const unbalancedRoles = roleCounts.filter((r) => r.count < 2 || r.count > 6);
  if (unbalancedRoles.length === 0) {
    checks.push({
      id: "experience-bullets-per-role",
      category: "experience",
      weight: 4,
      status: "pass",
      credit: 1,
      title: "Depth per role",
      message: "Each role/project has a balanced number of accomplishments (2-6 bullets).",
    });
  } else {
    const roleTarget = unbalancedRoles[0]!;
    checks.push({
      id: "experience-bullets-per-role",
      category: "experience",
      weight: 4,
      status: "warn",
      credit: 0.5,
      title: "Depth per role",
      message: `"${roleTarget.title}" has ${roleTarget.count} bullet${roleTarget.count === 1 ? "" : "s"}. Recommended is 2-6 bullets per role.`,
      fix: "Provide 2 to 6 detailed bullet points for each position to demonstrate consistent depth.",
      targets: [
        {
          sectionId: isStudentMode ? "projects" : "experience",
          itemId: roleTarget.id,
        },
      ],
    });
  }

  // 5. No repeated opening verb more than 2x in a role (Weight: 4)
  if (!isEnglish) {
    checks.push({
      id: "experience-repeated-verbs",
      category: "experience",
      weight: 4,
      status: "na",
      credit: 1,
      title: "Action verb variety",
      message: "Verb variety check skipped for non-English content.",
    });
  } else {
    let repeatedVerbRole: { role: string; verb: string; itemId: string } | null = null;

    // Group bullets by itemId
    const bulletsByItem = new Map<string, BulletTarget[]>();
    for (const b of targetBullets) {
      const list = bulletsByItem.get(b.itemId) || [];
      list.push(b);
      bulletsByItem.set(b.itemId, list);
    }

    for (const [itemId, bList] of bulletsByItem.entries()) {
      const verbCounts = new Map<string, number>();
      for (const b of bList) {
        const firstWord = (b.text.match(/^[a-zA-Z]+/)?.[0] || "").toLowerCase();
        if (firstWord.length > 2) {
          const count = (verbCounts.get(firstWord) || 0) + 1;
          verbCounts.set(firstWord, count);
          if (count > 2) {
            repeatedVerbRole = {
              role: b.roleTitle || "this role",
              verb: firstWord,
              itemId,
            };
            break;
          }
        }
      }
      if (repeatedVerbRole) break;
    }

    if (repeatedVerbRole) {
      checks.push({
        id: "experience-repeated-verbs",
        category: "experience",
        weight: 4,
        status: "warn",
        credit: 0.5,
        title: "Action verb variety",
        message: `Verb "${repeatedVerbRole.verb}" is repeated more than twice in ${repeatedVerbRole.role}.`,
        fix: `Vary your action verbs in ${repeatedVerbRole.role} to highlight distinct skills and competencies.`,
        targets: [
          {
            sectionId: isStudentMode ? "projects" : "experience",
            itemId: repeatedVerbRole.itemId,
          },
        ],
      });
    } else {
      checks.push({
        id: "experience-repeated-verbs",
        category: "experience",
        weight: 4,
        status: "pass",
        credit: 1,
        title: "Action verb variety",
        message: "Great verb variety; no opening verbs are overly repeated within roles.",
      });
    }
  }

  return checks;
};
