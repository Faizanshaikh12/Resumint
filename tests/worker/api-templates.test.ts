import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import { setupTestDatabase } from "../helpers/setup-db";
import { loader } from "~/routes/api.templates";
import { generateTemplateSeedSql } from "~/db/seed/templates";

describe("Public Templates Resource Route (/api/templates)", () => {
  beforeAll(async () => {
    await setupTestDatabase(env);
  });

  it("serves active templates with public edge caching headers", async () => {
    // Ensure seed is applied
    await env.DB.exec(generateTemplateSeedSql());

    const response = await loader({
      context: {
        cloudflare: { env },
      },
    });

    expect(response.status).toBe(200);

    // Verify Edge Cache-Control headers
    const cacheControl = response.headers.get("Cache-Control");
    expect(cacheControl).toContain("public");
    expect(cacheControl).toContain("max-age=3600");
    expect(cacheControl).toContain("s-maxage=86400");
    expect(cacheControl).toContain("stale-while-revalidate=604800");

    const data = (await response.json()) as { templates: Array<{ key: string; name: string; tier: string; sortOrder: number }> };
    expect(Array.isArray(data.templates)).toBe(true);
    expect(data.templates.length).toBeGreaterThanOrEqual(10);

    // Verify ordering by sortOrder
    for (let i = 0; i < data.templates.length - 1; i++) {
      expect(data.templates[i]!.sortOrder).toBeLessThanOrEqual(data.templates[i + 1]!.sortOrder);
    }

    // Verify canonical keys are present
    const keys = data.templates.map((t) => t.key);
    expect(keys).toContain("plain");
    expect(keys).toContain("classic");
    expect(keys).toContain("modern");
    expect(keys).toContain("technical");
    expect(keys).toContain("creative");
  });

  it("gracefully falls back to bundled seed templates if database table is unpopulated", async () => {
    // Simulated context without DB rows
    const emptyContext = {
      cloudflare: {
        env: {
          DB: {
            prepare: () => ({
              all: async () => ({ results: [] }),
            }),
          },
        } as unknown as Env,
      },
    };

    const response = await loader({ context: emptyContext });
    expect(response.status).toBe(200);

    const data = (await response.json()) as { templates: Array<{ key: string }> };
    expect(data.templates.length).toBe(10);
    expect(data.templates.find((t) => t.key === "modern")).toBeDefined();
  });
});
