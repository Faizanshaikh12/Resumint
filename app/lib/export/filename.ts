/**
 * Windows reserved file names that cannot be used as file basenames.
 */
const WINDOWS_RESERVED_NAMES = new Set([
  "CON",
  "PRN",
  "AUX",
  "NUL",
  "COM1",
  "COM2",
  "COM3",
  "COM4",
  "COM5",
  "COM6",
  "COM7",
  "COM8",
  "COM9",
  "LPT1",
  "LPT2",
  "LPT3",
  "LPT4",
  "LPT5",
  "LPT6",
  "LPT7",
  "LPT8",
  "LPT9",
]);

export interface BuildFilenameOptions {
  name?: string | null;
  title?: string | null;
  ext?: string;
}

/**
 * Builds a clean, sanitized, safe file name for downloads.
 * Sanitizes to safe characters [A-Za-z0-9_-], collapses spaces to dashes,
 * guards against directory traversal, Windows reserved names, and leading dots.
 * Caps length at 80 characters for the basename.
 */
export function buildFilename({ name, title, ext = "pdf" }: BuildFilenameOptions): string {
  // Prefer candidate name; if absent, use resume title; if both absent, fallback to "resume"
  const candidate = (name && name.trim()) || (title && title.trim()) || "";

  // 1. Remove path separators and null bytes
  let sanitized = candidate
    .replace(/[/\\]/g, "")
    .replace(/\0/g, "")
    .trim();

  // 2. Replace whitespace and dots with hyphens
  sanitized = sanitized.replace(/[\s.]+/g, "-");

  // 3. Keep only alphanumeric, hyphen, and underscore
  sanitized = sanitized.replace(/[^A-Za-z0-9_-]/g, "");

  // 4. Collapse multiple consecutive hyphens or underscores
  sanitized = sanitized.replace(/-{2,}/g, "-").replace(/_{2,}/g, "_");

  // 5. Trim leading and trailing hyphens/underscores/dots
  sanitized = sanitized.replace(/^[._-]+|[._-]+$/g, "");

  // 6. Cap basename at 80 characters
  if (sanitized.length > 80) {
    sanitized = sanitized.slice(0, 80).replace(/[._-]+$/, "");
  }

  // 7. Fallback if empty or became empty after sanitization
  if (!sanitized) {
    sanitized = "resume";
  }

  // 8. Windows reserved name check
  if (WINDOWS_RESERVED_NAMES.has(sanitized.toUpperCase())) {
    sanitized = `${sanitized}-resume`;
  }

  // Clean extension
  const cleanExt = ext.replace(/^\.+/, "").replace(/[^A-Za-z0-9]/g, "") || "pdf";

  return `${sanitized}.${cleanExt}`;
}
