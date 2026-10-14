/**
 * Sanitizes URLs to ensure ATS and browser security compliance.
 * Permits only safe protocols: http:, https:, mailto:, tel:
 */
export function sanitizeHref(url: unknown): string {
  if (typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  // Check against prohibited script protocols
  // eslint-disable-next-line no-script-url
  const lowercase = trimmed.toLowerCase();
  if (
    lowercase.startsWith("javascript:") ||
    lowercase.startsWith("data:") ||
    lowercase.startsWith("vbscript:")
  ) {
    return "";
  }

  // If already absolute protocol
  if (
    lowercase.startsWith("http://") ||
    lowercase.startsWith("https://") ||
    lowercase.startsWith("mailto:") ||
    lowercase.startsWith("tel:")
  ) {
    return trimmed;
  }

  // If looks like an email without protocol
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return `mailto:${trimmed}`;
  }

  // If looks like a telephone number
  if (/^(\+?[0-9\s().-]{7,25})$/.test(trimmed)) {
    return `tel:${trimmed.replace(/\s+/g, "")}`;
  }

  // Default web URL without protocol -> prepend https://
  return `https://${trimmed}`;
}

/**
 * Formats a URL for clean display in text (e.g. strips https://, www., trailing slash)
 */
export function formatLinkDisplay(url: string, label?: string): string {
  if (label && label.trim().length > 0) return label.trim();
  if (!url) return "";

  return url
    .trim()
    .replace(/^https?:\/\/(www\.)?/, "")
    .replace(/^mailto:/, "")
    .replace(/^tel:/, "")
    .replace(/\/$/, "");
}
