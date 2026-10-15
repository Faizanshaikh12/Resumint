import { describe, it, expect } from "vitest";
import { createDefaultContent, createSampleContent } from "~/lib/resume/defaults";
import { isBlankResume } from "~/components/templates/generic/GenericResumeRenderer";
import { resumeContentSchema } from "~/lib/schemas/resume";

describe("Blank Resume Initializer & Empty State Logic", () => {
  it("createDefaultContent returns completely empty personal info and arrays", () => {
    const blank = createDefaultContent();

    expect(blank.personal.name).toBe("");
    expect(blank.personal.title).toBe("");
    expect(blank.personal.email).toBe("");
    expect(blank.personal.phone).toBe("");
    expect(blank.personal.location).toBe("");
    expect(blank.personal.links).toEqual([]);

    expect(blank.summary).toBe("");
    expect(blank.experience).toEqual([]);
    expect(blank.education).toEqual([]);
    expect(blank.skills).toEqual([]);
    expect(blank.projects).toEqual([]);
    expect(blank.certifications).toEqual([]);
    expect(blank.languages).toEqual([]);
    expect(blank.awards).toEqual([]);
    expect(blank.publications).toEqual([]);
    expect(blank.volunteering).toEqual([]);
    expect(blank.interests).toEqual([]);
    expect(blank.references).toEqual([]);
    expect(blank.customSections).toEqual([]);
  });

  it("conforms strictly to resumeContentSchema", () => {
    const blank = createDefaultContent();
    const parsed = resumeContentSchema.safeParse(blank);
    expect(parsed.success).toBe(true);
  });

  it("isBlankResume correctly identifies empty vs filled content", () => {
    const blank = createDefaultContent();
    expect(isBlankResume(blank)).toBe(true);

    const filled = createSampleContent();
    expect(isBlankResume(filled)).toBe(false);

    // Partially filled resume is NOT blank
    const partial = {
      ...blank,
      personal: { ...blank.personal, name: "Jane Doe" },
    };
    expect(isBlankResume(partial)).toBe(false);
  });
});
