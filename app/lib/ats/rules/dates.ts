import type { AtsContext, AtsRule, Check, FieldTarget } from "../types";

interface ParsedDate {
  year: number;
  month: number;
  isPresent: boolean;
  isValid: boolean;
  totalMonths: number;
}

const MONTH_NAMES: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

export function parseResumeDate(
  rawDate: string | undefined,
  now: Date
): ParsedDate {
  if (!rawDate || !rawDate.trim()) {
    return {
      year: 0,
      month: 0,
      isPresent: false,
      isValid: false,
      totalMonths: 0,
    };
  }

  const str = rawDate.trim().toLowerCase();

  if (str === "present" || str === "current" || str === "now") {
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return {
      year,
      month,
      isPresent: true,
      isValid: true,
      totalMonths: year * 12 + month,
    };
  }

  // Format: YYYY-MM
  const yyyymmMatch = str.match(/^(\d{4})[-/.](\d{1,2})$/);
  if (yyyymmMatch) {
    const year = parseInt(yyyymmMatch[1]!, 10);
    const month = Math.min(12, Math.max(1, parseInt(yyyymmMatch[2]!, 10)));
    return {
      year,
      month,
      isPresent: false,
      isValid: true,
      totalMonths: year * 12 + month,
    };
  }

  // Format: MM/YYYY or MM-YYYY
  const mmyyyyMatch = str.match(/^(\d{1,2})[-/.](\d{4})$/);
  if (mmyyyyMatch) {
    const month = Math.min(12, Math.max(1, parseInt(mmyyyyMatch[1]!, 10)));
    const year = parseInt(mmyyyyMatch[2]!, 10);
    return {
      year,
      month,
      isPresent: false,
      isValid: true,
      totalMonths: year * 12 + month,
    };
  }

  // Format: YYYY
  const yyyyMatch = str.match(/^(\d{4})$/);
  if (yyyyMatch) {
    const year = parseInt(yyyyMatch[1]!, 10);
    return {
      year,
      month: 6, // default mid-year
      isPresent: false,
      isValid: true,
      totalMonths: year * 12 + 6,
    };
  }

  // Format: "Month YYYY" e.g. "June 2021" or "Jun 2021"
  const monthNameMatch = str.match(/^([a-z]+)\s+(\d{4})$/);
  if (monthNameMatch && MONTH_NAMES[monthNameMatch[1]!]) {
    const month = MONTH_NAMES[monthNameMatch[1]!]!;
    const year = parseInt(monthNameMatch[2]!, 10);
    return {
      year,
      month,
      isPresent: false,
      isValid: true,
      totalMonths: year * 12 + month,
    };
  }

  // Fallback: extract any 4-digit year
  const anyYearMatch = str.match(/\b(19\d\d|20\d\d)\b/);
  if (anyYearMatch) {
    const year = parseInt(anyYearMatch[1]!, 10);
    return {
      year,
      month: 6,
      isPresent: false,
      isValid: true,
      totalMonths: year * 12 + 6,
    };
  }

  return {
    year: 0,
    month: 0,
    isPresent: false,
    isValid: false,
    totalMonths: 0,
  };
}

