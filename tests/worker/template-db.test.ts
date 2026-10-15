import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import { createTestDb } from "../helpers/factories";
import { setupTestDatabase } from "../helpers/setup-db";
import { templateMaster } from "~/db/schema";
import { eq, asc } from "drizzle-orm";

describe("Template Master Database Operations", () => {
  beforeAll(async () => {
    await setupTestDatabase(env);
  });

  it("can insert and retrieve a template master record", async () => {
    const db = createTestDb(env);

    const testTemplate = {
      id: "tmpl_test_modern",
      key: "test_modern",
      name: "Test Modern",
      description: "Contemporary design with sleek headings",
      tier: "standard" as const,
      design: {
        accentColor: "#2563eb",
        fontKey: "inter" as const,
        fontScale: 1.0,
        lineSpacing: 1.3,
        pageMargin: 16,
        sectionSpacing: 16,
        pageSize: "A4" as const,
        headerAlign: "left" as const,
        dateStyle: "MMM YYYY" as const,
        showIcons: true,
      },
      layout: {
        headerVariant: "standard" as const,
        columns: 1 as const,
        sidebarSections: [],
        sidebarPosition: "right" as const,
        sectionHeadingVariant: "underlined" as const,
        itemVariant: "stacked" as const,
        skillsVariant: "tags" as const,
      },
      sampleContent: null,
      sortOrder: 1,
      isActive: true,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(templateMaster).values(testTemplate);

    const rows = await db
      .select()
      .from(templateMaster)
      .where(eq(templateMaster.key, "test_modern"));

    expect(rows.length).toBe(1);
    expect(rows[0]?.name).toBe("Test Modern");
    expect(rows[0]?.design.accentColor).toBe("#2563eb");
    expect(rows[0]?.layout.columns).toBe(1);
  });

  it("enforces uniqueness on template key", async () => {
    const db = createTestDb(env);

    const templateA = {
      id: "tmpl_dup_1",
      key: "unique_key_test",
      name: "Template One",
      description: "First instance",
      tier: "basic" as const,
      design: {
        accentColor: "#000000",
        fontKey: "inter" as const,
        fontScale: 1.0,
        lineSpacing: 1.3,
        pageMargin: 16,
        sectionSpacing: 16,
        pageSize: "A4" as const,
        headerAlign: "left" as const,
        dateStyle: "MMM YYYY" as const,
        showIcons: false,
      },
      layout: {
        headerVariant: "standard" as const,
        columns: 1 as const,
        sidebarSections: [],
        sidebarPosition: "right" as const,
        sectionHeadingVariant: "minimal" as const,
        itemVariant: "stacked" as const,
        skillsVariant: "tags" as const,
      },
      sampleContent: null,
      sortOrder: 2,
      isActive: true,
      version: 1,
    };

    await db.insert(templateMaster).values(templateA);

    // Attempt to insert duplicate key
    const duplicate = {
      ...templateA,
      id: "tmpl_dup_2",
    };

    await expect(db.insert(templateMaster).values(duplicate)).rejects.toThrow();
  });

  it("filters and sorts templates by sort_order", async () => {
    const db = createTestDb(env);

    await db.insert(templateMaster).values([
      {
        id: "tmpl_sort_b",
        key: "sort_b",
        name: "Sort B",
        description: "B",
        tier: "premium" as const,
        design: {
          accentColor: "#d97706",
          fontKey: "source-serif-4" as const,
          fontScale: 1.0,
          lineSpacing: 1.3,
          pageMargin: 16,
          sectionSpacing: 16,
          pageSize: "A4" as const,
          headerAlign: "center" as const,
          dateStyle: "MMM YYYY" as const,
          showIcons: true,
        },
        layout: {
          headerVariant: "centered" as const,
          columns: 1 as const,
          sidebarSections: [],
          sidebarPosition: "right" as const,
          sectionHeadingVariant: "small-caps" as const,
          itemVariant: "stacked" as const,
          skillsVariant: "pills" as const,
        },
        sampleContent: null,
        sortOrder: 20,
        isActive: true,
        version: 1,
      },
      {
        id: "tmpl_sort_a",
        key: "sort_a",
        name: "Sort A",
        description: "A",
        tier: "premium" as const,
        design: {
          accentColor: "#d97706",
          fontKey: "source-serif-4" as const,
          fontScale: 1.0,
          lineSpacing: 1.3,
          pageMargin: 16,
          sectionSpacing: 16,
          pageSize: "A4" as const,
          headerAlign: "center" as const,
          dateStyle: "MMM YYYY" as const,
          showIcons: true,
        },
        layout: {
          headerVariant: "centered" as const,
          columns: 1 as const,
          sidebarSections: [],
          sidebarPosition: "right" as const,
          sectionHeadingVariant: "small-caps" as const,
          itemVariant: "stacked" as const,
          skillsVariant: "pills" as const,
        },
        sampleContent: null,
        sortOrder: 10,
        isActive: true,
        version: 1,
      },
    ]);

    const results = await db
      .select()
      .from(templateMaster)
      .where(eq(templateMaster.tier, "premium"))
      .orderBy(asc(templateMaster.sortOrder));

    expect(results.length).toBeGreaterThanOrEqual(2);
    const sortedKeys = results.map((r) => r.key).filter((k) => k.startsWith("sort_"));
    expect(sortedKeys).toEqual(["sort_a", "sort_b"]);
  });

  it("successfully applies idempotent seed SQL statements in D1", async () => {
    const { generateTemplateSeedSql } = await import("~/db/seed/templates");
    const seedSql = generateTemplateSeedSql();

    // First execution
    await env.DB.exec(seedSql);

    const db = createTestDb(env);
    const allTemplates = await db.select().from(templateMaster);
    expect(allTemplates.length).toBeGreaterThanOrEqual(10);

    // Second execution (verify idempotency: no unique key collision errors)
    await expect(env.DB.exec(seedSql)).resolves.not.toThrow();

    // Verify all 10 canonical keys exist
    const canonicalKeys = [
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
    ];
    for (const key of canonicalKeys) {
      const match = allTemplates.find((t) => t.key === key);
      expect(match).toBeDefined();
      expect(match?.name).toBeTruthy();
      expect(match?.isActive).toBe(true);
    }
  });
});
