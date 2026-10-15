import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildFilename } from "~/lib/export/filename";
import {
  exportResumeJson,
  parseResumeJson,
  MAX_JSON_PAYLOAD_BYTES,
} from "~/lib/export/json";
import { exportResumeText } from "~/lib/export/text";
import { downloadText, copyToClipboard } from "~/lib/export/download";
import { createDefaultContent, createDefaultDesign, createSampleContent } from "~/lib/resume/defaults";
import type { ResumeContent } from "~/lib/schemas/resume";

describe("Export & Import Pure Logic", () => {
  describe("buildFilename", () => {
    it("sanitizes candidate name with clean extension", () => {
      expect(buildFilename({ name: "Jane Doe", ext: "pdf" })).toBe("Jane-Doe.pdf");
      expect(buildFilename({ name: "Alex O'Connor", ext: "json" })).toBe("Alex-OConnor.json");
    });

    it("falls back to title if name is empty", () => {
      expect(buildFilename({ name: "", title: "Software Engineer 2026", ext: "txt" })).toBe(
        "Software-Engineer-2026.txt"
      );
    });

    it("falls back to 'resume' if both name and title are empty or contain only invalid characters", () => {
      expect(buildFilename({ name: "", title: "" })).toBe("resume.pdf");
      expect(buildFilename({ name: "   ", title: null })).toBe("resume.pdf");
      expect(buildFilename({ name: "✨🎉🚀", title: "??!!" })).toBe("resume.pdf");
    });

    it("sanitizes directory traversal and path separators", () => {
      expect(buildFilename({ name: "../../etc/passwd", ext: "pdf" })).toBe("etcpasswd.pdf");
      expect(buildFilename({ name: "C:\\Windows\\System32", ext: "pdf" })).toBe(
        "CWindowsSystem32.pdf"
      );
    });

    it("appends -resume to Windows reserved device names", () => {
      expect(buildFilename({ name: "CON", ext: "pdf" })).toBe("CON-resume.pdf");
      expect(buildFilename({ name: "prn", ext: "txt" })).toBe("prn-resume.txt");
      expect(buildFilename({ name: "aux", ext: "json" })).toBe("aux-resume.json");
      expect(buildFilename({ name: "com1", ext: "pdf" })).toBe("com1-resume.pdf");
      expect(buildFilename({ name: "lpt2", ext: "pdf" })).toBe("lpt2-resume.pdf");
    });

    it("caps basename length at 80 characters", () => {
      const veryLong = "A".repeat(120);
      const filename = buildFilename({ name: veryLong, ext: "pdf" });
      const base = filename.replace(/\.pdf$/, "");
      expect(base.length).toBeLessThanOrEqual(80);
      expect(base).toBe("A".repeat(80));
    });
  });

  describe("JSON Export & Import", () => {
    const baseContent = createDefaultContent();
    const baseDesign = createDefaultDesign();

    it("exports with valid envelope and roundtrips through parser", () => {
      const exported = exportResumeJson({
        title: "Staff Engineer Resume",
        templateId: "executive",
        content: baseContent,
        design: baseDesign,
      });

      const parsedEnvelope = JSON.parse(exported);
      expect(parsedEnvelope.app).toBe("resumint");
      expect(parsedEnvelope.schemaVersion).toBe(1);
      expect(parsedEnvelope.exportedAt).toBeDefined();
      expect(parsedEnvelope.resume.title).toBe("Staff Engineer Resume");

      const result = parseResumeJson(exported);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.data.title).toBe("Staff Engineer Resume");
      expect(result.data.templateId).toBe("executive");
      expect(result.data.content.personal.name).toBe(baseContent.personal.name);

      // Verify IDs were regenerated (not identical to base)
      const originalLinkId = baseContent.personal.links?.[0]?.id;
      const parsedLinkId = result.data.content.personal.links?.[0]?.id;
      if (originalLinkId && parsedLinkId) {
        expect(parsedLinkId).not.toBe(originalLinkId);
      }
    });

    it("rejects files that exceed the 220 KB size cap before JSON.parse", () => {
      const hugeString = " ".repeat(MAX_JSON_PAYLOAD_BYTES + 50);
      const result = parseResumeJson(hugeString);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toMatch(/exceeds maximum size limit/i);
      }
    });

    it("rejects malformed JSON", () => {
      const result = parseResumeJson("{ bad json ");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toMatch(/malformed json/i);
      }
    });

    it("rejects prototype pollution attempts", () => {
      const hostileJson = `{"app":"resumint","schemaVersion":1,"resume":{"title":"Hostile","__proto__":{"admin":true},"content":${JSON.stringify(baseContent)}}}`;

      const result = parseResumeJson(hostileJson);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toMatch(/prototype pollution/i);
      }
    });

    it("rejects files from another application", () => {
      const otherAppJson = JSON.stringify({
        app: "kickresume",
        schemaVersion: 1,
        resume: { title: "Test", content: baseContent },
      });

      const result = parseResumeJson(otherAppJson);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toMatch(/not a valid resumint resume backup/i);
      }
    });

    it("rejects files created by future schema versions", () => {
      const futureJson = JSON.stringify({
        app: "resumint",
        schemaVersion: 99,
        resume: { title: "Future Resume", content: baseContent },
      });

      const result = parseResumeJson(futureJson);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toMatch(/newer version of resumint/i);
      }
    });

    it("falls back to modern template and default design when template is unknown", () => {
      const invalidTemplateJson = JSON.stringify({
        app: "resumint",
        schemaVersion: 1,
        resume: {
          title: "Unknown Template",
          templateId: "unsupported-template-xyz",
          content: baseContent,
        },
      });

      const result = parseResumeJson(invalidTemplateJson);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.templateId).toBe("modern");
      }
    });
  });

  describe("Plain Text Export", () => {
    it("formats resume content with uppercase headings and bullet points", () => {
      const content = createSampleContent();
      content.personal.name = "Diana Prince";
      content.personal.title = "Lead Security Architect";

      const text = exportResumeText(content);
      expect(text).toContain("Diana Prince");
      expect(text).toContain("Lead Security Architect");
      expect(text).toContain("EXPERIENCE");
      expect(text).toContain("EDUCATION");
      expect(text).toContain("SKILLS");
      expect(text).toContain("- ");
    });

    it("omits hidden sections and empty sections", () => {
      const content = createSampleContent();
      content.hiddenSections = ["summary", "references"];
      content.volunteering = [];

      const text = exportResumeText(content);
      expect(text).not.toContain("SUMMARY");
      expect(text).not.toContain("REFERENCES");
      expect(text).not.toContain("VOLUNTEERING");
    });
  });

  describe("Download & Clipboard Helpers", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("downloadText creates and cleans up object URL without throwing", () => {
      const createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
      const revokeObjectURL = vi.fn();
      globalThis.URL.createObjectURL = createObjectURL;
      globalThis.URL.revokeObjectURL = revokeObjectURL;

      expect(() => {
        downloadText("test.txt", "text/plain", "Hello world");
      }).not.toThrow();
    });

    it("copyToClipboard uses navigator.clipboard when available", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText },
      });

      const success = await copyToClipboard("Sample text");
      expect(success).toBe(true);
      expect(writeText).toHaveBeenCalledWith("Sample text");
    });
  });
});
