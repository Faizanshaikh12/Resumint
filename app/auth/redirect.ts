/**
 * Validates and sanitizes a redirect URL, strictly preventing open redirect vulnerabilities.
 * Disallows absolute URLs, protocol-relative links (//), backslash evasions (/\), and javascript schemes.
 */
export function safeRedirect(
  to: FormDataEntryValue | string | null | undefined,
  defaultRedirect = "/dashboard"
): string {
  if (!to || typeof to !== "string") {
    return defaultRedirect;
  }

  const trimmed = to.trim();

  // Must start with exactly one single leading slash
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    trimmed.includes(":") || // blocks javascript:, data:, https:
    trimmed.includes("\\") // blocks backslash evasion tricks
  ) {
    return defaultRedirect;
  }

  return trimmed;
}
