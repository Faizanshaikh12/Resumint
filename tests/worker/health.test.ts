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

  it("verifies health route loader reports d1 connected and schema ready with 200 and no-store", async () => {
    const response = await loader();
    const data = (await response.json()) as {
      status: string;
      d1: string;
      schema: string;
      tablesVerified: number;
    };
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(data.status).toBe("ok");
    expect(data.d1).toBe("connected");
    expect(data.schema).toBe("ready");
    expect(data.tablesVerified).toBeGreaterThanOrEqual(5);
  });

  it("returns 503 with { status: 'error', check: 'db' } and no sensitive leak on DB failure", async () => {
    const brokenContext = {
      cloudflare: {
        env: {
          DB: {
            prepare: () => {
              throw new Error("Simulated D1 connection failure or timeout");
            },
          },
        } as unknown as Env,
      },
    };

    const response = await loader({ context: brokenContext });
    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");

    const data = (await response.json()) as Record<string, unknown>;
    expect(data).toEqual({
      status: "error",
      check: "db",
    });

    // Verify zero leaks of stack traces, queries, or database internals
    expect(data.message).toBeUndefined();
    expect(data.stack).toBeUndefined();
    expect(data.error).toBeUndefined();
    expect(JSON.stringify(data)).not.toContain("Simulated");
    expect(JSON.stringify(data)).not.toContain("SELECT");
  });

  it("exposes expected worker environment variables", () => {
    expect(env.APP_ENV).toBe("development");
    expect(env.VALUE_FROM_CLOUDFLARE).toBe("Hello from Cloudflare");
  });
});
