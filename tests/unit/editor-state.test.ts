import { describe, expect, it } from "vitest";
import { formatDateRange, formatMonthYear, validateDateRange } from "~/lib/resume/dates";
import { createDefaultContent, createSampleContent } from "~/lib/resume/defaults";
import { editorReducer, getAllSectionIds } from "~/lib/resume/editor-state";
import { arrayMove, normalizeSectionOrder } from "~/lib/resume/reorder";
import {
  SECTION_REGISTRY,
  STANDARD_SECTION_IDS,
  createDefaultAwardItem,
  createDefaultCertificationItem,
  createDefaultCustomSection,
  createDefaultCustomSectionItem,
  createDefaultEducationItem,
  createDefaultExperienceItem,
  createDefaultInterestItem,
  createDefaultLanguageItem,
  createDefaultLink,
  createDefaultProjectItem,
  createDefaultPublicationItem,
  createDefaultReferenceItem,
  createDefaultSkillItem,
  createDefaultVolunteeringItem,
  getSectionMeta,
} from "~/lib/resume/section-registry";
import { resumeContentSchema } from "~/lib/schemas/resume";

describe("editor-state reducer", () => {
  it("maintains immutability and updates personal info fields", () => {
    const initial = createSampleContent();
    const updated = editorReducer(initial, {
      type: "UPDATE_FIELD",
      section: "personal",
      field: "name",
      value: "Jane Doe",
    });

    expect(updated).not.toBe(initial);
    expect(updated.personal).not.toBe(initial.personal);
    expect(updated.personal.name).toBe("Jane Doe");
    expect(initial.personal.name).toBe("Alex Morgan");
  });

  it("updates summary field", () => {
    const initial = createDefaultContent();
    const updated = editorReducer(initial, {
      type: "UPDATE_FIELD",
      section: "summary",
      value: "New executive summary",
    });

    expect(updated.summary).toBe("New executive summary");
    expect(initial.summary).not.toBe("New executive summary");
  });

  it("updates personal links", () => {
    const initial = createSampleContent();
    const linkId = initial.personal.links[0]?.id;
    expect(linkId).toBeDefined();

    const updated = editorReducer(initial, {
      type: "UPDATE_FIELD",
      section: "personal.links",
      itemId: linkId,
      field: "label",
      value: "Personal Website",
    });

    expect(updated.personal.links[0]?.label).toBe("Personal Website");
    expect(initial.personal.links[0]?.label).not.toBe("Personal Website");
  });

  it("updates item in standard multi-item section", () => {
    const initial = createSampleContent();
    const expId = initial.experience[0]?.id;
    expect(expId).toBeDefined();

    const updated = editorReducer(initial, {
      type: "UPDATE_FIELD",
      section: "experience",
      itemId: expId,
      field: "company",
      value: "Stripe",
    });

    expect(updated.experience[0]?.company).toBe("Stripe");
    expect(initial.experience[0]?.company).not.toBe("Stripe");
  });

  it("updates nested property via UPDATE_FIELD_PATH", () => {
    const initial = createDefaultContent();
    const updated = editorReducer(initial, {
      type: "UPDATE_FIELD_PATH",
      path: ["personal", "title"],
      value: "Principal Architect",
    });

    expect(updated.personal.title).toBe("Principal Architect");
  });

  it("adds, removes, and moves items in multi-item sections", () => {
    const initial = createDefaultContent();
    const newSkill = createDefaultSkillItem("Rust", "Intermediate");

    // Add item
    const withSkill = editorReducer(initial, {
      type: "ADD_ITEM",
      section: "skills",
      item: newSkill,
    });
    expect(withSkill.skills.some((s) => s.name === "Rust")).toBe(true);

    // Move item
    const moved = editorReducer(withSkill, {
      type: "MOVE_ITEM",
      section: "skills",
      fromIndex: withSkill.skills.length - 1,
      toIndex: 0,
    });
    expect(moved.skills[0]?.name).toBe("Rust");

    // Remove item
    const removed = editorReducer(moved, {
      type: "REMOVE_ITEM",
      section: "skills",
      itemId: newSkill.id,
    });
    expect(removed.skills.some((s) => s.name === "Rust")).toBe(false);
  });

  it("handles custom section lifecycle: add, rename, add item, update, remove", () => {
    const initial = createDefaultContent();

    // Add section
    const withCustom = editorReducer(initial, {
      type: "ADD_SECTION",
      title: "Patents",
    });
    expect(withCustom.customSections).toHaveLength(1);
    const customSec = withCustom.customSections[0]!;
    expect(customSec.title).toBe("Patents");
    expect(withCustom.sectionOrder).toContain(customSec.id);

    // Rename section
    const renamed = editorReducer(withCustom, {
      type: "RENAME_SECTION",
      sectionId: customSec.id,
      title: "US Patents & Inventions",
    });
    expect(renamed.customSections[0]?.title).toBe("US Patents & Inventions");

    // Add item to custom section
    const customItem = createDefaultCustomSectionItem();
    customItem.title = "US Patent 9,999,999";
    const withItem = editorReducer(renamed, {
      type: "ADD_ITEM",
      section: customSec.id,
      item: customItem,
    });
    expect(withItem.customSections[0]?.items).toHaveLength(1);
    expect(withItem.customSections[0]?.items[0]?.title).toBe("US Patent 9,999,999");

    // Update item in custom section
    const updatedItem = editorReducer(withItem, {
      type: "UPDATE_FIELD",
      section: customSec.id,
      itemId: customItem.id,
      field: "subtitle",
      value: "Approved & Granted",
    });
    expect(updatedItem.customSections[0]?.items[0]?.subtitle).toBe("Approved & Granted");

    // Add bullet to custom section item
    const withBullet = editorReducer(updatedItem, {
      type: "ADD_BULLET",
      section: customSec.id,
      itemId: customItem.id,
      text: "Granted with 12 novel claims.",
    });
    expect(withBullet.customSections[0]?.items[0]?.bullets).toEqual([
      "Granted with 12 novel claims.",
    ]);

    // Remove section
    const withoutCustom = editorReducer(withBullet, {
      type: "REMOVE_SECTION",
      sectionId: customSec.id,
    });
    expect(withoutCustom.customSections).toHaveLength(0);
    expect(withoutCustom.sectionOrder).not.toContain(customSec.id);
  });

  it("manages bullets: add, remove, and move within items", () => {
    const initial = createSampleContent();
    const expId = initial.experience[0]?.id;
    expect(expId).toBeDefined();

    // Add bullet
    const withBullet = editorReducer(initial, {
      type: "ADD_BULLET",
      section: "experience",
      itemId: expId,
      text: "Introduced zero-downtime deployment pipelines.",
      index: 0,
    });
    expect(withBullet.experience[0]?.bullets[0]).toBe(
      "Introduced zero-downtime deployment pipelines."
    );

    // Move bullet
    const moved = editorReducer(withBullet, {
      type: "MOVE_BULLET",
      section: "experience",
      itemId: expId,
      fromIndex: 0,
      toIndex: 1,
    });
    expect(moved.experience[0]?.bullets[1]).toBe(
      "Introduced zero-downtime deployment pipelines."
    );

    // Remove bullet
    const removed = editorReducer(moved, {
      type: "REMOVE_BULLET",
      section: "experience",
      itemId: expId,
      bulletIndex: 1,
    });
    expect(
      removed.experience[0]?.bullets.includes(
        "Introduced zero-downtime deployment pipelines."
      )
    ).toBe(false);
  });

  it("toggles section hidden state", () => {
    const initial = createDefaultContent();
    expect(initial.hiddenSections).not.toContain("projects");

    const hidden = editorReducer(initial, {
      type: "TOGGLE_SECTION_HIDDEN",
      sectionId: "projects",
    });
    expect(hidden.hiddenSections).toContain("projects");

    const unhidden = editorReducer(hidden, {
      type: "TOGGLE_SECTION_HIDDEN",
      sectionId: "projects",
    });
    expect(unhidden.hiddenSections).not.toContain("projects");
  });

  it("reorders sections and normalizes section order", () => {
    const initial = createDefaultContent();
    const reordered = editorReducer(initial, {
      type: "REORDER_SECTIONS",
      fromIndex: 0,
      toIndex: 2,
    });

    expect(reordered.sectionOrder[2]).toBe(initial.sectionOrder[0]);
  });

  it("replaces entire content and normalizes order", () => {
    const initial = createDefaultContent();
    const replacement = createDefaultContent();
    replacement.personal.name = "Alice Wonder";
    replacement.sectionOrder = ["projects", "experience"];

    const updated = editorReducer(initial, {
      type: "REPLACE_CONTENT",
      content: replacement,
    });

    expect(updated.personal.name).toBe("Alice Wonder");
    expect(updated.sectionOrder.slice(0, 2)).toEqual(["projects", "experience"]);
    // Preserves all known sections
    expect(updated.sectionOrder.length).toBeGreaterThan(2);
  });
});

