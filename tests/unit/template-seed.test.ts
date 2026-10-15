import { describe, it, expect } from "vitest";
import { TEMPLATE_SEED_DATA, generateTemplateSeedSql } from "~/db/seed/templates";
import { templateMasterRowSchema, TEMPLATE_KEYS } from "~/lib/schemas/template";

describe("Template Seed Data Validation", () => {
  it("defines all 10 required templates with unique valid keys", () => {
    expect(TEMPLATE_SEED_DATA.length).toBe(10);

    const keys = TEMPLATE_SEED_DATA.map((t) => t.key);
    expect(new Set(keys).size).toBe(10);
    expect(keys.sort()).toEqual([...TEMPLATE_KEYS].sort());
  });

  it("ensures every seed row passes templateMasterRowSchema", () => {
    for (const template of TEMPLATE_SEED_DATA) {
      const parsed = templateMasterRowSchema.safeParse(template);
      expect(parsed.success, `Template '${template.key}' failed schema validation: ${JSON.stringify(parsed.error?.format())}`).toBe(true);
    }
  });

  it("ensures sortOrders are sequential and unique from 1 to 10", () => {
    const orders = TEMPLATE_SEED_DATA.map((t) => t.sortOrder);
    expect(new Set(orders).size).toBe(10);
    expect(Math.min(...orders)).toBe(1);
    expect(Math.max(...orders)).toBe(10);
  });

  it("covers all 3 tiers with appropriate representation", () => {
    const tiers = TEMPLATE_SEED_DATA.map((t) => t.tier);
    expect(tiers.filter((t) => t === "basic").length).toBe(3);
    expect(tiers.filter((t) => t === "standard").length).toBe(4);
    expect(tiers.filter((t) => t === "premium").length).toBe(3);
  });

  it("includes both 1-column and 2-column sidebar layouts", () => {
    const singleCol = TEMPLATE_SEED_DATA.filter((t) => t.layout.columns === 1);
    const doubleCol = TEMPLATE_SEED_DATA.filter((t) => t.layout.columns === 2);
    expect(singleCol.length).toBeGreaterThan(0);
    expect(doubleCol.length).toBeGreaterThan(0);

    // technical and creative are 2-col
    const technical = TEMPLATE_SEED_DATA.find((t) => t.key === "technical");
    expect(technical?.layout.columns).toBe(2);
    const creative = TEMPLATE_SEED_DATA.find((t) => t.key === "creative");
    expect(creative?.layout.columns).toBe(2);
  });

  it("generates valid idempotent upsert SQL statements", () => {
    const sql = generateTemplateSeedSql();
    expect(sql).toContain('INSERT INTO "template_master"');
    expect(sql).toContain("ON CONFLICT");
    expect(sql).toContain("DO UPDATE SET");
    expect(sql.split("INSERT INTO").length - 1).toBe(10);
  });
});
