import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";

describe("Worker /health and D1 connectivity", () => {
  it("executes SELECT 1 on local D1 successfully", async () => {
    const result = await env.DB.prepare("SELECT 1 as ping").first<{ ping: number }>();
    expect(result).toBeDefined();
    expect(result?.ping).toBe(1);
  });

  it("exposes expected worker environment variables", () => {
    expect(env.APP_ENV).toBe("development");
    expect(env.VALUE_FROM_CLOUDFLARE).toBe("Hello from Cloudflare");
  });
});
