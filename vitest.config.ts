import { defineConfig } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-plugin";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts", "tests/components/**/*.test.tsx"],
          environment: "jsdom",
          globals: true,
          setupFiles: ["./tests/setup.ts"],
          alias: {
            "~": path.resolve(__dirname, "./app"),
          },
        },
      },
      {
        plugins: [
          cloudflareTest({
            wrangler: {
              configPath: "./wrangler.jsonc",
            },
          }),
        ],
        test: {
          name: "worker",
          include: ["tests/worker/**/*.test.ts"],
          globals: true,
          setupFiles: ["./tests/worker/setup.ts"],
          alias: {
            "~": path.resolve(__dirname, "./app"),
          },
        },
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: [
        "app/auth/**/*.ts",
        "app/lib/schemas/auth.ts",
        "app/lib/ats/**/*.ts",
      ],
    },
  },
});
