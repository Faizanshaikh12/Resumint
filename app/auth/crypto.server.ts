const ITERATIONS = 100_000;
const KEY_LEN_BYTES = 32;
const SALT_LEN_BYTES = 16;

/**
 * Edge-compliant, zero-dependency password hasher using WebCrypto PBKDF2 (SHA-256).
 * Tuned to execute in ~2-3 ms of CPU time on Cloudflare Workers Free Tier (< 10 ms budget).
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password.normalize("NFKC"));

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

export async function verifyPassword(options: {
  hash: string;
  password: string;
}): Promise<boolean> {
  const { hash, password } = options;
  const parts = hash.split(":");

  // Fallback check if standard format
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
  const passwordBuffer = encoder.encode(password.normalize("NFKC"));

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
    expectedHashHex.length * 4 // bits
  );

  const actualHashHex = bufferToHex(new Uint8Array(derivedBits));

  // Constant-time string equality comparison
  return constantTimeCompare(actualHashHex, expectedHashHex);
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
