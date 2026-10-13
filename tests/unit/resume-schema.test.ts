import { describe, it, expect } from "vitest";
import {
  resumeContentSchema,
  resumeDesignSchema,
  templateIdSchema,
} from "~/lib/schemas/resume";
import { createDefaultContent, createDefaultDesign } from "~/lib/resume/defaults";

describe("Resume Schemas & Defaults", () => {
  it("validates that default content passes resumeContentSchema", () => {
    const defaultContent = createDefaultContent();
    const result = resumeContentSchema.safeParse(defaultContent);
    expect(result.success).toBe(true);
  });

  it("validates that default design passes resumeDesignSchema", () => {
    const defaultDesign = createDefaultDesign();
    const result = resumeDesignSchema.safeParse(defaultDesign);
    expect(result.success).toBe(true);
  });

  it("accepts all valid template ids and rejects unknown templates", () => {
    expect(templateIdSchema.safeParse("modern").success).toBe(true);
    expect(templateIdSchema.safeParse("minimal").success).toBe(true);
    expect(templateIdSchema.safeParse("executive").success).toBe(true);
    expect(templateIdSchema.safeParse("classic").success).toBe(true);
    expect(templateIdSchema.safeParse("technical").success).toBe(true);
    expect(templateIdSchema.safeParse("invalid_template").success).toBe(false);
  });

  it("enforces maximum item constraints on experience", () => {
    const content = createDefaultContent();
    // Exceed max 30 items
    content.experience = Array.from({ length: 35 }, (_, i) => ({
      id: `exp-${i}`,
      company: `Company ${i}`,
      position: "Engineer",
      date: { start: "2020-01", current: true },
      bullets: ["Built scalable systems."],
    }));

    const result = resumeContentSchema.safeParse(content);
    expect(result.success).toBe(false);
  });

  it("validates accentColor formats (hex or hsl)", () => {
    const design = createDefaultDesign();
    expect(resumeDesignSchema.safeParse({ ...design, accentColor: "#3b82f6" }).success).toBe(true);
    expect(resumeDesignSchema.safeParse({ ...design, accentColor: "#fff" }).success).toBe(true);
    expect(
      resumeDesignSchema.safeParse({ ...design, accentColor: "hsl(217.2, 91.2%, 59.8%)" }).success
    ).toBe(true);

    // Invalid color
    expect(resumeDesignSchema.safeParse({ ...design, accentColor: "not-a-color" }).success).toBe(
      false
    );
  });

  it("enforces the 200 KB serialized size cap on resume content", () => {
    const content = createDefaultContent();
    // Generate massive bullet array exceeding 200 KB
    const largeBullet = "A".repeat(450);
    content.experience = Array.from({ length: 25 }, (_, i) => ({
      id: `exp-${i}`,
      company: `Company ${i}`,
      position: "Engineer",
      date: { start: "2020", current: false },
      bullets: Array.from({ length: 20 }, () => largeBullet),
    }));

    const result = resumeContentSchema.safeParse(content);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("200 KB");
    }
  });
});
