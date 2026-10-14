/**
 * Share Link Status Evaluation
 *
 * Enforces uniform public boundary:
 * At the public boundary (/r/:slug), 'not_found', 'revoked', and 'expired'
 * all map strictly to 'unavailable' (HTTP 404) to prevent link status enumeration.
 */

export interface ShareLinkStatusInput {
  isActive: boolean;
  expiresAt?: Date | string | number | null;
  hasPassword?: boolean;
  passwordHash?: string | null;
}

export type PublicShareStatus = "ok" | "unavailable" | "password_required";

export type OwnerShareStatus = "active" | "disabled" | "expired" | "protected";

/**
 * Checks whether a given timestamp has expired relative to 'now' (UTC inclusive).
 */
export function isLinkExpired(
  expiresAt: Date | string | number | null | undefined,
  now: Date = new Date()
): boolean {
  if (!expiresAt) return false;
  const expiryTime = new Date(expiresAt).getTime();
  if (isNaN(expiryTime)) return false;
  return now.getTime() > expiryTime;
}

/**
 * Evaluates the public status of a share link.
 * All missing, inactive, and expired links return 'unavailable'.
 */
export function getPublicShareStatus(
  link: ShareLinkStatusInput | null | undefined,
  now: Date = new Date()
): PublicShareStatus {
  if (!link || !link.isActive) {
    return "unavailable";
  }

  if (isLinkExpired(link.expiresAt, now)) {
    return "unavailable";
  }

  const hasPassword = Boolean(link.hasPassword || link.passwordHash);
  if (hasPassword) {
    return "password_required";
  }

  return "ok";
}

/**
 * Evaluates the detailed status for the resume owner's settings UI.
 */
export function getOwnerShareStatus(
  link: ShareLinkStatusInput | null | undefined,
  now: Date = new Date()
): OwnerShareStatus {
  if (!link || !link.isActive) {
    return "disabled";
  }

  if (isLinkExpired(link.expiresAt, now)) {
    return "expired";
  }

  const hasPassword = Boolean(link.hasPassword || link.passwordHash);
  if (hasPassword) {
    return "protected";
  }

  return "active";
}
