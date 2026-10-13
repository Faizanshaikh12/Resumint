import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "~/auth/crypto.server";
import { safeRedirect } from "~/auth/helpers.server";
import {
  signInSchema,
  signUpSchema,
  emailSchema,
  passwordSchema,
  nameSchema,
} from "~/lib/schemas/auth";

describe("WebCrypto PBKDF2 Password Hashing", () => {
  it("generates a formatted PBKDF2 hash and successfully verifies matching password", async () => {
    const rawPassword = "StrongPassword123!";
    const hash = await hashPassword(rawPassword);

    expect(hash).toMatch(/^pbkdf2:sha256:100000:[a-f0-9]{32}:[a-f0-9]{64}$/);

    const matches = await verifyPassword({ hash, password: rawPassword });
    expect(matches).toBe(true);
  });

  it("fails verification for incorrect password or malformed hash string", async () => {
    const hash = await hashPassword("CorrectPassword1!");
    const wrong = await verifyPassword({ hash, password: "WrongPassword" });
    expect(wrong).toBe(false);

    const invalidFormat = await verifyPassword({
      hash: "invalid:hash:format",
      password: "CorrectPassword1!",
    });
    expect(invalidFormat).toBe(false);
  });
});

describe("safeRedirect Sanitizer", () => {
  it("permits valid same-origin relative paths", () => {
    expect(safeRedirect("/dashboard")).toBe("/dashboard");
    expect(safeRedirect("/resumes/new?template=modern")).toBe("/resumes/new?template=modern");
    expect(safeRedirect("/r/demo-slug")).toBe("/r/demo-slug");
  });

  it("blocks protocol-relative open redirect attempts (//)", () => {
    expect(safeRedirect("//evil.com")).toBe("/dashboard");
    expect(safeRedirect("//google.com/path")).toBe("/dashboard");
  });

  it("blocks backslash evasion attempts (/\\ and \\)", () => {
    expect(safeRedirect("/\\evil.com")).toBe("/dashboard");
    expect(safeRedirect("\\evil.com")).toBe("/dashboard");
  });

  it("blocks absolute URLs and alternative schemes", () => {
    expect(safeRedirect("https://evil.com")).toBe("/dashboard");
    expect(safeRedirect("http://evil.com")).toBe("/dashboard");
    expect(safeRedirect("javascript:alert(1)")).toBe("/dashboard");
    expect(safeRedirect("data:text/html,...")).toBe("/dashboard");
  });

  it("returns fallback default when input is null, undefined, or empty", () => {
    expect(safeRedirect(null)).toBe("/dashboard");
    expect(safeRedirect(undefined)).toBe("/dashboard");
    expect(safeRedirect("")).toBe("/dashboard");
    expect(safeRedirect("   ")).toBe("/dashboard");
    expect(safeRedirect(null, "/fallback")).toBe("/fallback");
  });
});

describe("Authentication Zod Schemas", () => {
  it("validates compliant email addresses and rejects invalid formats", () => {
    expect(emailSchema.safeParse("user@example.com").success).toBe(true);
    expect(emailSchema.safeParse("  user@domain.co  ").success).toBe(true);
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
    expect(emailSchema.safeParse("").success).toBe(false);
  });

  it("enforces password length boundaries (8 - 128 chars) and rejects whitespace-only", () => {
    expect(passwordSchema.safeParse("12345678").success).toBe(true);
    expect(passwordSchema.safeParse("short").success).toBe(false);
    expect(passwordSchema.safeParse(" ".repeat(10)).success).toBe(false);
    expect(passwordSchema.safeParse("a".repeat(129)).success).toBe(false);
  });

  it("validates names with max caps", () => {
    expect(nameSchema.safeParse("Jane Doe").success).toBe(true);
    expect(nameSchema.safeParse("").success).toBe(false);
    expect(nameSchema.safeParse("A".repeat(101)).success).toBe(false);
  });

  it("validates full signInSchema and signUpSchema payloads", () => {
    const validSignIn = signInSchema.safeParse({
      email: "test@resumint.dev",
      password: "ValidPassword123!",
    });
    expect(validSignIn.success).toBe(true);

    const validSignUp = signUpSchema.safeParse({
      name: "Alex Smith",
      email: "alex@resumint.dev",
      password: "ValidPassword123!",
    });
    expect(validSignUp.success).toBe(true);
  });
});
