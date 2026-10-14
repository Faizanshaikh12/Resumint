import { describe, it, expect } from "vitest";
import {
  resumeDesignSchema,
  BUNDLED_FONT_FAMILIES,
  type ResumeDesign,
} from "~/lib/schemas/resume";
import { generateDesignTokens, FONT_STACKS, PAGE_DIMENSIONS } from "~/lib/resume/design-tokens";
import { getContrastRatio, isAccentReadable, hexToRgb } from "~/lib/resume/contrast";
import { sanitizeHref, formatLinkDisplay } from "~/lib/resume/sanitize-link";
import { normalizeDesign } from "~/lib/resume/normalize-design";
import { mergeDesignOnTemplateChange } from "~/lib/resume/touched-merge";

describe("Phase 6 Design Contract & Pure Logic", () => {
  describe("resumeDesignSchema & Backward Compatibility", () => {
    it("parses an empty object into valid defaults", () => {
      const parsed = resumeDesignSchema.parse({});
      expect(parsed.accentColor).toBe("#2563eb");
      expect(parsed.fontFamily).toBe("inter");
      expect(parsed.fontScale).toBe(1.0);
      expect(parsed.lineSpacing).toBe(1.3);
      expect(parsed.pageMargin).toBe(16);
      expect(parsed.sectionSpacing).toBe(16);
      expect(parsed.pageSize).toBe("A4");
      expect(parsed.columns).toBe(1);
      expect(parsed.headerAlign).toBe("left");
      expect(parsed.dateStyle).toBe("MMM YYYY");
      expect(parsed.showIcons).toBe(true);
    });

    it("parses legacy phase 5 resume rows without breaking", () => {
      const legacyRow = {
        accentColor: "#3b82f6",
        fontFamily: "roboto",
        fontSize: "sm",
        lineSpacing: "compact",
        margins: "compact",
        pageSize: "Letter",
        sectionSpacing: "compact",
        columns: "single",
      };

      const parsed = resumeDesignSchema.parse(legacyRow);
      expect(parsed.accentColor).toBe("#3b82f6");
      expect(parsed.fontFamily).toBe("ibm-plex-sans"); // Mapped from roboto
      expect(parsed.fontScale).toBe(0.9); // Mapped from "sm"
      expect(parsed.lineSpacing).toBe(1.15); // Mapped from "compact"
      expect(parsed.pageMargin).toBe(12); // Mapped from "compact"
      expect(parsed.pageSize).toBe("Letter");
      expect(parsed.columns).toBe(1); // Mapped from "single"
      expect(parsed.sectionSpacing).toBe(12); // Mapped from "compact"
    });

    it("maps all legacy font families and columns correctly", () => {
      expect(resumeDesignSchema.parse({ fontFamily: "playfair" }).fontFamily).toBe("source-serif-4");
      expect(resumeDesignSchema.parse({ fontFamily: "source-sans" }).fontFamily).toBe("inter");
      expect(resumeDesignSchema.parse({ fontFamily: "fira-code" }).fontFamily).toBe("roboto-mono");
      expect(resumeDesignSchema.parse({ columns: "double" }).columns).toBe(2);
      expect(resumeDesignSchema.parse({ columns: 2 }).columns).toBe(2);
    });

    it("accepts all 6 bundled font families", () => {
      for (const font of BUNDLED_FONT_FAMILIES) {
        expect(resumeDesignSchema.parse({ fontFamily: font }).fontFamily).toBe(font);
      }
    });
  });

  describe("design-tokens", () => {
    it("generates CSS custom properties matching the design", () => {
      const design: ResumeDesign = {
        accentColor: "#10b981",
        fontFamily: "merriweather",
        fontScale: 1.1,
        lineSpacing: 1.4,
        pageMargin: 20,
        sectionSpacing: 18,
        pageSize: "A4",
        columns: 1,
        headerAlign: "center",
        dateStyle: "MMM YYYY",
        showIcons: true,
      };

      const tokens = generateDesignTokens(design);
      expect(tokens["--accent"]).toBe("#10b981");
      expect(tokens["--font"]).toBe(FONT_STACKS.merriweather);
      expect(tokens["--scale"]).toBe("1.1");
      expect(tokens["--line"]).toBe("1.4");
      expect(tokens["--margin"]).toBe("20mm");
      expect(tokens["--gap"]).toBe("18mm");
      expect(tokens["--page-width"]).toBe(PAGE_DIMENSIONS.A4.width);
      expect(tokens["--page-height"]).toBe(PAGE_DIMENSIONS.A4.height);
      expect(tokens["--header-align"]).toBe("center");
    });

    it("handles Letter page dimensions accurately", () => {
      const tokens = generateDesignTokens({
        ...resumeDesignSchema.parse({}),
        pageSize: "Letter",
      });
      expect(tokens["--page-width"]).toBe("8.5in");
      expect(tokens["--page-height"]).toBe("11in");
    });
  });

  describe("contrast & WCAG", () => {
    it("parses 3-digit and 6-digit hex values", () => {
      expect(hexToRgb("#fff")).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb("000")).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb("#2563eb")).toEqual({ r: 37, g: 99, b: 235 });
    });

    it("calculates contrast ratios correctly", () => {
      expect(getContrastRatio("#000000", "#ffffff")).toBe(21.0);
      expect(getContrastRatio("#ffffff", "#ffffff")).toBe(1.0);
    });

    it("determines readability on white according to WCAG AA (4.5:1)", () => {
      // Black and dark blue pass >= 4.5
      expect(isAccentReadable("#000000")).toBe(true);
      expect(isAccentReadable("#1e3a8a")).toBe(true); // Dark blue

      // Pure yellow and light cyan fail on white background
      expect(isAccentReadable("#ffff00")).toBe(false);
      expect(isAccentReadable("#a5f3fc")).toBe(false);
    });
  });

  describe("sanitizeHref & formatLinkDisplay", () => {
    it("permits safe protocols and strips dangerous ones", () => {
      expect(sanitizeHref("https://github.com/example")).toBe("https://github.com/example");
      expect(sanitizeHref("http://example.com")).toBe("http://example.com");
      expect(sanitizeHref("mailto:test@example.com")).toBe("mailto:test@example.com");
      expect(sanitizeHref("tel:+15551234567")).toBe("tel:+15551234567");

      // Disallow dangerous script URLs
      expect(sanitizeHref("javascript:alert(1)")).toBe("");
      expect(sanitizeHref("data:text/html,<script>alert(1)</script>")).toBe("");
      expect(sanitizeHref("vbscript:msgbox(1)")).toBe("");
    });

    it("formats bare emails and web urls into safe links", () => {
      expect(sanitizeHref("alex@example.com")).toBe("mailto:alex@example.com");
      expect(sanitizeHref("github.com/user")).toBe("https://github.com/user");
    });

    it("formats link display cleanly", () => {
      expect(formatLinkDisplay("https://www.linkedin.com/in/alex", "")).toBe("linkedin.com/in/alex");
      expect(formatLinkDisplay("https://github.com/user/", "")).toBe("github.com/user");
      expect(formatLinkDisplay("https://example.com", "My Site")).toBe("My Site");
    });
  });

  describe("normalizeDesign", () => {
    it("clamps out-of-range values to defined bounds", () => {
      const normalized = normalizeDesign({
        fontScale: 2.5, // max 1.25
        lineSpacing: 0.5, // min 1.0
        pageMargin: 50, // max 30
        sectionSpacing: 2, // min 8
      });

      expect(normalized.fontScale).toBe(1.25);
      expect(normalized.lineSpacing).toBe(1.0);
      expect(normalized.pageMargin).toBe(30);
      expect(normalized.sectionSpacing).toBe(8);
    });

    it("drops unsupported template features", () => {
      const normalized = normalizeDesign(
        { columns: 2, headerAlign: "center" },
        { columns: [1], headerAlign: ["left"] }
      );

      expect(normalized.columns).toBe(1);
      expect(normalized.headerAlign).toBe("left");
    });
  });

  describe("mergeDesignOnTemplateChange", () => {
    it("applies template defaults to untouched fields while preserving customized fields", () => {
      const current: ResumeDesign = {
        ...resumeDesignSchema.parse({}),
        accentColor: "#dc2626", // User customized red
        fontFamily: "inter", // Untouched default
      };

      const templateDefault: Partial<ResumeDesign> = {
        accentColor: "#059669", // Template Emerald
        fontFamily: "source-serif-4", // Template Serif
        headerAlign: "center",
      };

      const touched = new Set(["accentColor"]);
      const merged = mergeDesignOnTemplateChange(current, templateDefault, touched);

      expect(merged.accentColor).toBe("#dc2626"); // Preserved user red
      expect(merged.fontFamily).toBe("source-serif-4"); // Applied template default
      expect(merged.headerAlign).toBe("center");
    });
  });
});
