import { describe, it, expect } from "vitest";
import {
  getPublicShareStatus,
  getOwnerShareStatus,
  isLinkExpired,
} from "~/lib/share/status";
import {
  calculateExpiryTimestamp,
  formatExpiryRemaining,
  getUtcEndOfDay,
} from "~/lib/share/expiry";
import { redactContactDetails } from "~/lib/share/redact";
import {
  validateSharePassword,
  hashSharePassword,
  verifySharePassword,
  getPasswordFingerprint,
} from "~/lib/share/password";
import {
  createUnlockToken,
  verifyUnlockToken,
  serializeUnlockCookie,
  parseUnlockCookie,
  getUnlockCookieName,
} from "~/lib/share/unlock-cookie";
import { isLikelyBot } from "~/lib/share/bots";
import { buildShareMeta, sanitizeAndTruncateText } from "~/lib/share/meta";
import type { ResumeContent } from "~/lib/schemas/resume";

const SAMPLE_CONTENT: ResumeContent = {
  personal: {
    name: "Jane Doe",
    title: "Senior Cloud Architect",
    email: "jane@doe.com",
    phone: "+1 (555) 019-2834",
    location: "Austin, TX",
    links: [{ id: "l1", label: "GitHub", url: "https://github.com/janedoe" }],
  },
  summary: "Experienced cloud architect specializing in distributed systems and edge runtimes.",
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  awards: [],
  publications: [],
  volunteering: [],
  interests: [],
  references: [],
  customSections: [],
  hiddenSections: [],
  sectionOrder: ["summary", "experience", "education", "skills"],
};

