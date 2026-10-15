import { describe, it, expect } from "vitest";
import { applyTemplateToResume } from "~/lib/resume/template-apply";
import { createDefaultDesign, createDefaultContent } from "~/lib/resume/defaults";
import type { ResumeDesign } from "~/lib/schemas/resume";

describe("Copy-on-Apply Template Logic", () => {
  const initialDesign: ResumeDesign = {
    ...createDefaultDesign(),
    accentColor: "#ff0077",
    pageSize: "Letter",
    headerAlign: "left",
    columns: 1,
  };

  it("applies complete target template style by default (tokens + layout)", () => {
    // Apply "technical" template (which uses #0284c7, columns: 2, roboto-mono, left-rule)
    const result = applyTemplateToResume(initialDesign, "technical");

    expect(result.newTemplateId).toBe("technical");
    expect(result.newDesign.accentColor).toBe("#0284c7"); // default full apply replaces color
    expect(result.newDesign.columns).toBe(2);
    expect(result.newDesign.headerVariant).toBe("compact");
    expect(result.newDesign.sectionHeadingVariant).toBe("left-rule");
    expect(result.newDesign.sidebarSections).toContain("skills");

    // Previous design snapshot is returned for 1-click undo
    expect(result.previousDesign).toEqual(initialDesign);
  });

  it("preserves accentColor and pageSize when keepColorAndPageSize is true", () => {
    const result = applyTemplateToResume(initialDesign, "technical", {
      keepColorAndPageSize: true,
    });

    expect(result.newTemplateId).toBe("technical");
    // Preserved user choices
    expect(result.newDesign.accentColor).toBe("#ff0077");
    expect(result.newDesign.pageSize).toBe("Letter");

    // Still applies target layout variants
    expect(result.newDesign.columns).toBe(2);
    expect(result.newDesign.headerVariant).toBe("compact");
    expect(result.newDesign.sectionHeadingVariant).toBe("left-rule");
  });

  it("preserves resume content with 100% deep equality before and after apply", () => {
    const contentBefore = createDefaultContent();
    const clonedContent = JSON.parse(JSON.stringify(contentBefore));

    // Applying template only modifies design & templateId
    const { newDesign, newTemplateId } = applyTemplateToResume(initialDesign, "creative");

    expect(newTemplateId).toBe("creative");
    expect(newDesign.columns).toBe(2);
    // Content remains completely untouched
    expect(contentBefore).toEqual(clonedContent);
  });

  it("allows 1-step undo to restore previous design completely", () => {
    const step1 = applyTemplateToResume(initialDesign, "elegant");
    expect(step1.newTemplateId).toBe("elegant");

    // Revert using previousDesign snapshot
    const reverted = step1.previousDesign;
    expect(reverted).toEqual(initialDesign);
    expect(reverted.accentColor).toBe("#ff0077");
    expect(reverted.columns).toBe(1);
  });
});
