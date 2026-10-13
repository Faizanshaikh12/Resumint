import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import { setupTestDatabase } from "../helpers/setup-db";
import { loader } from "~/routes/health";

describe("Worker /health and D1 connectivity", () => {
  beforeAll(async () => {
    await setupTestDatabase(env);
  });

  it("executes SELECT 1 on local D1 successfully", async () => {
    const result = await env.DB.prepare("SELECT 1 as ping").first<{ ping: number }>();
    expect(result).toBeDefined();
    expect(result?.ping).toBe(1);
  });

  it("verifies health route loader reports d1 connected and schema ready", async () => {
    const response = await loader();
    const data = (await response.json()) as {
      status: string;
      d1: string;
      schema: string;
      tablesVerified: number;
    };
    expect(response.status).toBe(200);
    expect(data.status).toBe("ok");
    expect(data.d1).toBe("connected");
    expect(data.schema).toBe("ready");
    expect(data.tablesVerified).toBeGreaterThanOrEqual(5);
  });

  it("exposes expected worker environment variables", () => {
    expect(env.APP_ENV).toBe("development");
    expect(env.VALUE_FROM_CLOUDFLARE).toBe("Hello from Cloudflare");
  });
});