describe("Phase 8 Pure Share Logic", () => {
  describe("status.ts: Status Matrix and Expiry Boundaries", () => {
    const fixedNow = new Date("2026-10-14T12:00:00.000Z");

    it("returns 'unavailable' at public boundary for missing or inactive links", () => {
      expect(getPublicShareStatus(null, fixedNow)).toBe("unavailable");
      expect(getPublicShareStatus(undefined, fixedNow)).toBe("unavailable");
      expect(getPublicShareStatus({ isActive: false }, fixedNow)).toBe("unavailable");
    });

    it("returns 'unavailable' at public boundary when link has expired", () => {
      const expiredAt = new Date("2026-10-14T11:59:59.000Z"); // 1s ago
      expect(getPublicShareStatus({ isActive: true, expiresAt: expiredAt }, fixedNow)).toBe(
        "unavailable"
      );
    });

    it("evaluates expiry boundary strictly (inclusive until expiresAt)", () => {
      const exactMoment = new Date("2026-10-14T12:00:00.000Z");
      // Exactly at the timestamp, now <= expiresAt, so not expired
      expect(isLinkExpired(exactMoment, exactMoment)).toBe(false);

      const oneMsAfter = new Date("2026-10-14T12:00:00.001Z");
      expect(isLinkExpired(exactMoment, oneMsAfter)).toBe(true);
    });

    it("returns 'password_required' when active, not expired, and has password", () => {
      const future = new Date("2026-10-15T00:00:00.000Z");
      expect(
        getPublicShareStatus(
          { isActive: true, expiresAt: future, passwordHash: "hash-xyz" },
          fixedNow
        )
      ).toBe("password_required");
    });

    it("returns 'ok' for active, unexpired, passwordless link", () => {
      expect(getPublicShareStatus({ isActive: true }, fixedNow)).toBe("ok");
    });

    it("returns detailed owner status ('disabled', 'expired', 'protected', 'active')", () => {
      expect(getOwnerShareStatus({ isActive: false }, fixedNow)).toBe("disabled");
      expect(
        getOwnerShareStatus(
          { isActive: true, expiresAt: "2026-10-10T00:00:00Z" },
          fixedNow
        )
      ).toBe("expired");
      expect(
        getOwnerShareStatus(
          { isActive: true, passwordHash: "some-hash" },
          fixedNow
        )
      ).toBe("protected");
      expect(getOwnerShareStatus({ isActive: true }, fixedNow)).toBe("active");
    });
  });

  describe("expiry.ts: Presets & UTC End-of-Day Calculation", () => {
    const fixedNow = new Date(Date.UTC(2026, 9, 14, 10, 0, 0)); // Oct 14, 2026

    it("returns null for 'never' preset", () => {
      const res = calculateExpiryTimestamp("never", null, fixedNow);
      expect(res.ok).toBe(true);
      expect(res.expiresAt).toBeNull();
      expect(formatExpiryRemaining(null)).toBe("Never expires");
    });

    it("calculates '7d' end-of-day in UTC", () => {
      const res = calculateExpiryTimestamp("7d", null, fixedNow);
      expect(res.ok).toBe(true);
      expect(res.expiresAt?.toISOString()).toBe("2026-10-21T23:59:59.999Z");
    });

    it("calculates '30d' and '90d' end-of-day in UTC", () => {
      const res30 = calculateExpiryTimestamp("30d", null, fixedNow);
      expect(res30.ok).toBe(true);
      expect(res30.expiresAt?.getUTCHours()).toBe(23);
      expect(res30.expiresAt?.getUTCMinutes()).toBe(59);

      const res90 = calculateExpiryTimestamp("90d", null, fixedNow);
      expect(res90.ok).toBe(true);
      expect(res90.expiresAt?.getUTCHours()).toBe(23);
    });

    it("handles valid custom dates and rejects past or malformed dates", () => {
      // Future custom date
      const validCustom = calculateExpiryTimestamp("custom", "2026-11-01", fixedNow);
      expect(validCustom.ok).toBe(true);
      expect(validCustom.expiresAt?.toISOString()).toBe("2026-11-01T23:59:59.999Z");

      // Past custom date
      const pastCustom = calculateExpiryTimestamp("custom", "2026-10-01", fixedNow);
      expect(pastCustom.ok).toBe(false);
      expect(pastCustom.error).toMatch(/past/i);

      // Malformed date
      const badDate = calculateExpiryTimestamp("custom", "not-a-date", fixedNow);
      expect(badDate.ok).toBe(false);
    });
  });

  describe("redact.ts: Contact Redaction", () => {
    it("strips email and phone while preserving name, location, and other sections", () => {
      const redacted = redactContactDetails(SAMPLE_CONTENT);

      expect(redacted.personal.name).toBe("Jane Doe");
      expect(redacted.personal.title).toBe("Senior Cloud Architect");
      expect(redacted.personal.location).toBe("Austin, TX");
      expect(redacted.personal.email).toBe("");
      expect(redacted.personal.phone).toBe("");
      expect(redacted.summary).toBe(SAMPLE_CONTENT.summary);
      expect(redacted.personal.links).toHaveLength(1);

      // Verify original content is not mutated
      expect(SAMPLE_CONTENT.personal.email).toBe("jane@doe.com");
    });
  });

  describe("password.ts: Validation, PBKDF2 Hashing & Fingerprinting", () => {
    it("validates password length (6-128 chars) and trims whitespace", () => {
      expect(validateSharePassword("12345").ok).toBe(false);
      expect(validateSharePassword("  12345  ").ok).toBe(false);
      expect(validateSharePassword("123456").ok).toBe(true);
      expect(validateSharePassword("a".repeat(129)).ok).toBe(false);
    });

    it("hashes password and verifies successfully with correct password", async () => {
      const password = "correct-horse-battery";
      const hash = await hashSharePassword(password);

      expect(hash).toMatch(/^pbkdf2:sha256:\d+:[0-9a-f]+:[0-9a-f]+$/);

      const isValid = await verifySharePassword(password, hash);
      expect(isValid).toBe(true);

      const isWrong = await verifySharePassword("wrong-password", hash);
      expect(isWrong).toBe(false);
    });

    it("computes deterministic fingerprint that changes with different hashes", async () => {
      const fp1 = await getPasswordFingerprint("hash-1");
      const fp2 = await getPasswordFingerprint("hash-1");
      const fp3 = await getPasswordFingerprint("hash-2");

      expect(fp1).toBe(fp2);
      expect(fp1).not.toBe(fp3);
    });
  });

  describe("unlock-cookie.ts: HMAC Signed Cookie Token Lifecycle", () => {
    const slug = "alpha-beta-123";
    const passwordHash = "pbkdf2:sha256:100000:salt:hash";
    const secret = "test-secret-key-456";

    it("creates and successfully verifies valid unlock token", async () => {
      const token = await createUnlockToken(slug, passwordHash, secret, 3600);
      expect(token).toContain(".");

      const isValid = await verifyUnlockToken(token, slug, passwordHash, secret);
      expect(isValid).toBe(true);
    });

    it("rejects token when tampered or signature invalid", async () => {
      const token = await createUnlockToken(slug, passwordHash, secret);
      const tampered = token.slice(0, -4) + "0000";

      const isValid = await verifyUnlockToken(tampered, slug, passwordHash, secret);
      expect(isValid).toBe(false);
    });

    it("rejects token for different slug", async () => {
      const token = await createUnlockToken(slug, passwordHash, secret);
      const isValid = await verifyUnlockToken(token, "other-slug", passwordHash, secret);
      expect(isValid).toBe(false);
    });

    it("rejects token when expired", async () => {
      const pastTime = Math.floor(Date.now() / 1000) - 100;
      // create token with 10s ttl
      const token = await createUnlockToken(slug, passwordHash, secret, 10);
      // verify with future time
      const isValid = await verifyUnlockToken(token, slug, passwordHash, secret, pastTime + 200);
      expect(isValid).toBe(false);
    });

    it("invalidates old unlock tokens when password hash changes (fingerprint rotation)", async () => {
      const oldHash = "hash-version-1";
      const token = await createUnlockToken(slug, oldHash, secret);

      const newHash = "hash-version-2";
      const isValid = await verifyUnlockToken(token, slug, newHash, secret);
      expect(isValid).toBe(false);
    });

    it("serializes and parses unlock cookie header properly", () => {
      const cookieName = getUnlockCookieName(slug);
      expect(cookieName).toBe("rs_alpha-beta-123");

      const cookieStr = serializeUnlockCookie(slug, "token-val", true);
      expect(cookieStr).toContain("rs_alpha-beta-123=token-val");
      expect(cookieStr).toContain("Path=/r/alpha-beta-123");
      expect(cookieStr).toContain("HttpOnly");
      expect(cookieStr).toContain("Secure");

      const parsed = parseUnlockCookie(`foo=bar; ${cookieName}=token-val; baz=qux`, slug);
      expect(parsed).toBe("token-val");
    });
  });

  describe("bots.ts: Bot & Crawler Detection", () => {
    it("flags HEAD requests as bots", () => {
      const req = new Request("http://localhost/r/test", { method: "HEAD" });
      expect(isLikelyBot(req)).toBe(true);
    });

    it("flags prefetch headers as bots", () => {
      const req = new Request("http://localhost/r/test", {
        headers: { purpose: "prefetch" },
      });
      expect(isLikelyBot(req)).toBe(true);
    });

    it("flags missing or empty User-Agent as bot", () => {
      const req = new Request("http://localhost/r/test", {
        headers: { "user-agent": "" },
      });
      expect(isLikelyBot(req)).toBe(true);
    });

    it("flags known crawlers and unfurlers", () => {
      const botUas = [
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
        "Twitterbot/1.0",
        "Discordbot/2.0",
        "LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient)",
      ];

      for (const ua of botUas) {
        const req = new Request("http://localhost/r/test", {
          headers: { "user-agent": ua },
        });
        expect(isLikelyBot(req)).toBe(true);
      }
    });

    it("allows standard human browser navigation", () => {
      const req = new Request("http://localhost/r/test", {
        method: "GET",
        headers: {
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
      expect(isLikelyBot(req)).toBe(false);
    });
  });

  describe("meta.ts: React Router Meta Builder", () => {
    it("generates generic descriptors for locked pages without leaking candidate name/title", () => {
      const meta = buildShareMeta(SAMPLE_CONTENT, undefined, { isLocked: true });
      const metaJson = JSON.stringify(meta);

      expect(metaJson).not.toContain("Jane Doe");
      expect(metaJson).not.toContain("Senior Cloud Architect");
      expect(meta.some((m) => m.title === "Protected Document | Resumint")).toBe(true);
      expect(meta.some((m) => m.name === "robots" && m.content === "noindex, nofollow")).toBe(
        true
      );
    });

    it("generates formatted title and truncated plain text description for public pages", () => {
      const meta = buildShareMeta(SAMPLE_CONTENT, undefined, { noindex: true });

      const titleDesc = meta.find((m) => m.title);
      expect(titleDesc?.title).toBe("Jane Doe - Senior Cloud Architect | Resumint");

      const descItem = meta.find((m) => m.name === "description");
      expect(descItem?.content).toContain("Experienced cloud architect");

      // Verify no contact details in any meta tags
      const metaStr = JSON.stringify(meta);
      expect(metaStr).not.toContain("jane@doe.com");
      expect(metaStr).not.toContain("555");
    });

    it("sanitizes HTML tags and malicious strings in summaries", () => {
      const malicious = "Experienced <b>developer</b> <script>alert(1)</script> with 10+ years.";
      const sanitized = sanitizeAndTruncateText(malicious, 50);
      expect(sanitized).toBe("Experienced developer with 10+ years.");
      expect(sanitized).not.toContain("<script>");
    });
  });
});
