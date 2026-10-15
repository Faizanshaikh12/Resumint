import { describe, it, expect } from "vitest";
import {
  templateKeySchema,
  templateTierSchema,
  templateDesignTokensSchema,
  templateLayoutConfigSchema,
  templateMasterRowSchema,
  TEMPLATE_KEYS,
  TEMPLATE_TIERS,
} from "~/lib/schemas/template";

describe("Template Schemas", () => {
  it("validates all 10 expected template keys", () => {
    expect(TEMPLATE_KEYS).toEqual([
      "plain",
      "classic",
      "compact",
      "minimal",
      "modern",
      "technical",
      "executive",
      "elegant",
      "bold",
      "creative",
    ]);

    for (const key of TEMPLATE_KEYS) {
      expect(templateKeySchema.safeParse(key).success).toBe(true);
    }

    expect(templateKeySchema.safeParse("unknown_template").success).toBe(false);
  });

  it("validates all 3 template tiers", () => {
    expect(TEMPLATE_TIERS).toEqual(["basic", "standard", "premium"]);
    for (const tier of TEMPLATE_TIERS) {
      expect(templateTierSchema.safeParse(tier).success).toBe(true);
    }
    expect(templateTierSchema.safeParse("ultra").success).toBe(false);
  });

  it("validates template design tokens schema with defaults and constraints", () => {
    const validTokens = {
      accentColor: "#2563eb",
      fontKey: "inter",
      fontScale: 1.0,
      lineSpacing: 1.3,
      pageMargin: 16,
      sectionSpacing: 16,
      pageSize: "A4",
      headerAlign: "left",
      dateStyle: "MMM YYYY",
      showIcons: true,
    };

    const parsed = templateDesignTokensSchema.safeParse(validTokens);
    expect(parsed.success).toBe(true);

    // Invalid color
    expect(
      templateDesignTokensSchema.safeParse({ ...validTokens, accentColor: "not-a-color" }).success
    ).toBe(false);

    // Out of bound scale
    expect(
      templateDesignTokensSchema.safeParse({ ...validTokens, fontScale: 2.5 }).success
    ).toBe(false);

    // Out of bound margin
    expect(
      templateDesignTokensSchema.safeParse({ ...validTokens, pageMargin: 5 }).success
    ).toBe(false);
  });

  it("validates template layout config schema", () => {
    const validLayout = {
      headerVariant: "standard",
      columns: 1,
      sidebarSections: ["skills", "languages"],
      sidebarPosition: "right",
      sectionHeadingVariant: "underlined",
      itemVariant: "stacked",
      skillsVariant: "tags",
    };

    const parsed = templateLayoutConfigSchema.safeParse(validLayout);
    expect(parsed.success).toBe(true);

    // 2-column sidebar layout
    const twoCol = templateLayoutConfigSchema.safeParse({
      ...validLayout,
      columns: 2,
      sidebarPosition: "left",
      sectionHeadingVariant: "accent-pill",
    });
    expect(twoCol.success).toBe(true);

    // Invalid columns (e.g. 3)
    expect(
      templateLayoutConfigSchema.safeParse({ ...validLayout, columns: 3 }).success
    ).toBe(false);

    // Invalid variant
    expect(
      templateLayoutConfigSchema.safeParse({ ...validLayout, headerVariant: "invalid" }).success
    ).toBe(false);
  });

  it("validates complete template master row schema", () => {
    const row = {
      id: "tmpl_modern",
      key: "modern",
      name: "Modern",
      description: "Clean, contemporary layout with accent-colored section headings.",
      tier: "standard",
      design: {
        accentColor: "#2563eb",
        fontKey: "inter",
        fontScale: 1.0,
        lineSpacing: 1.3,
        pageMargin: 16,
        sectionSpacing: 16,
        pageSize: "A4",
        headerAlign: "left",
        dateStyle: "MMM YYYY",
        showIcons: true,
      },
      layout: {
        headerVariant: "standard",
        columns: 1,
        sidebarSections: [],
        sidebarPosition: "right",
        sectionHeadingVariant: "underlined",
        itemVariant: "stacked",
        skillsVariant: "tags",
      },
      sampleContent: null,
      sortOrder: 5,
      isActive: true,
      version: 1,
    };

    const parsed = templateMasterRowSchema.safeParse(row);
    expect(parsed.success).toBe(true);
  });
});
