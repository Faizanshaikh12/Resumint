import type { ResumeDesign, BundledFontFamily } from "../schemas/resume";
import { createDefaultDesign } from "./defaults";

export const DEFAULT_DESIGN: ResumeDesign = createDefaultDesign();

export const FONT_STACKS: Record<BundledFontFamily, string> = {
  inter: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  "source-serif-4": '"Source Serif 4", Georgia, Cambria, "Times New Roman", Times, serif',
  lato: '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  merriweather: '"Merriweather", Georgia, "Times New Roman", serif',
  "ibm-plex-sans": '"IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  "roboto-mono": '"Roboto Mono", Menlo, Monaco, Consolas, "Liberation Mono", monospace',
};

export const PAGE_DIMENSIONS = {
  A4: {
    width: "210mm",
    height: "297mm",
    widthPt: 595.28,
    heightPt: 841.89,
    widthPx: 794,
    heightPx: 1123,
  },
  Letter: {
    width: "8.5in",
    height: "11in",
    widthPt: 612.0,
    heightPt: 792.0,
    widthPx: 816,
    heightPx: 1056,
  },
} as const;

export interface DesignTokens {
  "--accent": string;
  "--font": string;
  "--scale": string;
  "--line": string;
  "--margin": string;
  "--gap": string;
  "--page-width": string;
  "--page-height": string;
  "--header-align": string;
  [key: string]: string;
}

/**
 * Converts a ResumeDesign object into CSS custom property tokens.
 */
export function generateDesignTokens(design: ResumeDesign): DesignTokens {
  const family = (design.fontFamily || "inter") as BundledFontFamily;
  const fontStack = FONT_STACKS[family] || FONT_STACKS.inter;
  const pageSize = design.pageSize === "Letter" ? "Letter" : "A4";
  const dimensions = PAGE_DIMENSIONS[pageSize];

  const scale = typeof design.fontScale === "number" ? design.fontScale : 1.0;
  const line = typeof design.lineSpacing === "number" ? design.lineSpacing : 1.3;
  const margin = typeof design.pageMargin === "number" ? design.pageMargin : 16;
  const gap = typeof design.sectionSpacing === "number" ? design.sectionSpacing : 16;

  return {
    "--accent": design.accentColor || "#2563eb",
    "--font": fontStack,
    "--scale": scale.toString(),
    "--line": line.toString(),
    "--margin": `${margin}mm`,
    "--gap": `${gap}mm`,
    "--page-width": dimensions.width,
    "--page-height": dimensions.height,
    "--header-align": design.headerAlign || "left",
  };
}
