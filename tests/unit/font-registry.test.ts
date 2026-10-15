import { describe, it, expect } from "vitest";
import { getFontFamilyStack, FONT_REGISTRY } from "~/lib/resume/fonts";
import { BUNDLED_FONT_KEYS } from "~/lib/schemas/template";

describe("Font Registry Helper", () => {
  it("provides CSS font family stacks for all bundled font keys", () => {
    for (const key of BUNDLED_FONT_KEYS) {
      const font = FONT_REGISTRY[key];
      expect(font, `Missing font definition for ${key}`).toBeDefined();
      expect(font.name).toBeTruthy();
      expect(font.stack).toBeTruthy();
      expect(font.category).toMatch(/^(sans|serif|mono)$/);

      const stack = getFontFamilyStack(key);
      expect(stack).toContain(font.name);
    }
  });

  it("safely falls back to Inter font stack for unknown keys", () => {
    // @ts-expect-error testing invalid font key
    const stack = getFontFamilyStack("non_existent_font");
    expect(stack).toContain("Inter");
  });
});
