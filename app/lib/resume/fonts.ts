import type { BundledFontKey } from "../schemas/template";

export interface FontDefinition {
  key: BundledFontKey;
  name: string;
  category: "sans" | "serif" | "mono";
  stack: string;
}

export const FONT_REGISTRY: Record<BundledFontKey, FontDefinition> = {
  inter: {
    key: "inter",
    name: "Inter",
    category: "sans",
    stack: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  "source-serif-4": {
    key: "source-serif-4",
    name: "Source Serif 4",
    category: "serif",
    stack: '"Source Serif 4", Georgia, Cambria, "Times New Roman", Times, serif',
  },
  lato: {
    key: "lato",
    name: "Lato",
    category: "sans",
    stack: '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  merriweather: {
    key: "merriweather",
    name: "Merriweather",
    category: "serif",
    stack: '"Merriweather", Georgia, "Times New Roman", serif',
  },
  "ibm-plex-sans": {
    key: "ibm-plex-sans",
    name: "IBM Plex Sans",
    category: "sans",
    stack: '"IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  "roboto-mono": {
    key: "roboto-mono",
    name: "Roboto Mono",
    category: "mono",
    stack: '"Roboto Mono", SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  "plus-jakarta-sans": {
    key: "plus-jakarta-sans",
    name: "Plus Jakarta Sans",
    category: "sans",
    stack: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
};

export function getFontFamilyStack(fontKey?: string): string {
  if (fontKey && fontKey in FONT_REGISTRY) {
    return FONT_REGISTRY[fontKey as BundledFontKey].stack;
  }
  return FONT_REGISTRY.inter.stack;
}