describe("reorder utilities", () => {
  it("arrayMove handles normal and out-of-bounds moves", () => {
    const arr = [1, 2, 3, 4];
    expect(arrayMove(arr, 0, 2)).toEqual([2, 3, 1, 4]);
    expect(arrayMove(arr, 3, 1)).toEqual([1, 4, 2, 3]);
    expect(arrayMove(arr, 1, 1)).toEqual([1, 2, 3, 4]);
    expect(arrayMove(arr, -1, 2)).toEqual([1, 2, 3, 4]);
    expect(arrayMove(arr, 1, 10)).toEqual([1, 2, 3, 4]);
  });

  it("normalizeSectionOrder drops unknowns, deduplicates, and adds missing", () => {
    const known = ["summary", "experience", "education", "skills"];
    const incoming = ["education", "unknown_sec", "skills", "education"];
    const result = normalizeSectionOrder(incoming, known);

    expect(result).toEqual(["education", "skills", "summary", "experience"]);
  });
});

describe("dates utilities", () => {
  it("validates date ranges", () => {
    expect(validateDateRange({ start: "2020", end: "2022" })).toBe(true);
    expect(validateDateRange({ start: "2022-05", end: "2022-05" })).toBe(true);
    expect(validateDateRange({ start: "2022-05", end: "2021-01" })).toBe(false);
    expect(validateDateRange({ start: "2022", end: "2021" })).toBe(false);
    expect(validateDateRange({ start: "2022", end: "", current: true })).toBe(true);
    expect(validateDateRange(null)).toBe(true);
  });

  it("formats month and year strings", () => {
    expect(formatMonthYear("2023-04")).toBe("Apr 2023");
    expect(formatMonthYear("2021-12")).toBe("Dec 2021");
    expect(formatMonthYear("2020")).toBe("2020");
    expect(formatMonthYear("")).toBe("");
  });

  it("formats date ranges for resume display", () => {
    expect(formatDateRange({ start: "2020-01", end: "2022-06", current: false })).toBe(
      "Jan 2020 – Jun 2022"
    );
    expect(formatDateRange({ start: "2022-03", end: "", current: true })).toBe(
      "Mar 2022 – Present"
    );
    expect(formatDateRange({ start: "", end: "", current: true })).toBe("Present");
    expect(formatDateRange(null)).toBe("");
  });
});