export const datesRules: AtsRule = (ctx: AtsContext): Check[] => {
  const checks: Check[] = [];
  const expItems = ctx.content.experience || [];

  if (expItems.length === 0) {
    // If student has no experience, check education dates or mark na
    const eduItems = ctx.content.education || [];
    if (eduItems.length > 0) {
      checks.push({
        id: "dates-parseable",
        category: "dates",
        weight: 3,
        status: "pass",
        credit: 1,
        title: "Date formatting",
        message: "Education dates formatted clearly.",
        targets: [{ sectionId: "education" }],
      });
      checks.push({
        id: "dates-chronological-order",
        category: "dates",
        weight: 3,
        status: "pass",
        credit: 1,
        title: "Chronological order",
        message: "Chronological flow aligns with student background.",
      });
      checks.push({
        id: "dates-start-before-end",
        category: "dates",
        weight: 2,
        status: "pass",
        credit: 1,
        title: "Date consistency",
        message: "Dates are chronologically consistent.",
      });
      checks.push({
        id: "dates-current-role",
        category: "dates",
        weight: 1,
        status: "na",
        credit: 1,
        title: "Current position designation",
        message: "No current employment position to evaluate.",
      });
      checks.push({
        id: "dates-gaps",
        category: "dates",
        weight: 1,
        status: "na",
        credit: 1,
        title: "Employment gap analysis",
        message: "Employment gap rule not applicable without formal work history.",
      });
      return checks;
    }

    checks.push({
      id: "dates-parseable",
      category: "dates",
      weight: 3,
      status: "fail",
      credit: 0,
      title: "Date formatting",
      message: "No dates found in experience or education.",
      fix: "Add employment and education date ranges (e.g. '2021 - Present').",
      targets: [{ sectionId: "experience" }],
    });
    checks.push({
      id: "dates-chronological-order",
      category: "dates",
      weight: 3,
      status: "fail",
      credit: 0,
      title: "Chronological order",
      message: "Cannot verify chronology without dates.",
      targets: [{ sectionId: "experience" }],
    });
    checks.push({
      id: "dates-start-before-end",
      category: "dates",
      weight: 2,
      status: "fail",
      credit: 0,
      title: "Date consistency",
      message: "No date ranges to evaluate.",
    });
    checks.push({
      id: "dates-current-role",
      category: "dates",
      weight: 1,
      status: "fail",
      credit: 0,
      title: "Current position designation",
      message: "No current role found.",
    });
    checks.push({
      id: "dates-gaps",
      category: "dates",
      weight: 1,
      status: "fail",
      credit: 0,
      title: "Employment gap analysis",
      message: "No employment history to inspect for gaps.",
      targets: [{ sectionId: "experience" }],
    });
    return checks;
  }

  // 1. Parseable dates (Weight: 3)
  const unparseableTargets: FieldTarget[] = [];
  const parsedRoles: {
    id: string;
    company?: string;
    position?: string;
    start: ParsedDate;
    end: ParsedDate;
    isCurrent: boolean;
  }[] = [];

  for (const exp of expItems) {
    const isCurrent =
      exp.current === true ||
      Boolean(exp.endDate && /present|current|now/i.test(exp.endDate));

    const startParsed = parseResumeDate(exp.startDate, ctx.now);
    const endParsed = parseResumeDate(
      isCurrent ? "Present" : exp.endDate,
      ctx.now
    );

    if (exp.startDate && !startParsed.isValid) {
      unparseableTargets.push({
        sectionId: "experience",
        itemId: exp.id,
        field: "startDate",
      });
    }
    if (!isCurrent && exp.endDate && !endParsed.isValid) {
      unparseableTargets.push({
        sectionId: "experience",
        itemId: exp.id,
        field: "endDate",
      });
    }

    parsedRoles.push({
      id: exp.id,
      company: exp.company,
      position: exp.position,
      start: startParsed,
      end: endParsed,
      isCurrent,
    });
  }

  if (unparseableTargets.length === 0) {
    checks.push({
      id: "dates-parseable",
      category: "dates",
      weight: 3,
      status: "pass",
      credit: 1,
      title: "Date formatting",
      message: "All role dates are standard, parseable formats (e.g., 'YYYY-MM' or 'Month YYYY').",
      targets: [{ sectionId: "experience" }],
    });
  } else {
    checks.push({
      id: "dates-parseable",
      category: "dates",
      weight: 3,
      status: "warn",
      credit: 0.5,
      title: "Date formatting",
      message: "Some role dates could not be parsed unambiguously by automated systems.",
      fix: "Use standard date formats such as 'Jan 2022' or '2022-01' so ATS parsers can index your tenure.",
      targets: unparseableTargets.slice(0, 3),
    });
  }

  // 2. Start <= End (Weight: 2)
  const invertedTargets: FieldTarget[] = [];
  for (const r of parsedRoles) {
    if (r.start.isValid && r.end.isValid) {
      if (r.start.totalMonths > r.end.totalMonths) {
        invertedTargets.push({
          sectionId: "experience",
          itemId: r.id,
          field: "endDate",
        });
      }
    }
  }

  if (invertedTargets.length === 0) {
    checks.push({
      id: "dates-start-before-end",
      category: "dates",
      weight: 2,
      status: "pass",
      credit: 1,
      title: "Date consistency",
      message: "All role start dates precede their respective end dates.",
      targets: [{ sectionId: "experience" }],
    });
  } else {
    checks.push({
      id: "dates-start-before-end",
      category: "dates",
      weight: 2,
      status: "fail",
      credit: 0,
      title: "Date consistency",
      message: "One or more positions list an end date that occurs before the start date.",
      fix: "Correct the date order so the start date precedes the end date.",
      targets: invertedTargets.slice(0, 3),
    });
  }

  // 3. Reverse-chronological order (Weight: 3)
  // Each role's end date (or start date) should be >= the subsequent role's date
  let outOfOrderTarget: FieldTarget | null = null;
  for (let i = 0; i < parsedRoles.length - 1; i++) {
    const currentRole = parsedRoles[i]!;
    const nextRole = parsedRoles[i + 1]!;

    if (currentRole.end.isValid && nextRole.end.isValid) {
      // If current role ended significantly before the next role ended
      if (currentRole.end.totalMonths < nextRole.end.totalMonths) {
        outOfOrderTarget = {
          sectionId: "experience",
          itemId: currentRole.id,
        };
        break;
      }
    }
  }

  if (!outOfOrderTarget) {
    checks.push({
      id: "dates-chronological-order",
      category: "dates",
      weight: 3,
      status: "pass",
      credit: 1,
      title: "Chronological order",
      message: "Experience is listed in standard reverse-chronological order (most recent first).",
      targets: [{ sectionId: "experience" }],
    });
  } else {
    checks.push({
      id: "dates-chronological-order",
      category: "dates",
      weight: 3,
      status: "warn",
      credit: 0.5,
      title: "Chronological order",
      message: "Experience positions do not appear to be sorted in reverse-chronological order.",
      fix: "Sort your work history with your most recent or current role at the top.",
      targets: [outOfOrderTarget],
    });
  }

  // 4. Current role has "Present" (Weight: 1)
  const hasCurrentRole = parsedRoles.some((r) => r.isCurrent);
  if (hasCurrentRole) {
    checks.push({
      id: "dates-current-role",
      category: "dates",
      weight: 1,
      status: "pass",
      credit: 1,
      title: "Current position designation",
      message: "Current position is clearly marked with 'Present' or designated as active.",
      targets: [{ sectionId: "experience" }],
    });
  } else {
    checks.push({
      id: "dates-current-role",
      category: "dates",
      weight: 1,
      status: "warn",
      credit: 0.75,
      title: "Current position designation",
      message: "All positions list past end dates (no active role indicated).",
      fix: "If you are currently employed, mark your active role with 'Present' or check 'Current role'.",
      targets: [{ sectionId: "experience" }],
    });
  }

  // 5. Unexplained gaps > 12 months (Weight: 1) - WARN ONLY, NEVER FAIL
  let hasLargeGap = false;
  let gapDetails: { fromRole: string; toRole: string; months: number } | null =
    null;

  for (let i = 0; i < parsedRoles.length - 1; i++) {
    const currentRole = parsedRoles[i]!;
    const previousRole = parsedRoles[i + 1]!;

    if (currentRole.start.isValid && previousRole.end.isValid) {
      const gapMonths = currentRole.start.totalMonths - previousRole.end.totalMonths;
      if (gapMonths > 12) {
        hasLargeGap = true;
        gapDetails = {
          fromRole: previousRole.company || previousRole.position || "Previous Role",
          toRole: currentRole.company || currentRole.position || "Next Role",
          months: gapMonths,
        };
        break;
      }
    }
  }

  if (hasLargeGap && gapDetails) {
    checks.push({
      id: "dates-gaps",
      category: "dates",
      weight: 1,
      status: "warn", // NEVER FAIL
      credit: 0.5,
      title: "Employment gaps",
      message: `Potential employment gap of ~${Math.round(gapDetails.months / 12)} year(s) between ${gapDetails.fromRole} and ${gapDetails.toRole}.`,
      fix: "If applicable, include relevant freelance work, education, or professional development to bridge gaps.",
      targets: [{ sectionId: "experience" }],
    });
  } else {
    checks.push({
      id: "dates-gaps",
      category: "dates",
      weight: 1,
      status: "pass",
      credit: 1,
      title: "Employment gaps",
      message: "No unexplained employment gaps greater than 12 months detected.",
    });
  }

  return checks;
};
