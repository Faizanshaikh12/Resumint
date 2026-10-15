import { describe, it, expect } from "vitest";
import { getTemplate, getAllTemplates, DEFAULT_TEMPLATE_ID, TEMPLATES } from "~/components/templates/registry";
import { TEMPLATE_KEYS } from "~/lib/schemas/template";
import { resolveTemplateDesign } from "~/lib/resume/template-adapter";

describe("Template Adapter & Legacy Resolver", () => {
  it("resolves all 10 canonical templates from registry", () => {
    for (const key of TEMPLATE_KEYS) {
      const template = getTemplate(key);
      expect(template, `Template '${key}' not resolved`).toBeDefined();
      expect(template.id).toBe(key);
      expect(template.name).toBeTruthy();
      expect(typeof template.Component).toBe("function");
    }
  });

  it("returns all 10 templates ordered by sortOrder from getAllTemplates()", () => {
    const all = getAllTemplates();
    expect(all.length).toBe(10);
    for (let i = 0; i < all.length - 1; i++) {
      const current = TEMPLATE_KEYS.indexOf(all[i]!.id);
      const next = TEMPLATE_KEYS.indexOf(all[i + 1]!.id);
      expect(current).toBeLessThan(next);
    }
  });

  it("gracefully falls back to modern template for unknown or invalid keys", () => {
    expect(getTemplate("non_existent").id).toBe(DEFAULT_TEMPLATE_ID);
    expect(getTemplate("").id).toBe(DEFAULT_TEMPLATE_ID);
    expect(getTemplate(null).id).toBe(DEFAULT_TEMPLATE_ID);
    expect(getTemplate(undefined).id).toBe(DEFAULT_TEMPLATE_ID);
  });

  it("maps legacy template resumes to their resolved layout variants and tokens", () => {
    // 1. Legacy Technical resume with single column override
    const technicalResolved = resolveTemplateDesign("technical", {
      accentColor: "#0284c7",
    });
    expect(technicalResolved.columns).toBe(2);
    expect(technicalResolved.sidebarSections).toContain("skills");
    expect(technicalResolved.sectionHeadingVariant).toBe("left-rule");

    // 2. Legacy Executive resume
    const executiveResolved = resolveTemplateDesign("executive", {
      accentColor: "#1e3a8a",
    });
    expect(executiveResolved.columns).toBe(1);
    expect(executiveResolved.headerAlign).toBe("center");
    expect(executiveResolved.sectionHeadingVariant).toBe("underlined");

    // 3. Legacy Minimal resume
    const minimalResolved = resolveTemplateDesign("minimal", {});
    expect(minimalResolved.sectionHeadingVariant).toBe("minimal");

    // 4. Unknown template falls back safely to modern defaults
    const unknownResolved = resolveTemplateDesign("unknown_xyz", {
      accentColor: "#ff0000",
    });
    expect(unknownResolved.accentColor).toBe("#ff0000"); // preserves user's accent color
    expect(unknownResolved.sectionHeadingVariant).toBe("accent-pill"); // modern's heading
  });
});
