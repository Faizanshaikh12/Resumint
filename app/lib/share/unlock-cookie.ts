import { getPasswordFingerprint } from "./password";

export const UNLOCK_COOKIE_TTL_SECONDS = 86400; // 24 hours max

export interface UnlockTokenPayload {
  slug: string;
  pwFingerprint: string;
  exp: number; // Unix timestamp in seconds
}

export function getUnlockCookieName(slug: string): string {
  return `rs_${slug}`;
}

/**
 * Derives or validates an HMAC secret key from the provided secret string.
 */
async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret || "resumint-fallback-share-secret-development");
  return crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
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

/**
 * Base64URL encoding without padding.
 */
function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Base64URL decoding.
 */
function fromBase64Url(base64Url: string): string {
  let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Creates an HMAC-SHA256 signed unlock token.
 */
export async function createUnlockToken(
  slug: string,
  passwordHash: string,
  secret: string,
  ttlSeconds: number = UNLOCK_COOKIE_TTL_SECONDS
): Promise<string> {
  const pwFingerprint = await getPasswordFingerprint(passwordHash);
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;

  const payload: UnlockTokenPayload = {
    slug,
    pwFingerprint,
    exp,
  };

  const payloadStr = JSON.stringify(payload);
  const payloadEncoded = toBase64Url(payloadStr);

  const key = await getCryptoKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadEncoded)
  );

  const signatureHex = bufferToHex(signature);
  return `${payloadEncoded}.${signatureHex}`;
}

/**
 * Verifies an HMAC-SHA256 signed unlock token.
 * Validates HMAC signature, slug match, password fingerprint match, and expiration.
 */
export async function verifyUnlockToken(
  token: string,
  expectedSlug: string,
  passwordHash: string,
  secret: string,
  nowEpochSec: number = Math.floor(Date.now() / 1000)
): Promise<boolean> {
  if (!token || typeof token !== "string") return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payloadEncoded, signatureHex] = parts;
  if (!payloadEncoded || !signatureHex) return false;

  try {
    const key = await getCryptoKey(secret);
    const signatureBytes = hexToBuffer(signatureHex);

    const isValidSig = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      new TextEncoder().encode(payloadEncoded)
    );

    if (!isValidSig) return false;

    const payloadJson = fromBase64Url(payloadEncoded);
    const payload: UnlockTokenPayload = JSON.parse(payloadJson);

    // Verify slug
    if (payload.slug !== expectedSlug) return false;

    // Verify expiration
    if (typeof payload.exp !== "number" || payload.exp < nowEpochSec) return false;

    // Verify password fingerprint (invalidated if password was changed or removed)
    const currentFingerprint = await getPasswordFingerprint(passwordHash);
    if (payload.pwFingerprint !== currentFingerprint) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Serializes the Set-Cookie header for an unlock token.
 */
export function serializeUnlockCookie(
  slug: string,
  token: string,
  isProduction: boolean,
  maxAgeSeconds: number = UNLOCK_COOKIE_TTL_SECONDS
): string {
  const cookieName = getUnlockCookieName(slug);
  const parts = [
    `${cookieName}=${token}`,
    `Path=/r/${slug}`,
    `Max-Age=${maxAgeSeconds}`,
    "SameSite=Lax",
    "HttpOnly",
  ];

  if (isProduction) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

/**
 * Parses the unlock token from the Request Cookie header for a given slug.
 */
export function parseUnlockCookie(
  cookieHeader: string | null | undefined,
  slug: string
): string | null {
  if (!cookieHeader) return null;
  const cookieName = getUnlockCookieName(slug);
  const cookies = cookieHeader.split(";").map((c) => c.trim());

  for (const cookie of cookies) {
    if (cookie.startsWith(`${cookieName}=`)) {
      return cookie.substring(cookieName.length + 1).trim();
    }
  }

  return null;
}
