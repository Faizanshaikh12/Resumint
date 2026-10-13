import { describe, it, expect } from "vitest";
import {
  createResumeActionSchema,
  renameResumeActionSchema,
  duplicateResumeActionSchema,
  deleteResumeActionSchema,
  dashboardActionSchema,
  dashboardQuerySchema,
} from "~/lib/schemas/resume-actions";
import { listSamples, getSample } from "~/lib/resume/samples";
import { resumeContentSchema } from "~/lib/schemas/resume";
import { formatRelativeTime, truncateTitle, formatDuplicateTitle } from "~/lib/utils/format";
import { MAX_RESUMES_PER_USER } from "~/lib/resume/limits";

describe("Resume Shared Building Blocks (Phase 4)", () => {
  describe("Zod Action Schemas", () => {
    it("validates create intent with blank and sample sources", () => {
      const validBlank = createResumeActionSchema.safeParse({
        intent: "create",
        source: "blank",
        title: "  My First Resume  ",
        templateId: "modern",
      });
      expect(validBlank.success).toBe(true);
      if (validBlank.success) {
        expect(validBlank.data.title).toBe("My First Resume");
      }

      const validSample = createResumeActionSchema.safeParse({
        intent: "create",
        source: "sample",
        sampleId: "developer",
      });
      expect(validSample.success).toBe(true);

      const invalidSample = createResumeActionSchema.safeParse({
        intent: "create",
        source: "sample",
        sampleId: "nonexistent",
      });
      expect(invalidSample.success).toBe(false);

      const invalidTitleLength = createResumeActionSchema.safeParse({
        intent: "create",
        source: "blank",
        title: "a".repeat(101),
      });
      expect(invalidTitleLength.success).toBe(false);
    });

    it("validates rename intent (trimming, 1-100 chars, rejects empty)", () => {
      const valid = renameResumeActionSchema.safeParse({
        intent: "rename",
        id: "res-12345678",
        title: "  Renamed Resume  ",
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.title).toBe("Renamed Resume");
      }

      const emptyTitle = renameResumeActionSchema.safeParse({
        intent: "rename",
        id: "res-12345678",
        title: "   ",
      });
      expect(emptyTitle.success).toBe(false);

      const tooLong = renameResumeActionSchema.safeParse({
        intent: "rename",
        id: "res-12345678",
        title: "x".repeat(101),
      });
      expect(tooLong.success).toBe(false);

      const missingId = renameResumeActionSchema.safeParse({
        intent: "rename",
        title: "Valid Title",
      });
      expect(missingId.success).toBe(false);
    });

    it("validates duplicate and delete intents", () => {
      expect(duplicateResumeActionSchema.safeParse({ intent: "duplicate", id: "abc" }).success).toBe(true);
      expect(duplicateResumeActionSchema.safeParse({ intent: "duplicate", id: "" }).success).toBe(false);

      expect(deleteResumeActionSchema.safeParse({ intent: "delete", id: "abc" }).success).toBe(true);
      expect(deleteResumeActionSchema.safeParse({ intent: "delete", id: "" }).success).toBe(false);
    });

    it("validates unified dashboardActionSchema discriminator", () => {
      const parsedCreate = dashboardActionSchema.safeParse({
        intent: "create",
        source: "blank",
      });
      expect(parsedCreate.success).toBe(true);

      const parsedDelete = dashboardActionSchema.safeParse({
        intent: "delete",
        id: "target-id",
      });
      expect(parsedDelete.success).toBe(true);

      const parsedUnknown = dashboardActionSchema.safeParse({
        intent: "unknown",
      });
      expect(parsedUnknown.success).toBe(false);
    });

    it("validates and defaults dashboardQuerySchema parameters", () => {
      const empty = dashboardQuerySchema.parse({});
      expect(empty.q).toBe("");
      expect(empty.sort).toBe("updated");
      expect(empty.cursor).toBeUndefined();

      const valid = dashboardQuerySchema.parse({
        q: "Software Engineer",
        sort: "title",
        cursor: "base64-cursor",
      });
      expect(valid.q).toBe("Software Engineer");
      expect(valid.sort).toBe("title");
      expect(valid.cursor).toBe("base64-cursor");

      // Invalid sort falls back to default
      const fallback = dashboardQuerySchema.parse({
        sort: "invalid-sort",
      });
      expect(fallback.sort).toBe("updated");
    });
  });

  describe("Resume Samples", () => {
    it("exports 3 samples, all passing resumeContentSchema", () => {
      const samples = listSamples();
      expect(samples).toHaveLength(3);

      const sampleIds = samples.map((s) => s.id);
      expect(sampleIds).toContain("developer");
      expect(sampleIds).toContain("student");
      expect(sampleIds).toContain("designer");

      for (const sample of samples) {
        expect(sample.title).toBeTruthy();
        expect(sample.description).toBeTruthy();
        // Crucial validation: samples must strictly adhere to the domain content schema
        const parsed = resumeContentSchema.safeParse(sample.content);
        expect(parsed.success).toBe(true);
      }
    });

    it("retrieves sample by id correctly", () => {
      const dev = getSample("developer");
      expect(dev).toBeDefined();
      expect(dev?.content.personal.name).toBe("Alex Morgan");

      const unknown = getSample("not-a-sample");
      expect(unknown).toBeNull();
    });
  });

  describe("Format Utilities", () => {
    it("formats relative time correctly", () => {
      expect(formatRelativeTime(null)).toBe("Unknown");
      expect(formatRelativeTime("invalid")).toBe("Unknown");

      const now = new Date();
      expect(formatRelativeTime(now)).toBe("just now");

      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
      expect(formatRelativeTime(tenMinutesAgo)).toBe("10 minutes ago");

      const oneHourAgo = new Date(now.getTime() - 65 * 60 * 1000);
      expect(formatRelativeTime(oneHourAgo)).toBe("1 hour ago");

      const yesterday = new Date(now.getTime() - 26 * 60 * 60 * 1000);
      expect(formatRelativeTime(yesterday)).toBe("yesterday");

      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(fiveDaysAgo)).toBe("5 days ago");
    });

    it("truncates titles safely", () => {
      expect(truncateTitle("")).toBe("");
      expect(truncateTitle("Short Title", 20)).toBe("Short Title");
      expect(truncateTitle("This is a very long title that should be cut off", 15)).toBe("This is a very…");
    });

    it("formats duplicate titles with (Copy) and caps at 100 characters", () => {
      expect(formatDuplicateTitle("My Resume")).toBe("My Resume (Copy)");

      const longTitle = "A".repeat(98);
      const duplicated = formatDuplicateTitle(longTitle);
      expect(duplicated.endsWith(" (Copy)")).toBe(true);
      expect(duplicated.length).toBeLessThanOrEqual(100);
    });
  });

  describe("Resume Limits", () => {
    it("defines MAX_RESUMES_PER_USER as 20", () => {
      expect(MAX_RESUMES_PER_USER).toBe(20);
    });
  });
});
