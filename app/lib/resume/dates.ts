/**
 * Date range validation and display utilities for resume items.
 * Edge-compliant (no Node.js APIs).
 */

export interface DateRange {
  start?: string;
  end?: string;
  current?: boolean;
}

/**
 * Validates that start date comes before or equals end date when both are present.
 * Expected formats: YYYY or YYYY-MM.
 */
export function validateDateRange(range?: DateRange | null): boolean {
  if (!range || !range.start || !range.end || range.current) {
    return true;
  }

  // Compare lexicographically (works for ISO YYYY and YYYY-MM strings)
  return range.start.trim() <= range.end.trim();
}

/**
 * Formats an ISO year or year-month string into formatted text according to dateStyle.
 * Formats: "MMM YYYY" (e.g. "Apr 2023"), "MM/YYYY" (e.g. "04/2023"), or "YYYY" (e.g. "2023").
 */
export function formatMonthYear(
  dateString?: string,
  style: "MMM YYYY" | "MM/YYYY" | "YYYY" | string = "MMM YYYY"
): string {
  if (!dateString || typeof dateString !== "string") return "";
  const trimmed = dateString.trim();
  if (!trimmed) return "";

  // If format is YYYY-MM
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(trimmed);
  if (match && match[1] && match[2]) {
    const year = match[1];
    const monthNum = match[2];
    const monthIndex = parseInt(monthNum, 10) - 1;

    if (style === "YYYY") return year;
    if (style === "MM/YYYY") return `${monthNum}/${year}`;

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = months[monthIndex];
    return `${month} ${year}`;
  }

  // If format is YYYY
  const yearMatch = /^(\d{4})$/.exec(trimmed);
  if (yearMatch && yearMatch[1]) {
    return yearMatch[1];
  }

  return trimmed;
}

/**
 * Formats a DateRange object for display on resumes.
 * Example: "Mar 2022 – Present" or "03/2022 – Present" or "2022 – Present"
 */
export function formatDateRange(
  range?: DateRange | null,
  style: "MMM YYYY" | "MM/YYYY" | "YYYY" | string = "MMM YYYY"
): string {
  if (!range) return "";
  const startStr = formatMonthYear(range.start, style);

  if (range.current) {
    return startStr ? `${startStr} – Present` : "Present";
  }

  const endStr = formatMonthYear(range.end, style);
  if (startStr && endStr) {
    return `${startStr} – ${endStr}`;
  }
  return startStr || endStr || "";
}
