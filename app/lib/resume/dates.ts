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
 * Formats an ISO year or year-month string (e.g. "2023-04" or "2023") into human-friendly text (e.g. "Apr 2023").
 */
export function formatMonthYear(dateString?: string): string {
  if (!dateString || typeof dateString !== "string") return "";
  const trimmed = dateString.trim();
  if (!trimmed) return "";

  // If format is YYYY-MM
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(trimmed);
  if (match && match[1] && match[2]) {
    const year = match[1];
    const monthIndex = parseInt(match[2], 10) - 1;
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
    if (month) {
      return `${month} ${year}`;
    }
  }

  return trimmed;
}

/**
 * Formats a DateRange object for display on resumes.
 * Example: "Mar 2022 – Present" or "2015 – 2019" or "Apr 2023"
 */
export function formatDateRange(range?: DateRange | null): string {
  if (!range) return "";
  const startStr = formatMonthYear(range.start);

  if (range.current) {
    return startStr ? `${startStr} – Present` : "Present";
  }

  const endStr = formatMonthYear(range.end);
  if (startStr && endStr) {
    return `${startStr} – ${endStr}`;
  }
  return startStr || endStr || "";
}
