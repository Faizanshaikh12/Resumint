/**
 * Formats a Date or timestamp string into human-readable relative time (e.g. "2 hours ago", "yesterday").
 * Pure Web Standard implementation with no external date libraries.
 */
export function formatRelativeTime(dateInput: Date | string | number | null | undefined): string {
  if (!dateInput) return "Unknown";

  const date = typeof dateInput === "object" ? dateInput : new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (isNaN(diffInSeconds)) return "Unknown";
  if (diffInSeconds < 0) return "just now"; // future drift

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return "yesterday";
  }
  if (diffInDays < 30) {
    return `${diffInDays} days ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? "month" : "months"} ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} ${diffInYears === 1 ? "year" : "years"} ago`;
}

/**
 * Safely truncates a title to the specified maximum length (default: 100 chars),
 * adding an ellipsis only if truncated.
 */
export function truncateTitle(title: string | null | undefined, maxLength = 100): string {
  if (!title) return "";
  const trimmed = title.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1).trim()}…`;
}

/**
 * Generates a duplicate title with " (Copy)", strictly capped at 100 characters.
 */
export function formatDuplicateTitle(title: string | null | undefined, maxLength = 100): string {
  const baseTitle = (title || "Untitled Resume").trim();
  const suffix = " (Copy)";
  if (baseTitle.length + suffix.length <= maxLength) {
    return `${baseTitle}${suffix}`;
  }
  const maxBase = Math.max(0, maxLength - suffix.length);
  return `${baseTitle.slice(0, maxBase).trim()}${suffix}`;
}

