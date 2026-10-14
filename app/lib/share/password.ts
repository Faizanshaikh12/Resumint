export const MIN_PASSWORD_LENGTH = 6;
export const MAX_PASSWORD_LENGTH = 128;

const ITERATIONS = 100_000;
const KEY_LEN_BYTES = 32;
const SALT_LEN_BYTES = 16;

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

function bufferToHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Hashes a share link password using WebCrypto PBKDF2 (SHA-256).
 */
export async function hashSharePassword(password: string): Promise<string> {
  const validation = validateSharePassword(password);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password.trim().normalize("NFKC"));

  const salt = new Uint8Array(SALT_LEN_BYTES);
  crypto.getRandomValues(salt);

  const baseKey = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    KEY_LEN_BYTES * 8
  );

  const hashHex = bufferToHex(new Uint8Array(derivedBits));
  const saltHex = bufferToHex(salt);

  return `pbkdf2:sha256:${ITERATIONS}:${saltHex}:${hashHex}`;
}

/**
 * Verifies a password attempt against the stored PBKDF2 hash.
 */
export async function verifySharePassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  if (!password || !storedHash) return false;

  const parts = storedHash.split(":");
  if (parts.length !== 5 || parts[0] !== "pbkdf2" || parts[1] !== "sha256") {
    return false;
  }

  const iterations = parseInt(parts[2] || "0", 10);
  const saltHex = parts[3];
  const expectedHashHex = parts[4];

  if (!iterations || !saltHex || !expectedHashHex) {
    return false;
  }

  const salt = hexToBuffer(saltHex);
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password.trim().normalize("NFKC"));

  const baseKey = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    baseKey,
    expectedHashHex.length * 4
  );

  const actualHashHex = bufferToHex(new Uint8Array(derivedBits));
  return constantTimeCompare(actualHashHex, expectedHashHex);
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
