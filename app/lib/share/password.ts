import { hashPassword, verifyPassword } from "~/auth/crypto.server";

export const MIN_PASSWORD_LENGTH = 6;
export const MAX_PASSWORD_LENGTH = 128;

export interface ValidatePasswordResult {
  ok: boolean;
  error?: string;
}

/**
 * Validates a share password candidate.
 * Must be 6 to 128 characters after trimming whitespace.
 */
export function validateSharePassword(password: string): ValidatePasswordResult {
  if (typeof password !== "string") {
    return { ok: false, error: "Password must be a string" };
  }

  const trimmed = password.trim();
  if (trimmed.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    };
  }

  if (trimmed.length > MAX_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `Password cannot exceed ${MAX_PASSWORD_LENGTH} characters`,
    };
  }

  return { ok: true };
}

/**
 * Hashes a share link password using WebCrypto PBKDF2 (SHA-256).
 */
export async function hashSharePassword(password: string): Promise<string> {
  const validation = validateSharePassword(password);
  if (!validation.ok) {
    throw new Error(validation.error);
  }
  return hashPassword(password.trim());
}

/**
 * Verifies a password attempt against the stored PBKDF2 hash.
 */
export async function verifySharePassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  if (!password || !storedHash) return false;
  return verifyPassword({ hash: storedHash, password: password.trim() });
}

/**
 * Computes a deterministic fingerprint of a password hash.
 * Included in unlock tokens so changing or removing the password
 * instantly invalidates previously issued unlock cookies.
 */
export async function getPasswordFingerprint(passwordHash: string): Promise<string> {
  if (!passwordHash) return "none";
  const encoder = new TextEncoder();
  const data = encoder.encode(passwordHash);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