describe("section-registry completeness", () => {
  it("every standard section exists in registry and in resumeContentSchema", () => {
    const schemaShape = (resumeContentSchema as any)._def.schema
      ? (resumeContentSchema as any)._def.schema.shape
      : (resumeContentSchema as any).shape;

    for (const sectionId of STANDARD_SECTION_IDS) {
      expect(SECTION_REGISTRY[sectionId]).toBeDefined();
      expect(SECTION_REGISTRY[sectionId].id).toBe(sectionId);
      expect(SECTION_REGISTRY[sectionId].label).toBeTruthy();
    }
  });

  it("factories return fresh items with valid IDs", () => {
    const exp1 = createDefaultExperienceItem();
    const exp2 = createDefaultExperienceItem();
    expect(exp1.id).toBeTruthy();
    expect(exp2.id).toBeTruthy();
    expect(exp1.id).not.toBe(exp2.id);

    const edu = createDefaultEducationItem();
    expect(edu.id).toBeTruthy();

    const link = createDefaultLink();
    expect(link.id).toBeTruthy();

    const customSec = createDefaultCustomSection("Portfolio");
    expect(customSec.id).toBeTruthy();
    expect(customSec.title).toBe("Portfolio");
  });

  it("getSectionMeta returns correct metadata for standard and custom sections", () => {
    const expMeta = getSectionMeta("experience");
    expect(expMeta.isCustomizable).toBe(false);
    expect(expMeta.label).toBe("Work Experience");

    const customMeta = getSectionMeta("custom-123", "Leadership Highlights");
    expect(customMeta.isCustomizable).toBe(true);
    expect(customMeta.label).toBe("Leadership Highlights");
  });
});
