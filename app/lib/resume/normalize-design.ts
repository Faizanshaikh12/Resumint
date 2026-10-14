import {
  resumeDesignSchema,
  type ResumeDesign,
  type BundledFontFamily,
  BUNDLED_FONT_FAMILIES,
} from "../schemas/resume";

export interface TemplateSupportOptions {
  columns?: number[];
  headerAlign?: ("left" | "center")[];
}

/**
 * Normalizes and clamps any incoming design payload, enforcing bounds and template capabilities.
 * Guarantees that neither corrupt client data nor legacy DB rows crash rendering.
 */
export function normalizeDesign(
  design: unknown,
  templateSupports?: TemplateSupportOptions
): ResumeDesign {
  const raw = (typeof design === "object" && design !== null ? design : {}) as Record<string, unknown>;
  const preClamped: Record<string, unknown> = { ...raw };

  if (typeof raw.fontScale === "number") {
    preClamped.fontScale = Math.round(Math.min(1.25, Math.max(0.85, raw.fontScale)) * 100) / 100;
  }
  if (typeof raw.lineSpacing === "number") {
    preClamped.lineSpacing = Math.round(Math.min(1.8, Math.max(1.0, raw.lineSpacing)) * 100) / 100;
  }
  if (typeof raw.pageMargin === "number") {
    preClamped.pageMargin = Math.round(Math.min(30, Math.max(10, raw.pageMargin)));
  }
  if (typeof raw.sectionSpacing === "number") {
    preClamped.sectionSpacing = Math.round(Math.min(32, Math.max(8, raw.sectionSpacing)));
  }

  const parseResult = resumeDesignSchema.safeParse(preClamped);
  const base: ResumeDesign = parseResult.success
    ? parseResult.data
    : {
        accentColor: "#2563eb",
        fontFamily: "inter",
        fontScale: 1.0,
        lineSpacing: 1.3,
        pageMargin: 16,
        sectionSpacing: 16,
        pageSize: "A4",
        columns: 1,
        headerAlign: "left",
        dateStyle: "MMM YYYY",
        showIcons: true,
      };

  // 1. Clamp numeric ranges
  const fontScale = Math.round(Math.min(1.25, Math.max(0.85, base.fontScale)) * 100) / 100;
  const lineSpacing = Math.round(Math.min(1.8, Math.max(1.0, base.lineSpacing)) * 100) / 100;
  const pageMargin = Math.round(Math.min(30, Math.max(10, base.pageMargin)));
  const sectionSpacing = Math.round(Math.min(32, Math.max(8, base.sectionSpacing)));

  // 2. Validate font family
  const fontFamily: BundledFontFamily = BUNDLED_FONT_FAMILIES.includes(
    base.fontFamily as BundledFontFamily
  )
    ? (base.fontFamily as BundledFontFamily)
    : "inter";

  // 3. Normalize page size
  const pageSize = base.pageSize === "Letter" ? "Letter" : "A4";

  // 4. Check template capabilities
  let columns: 1 | 2 = base.columns === 2 ? 2 : 1;
  if (templateSupports?.columns && !templateSupports.columns.includes(columns)) {
    columns = (templateSupports.columns[0] as 1 | 2) || 1;
  }

  let headerAlign: "left" | "center" = base.headerAlign === "center" ? "center" : "left";
  if (templateSupports?.headerAlign && !templateSupports.headerAlign.includes(headerAlign)) {
    headerAlign = templateSupports.headerAlign[0] || "left";
  }

  return {
    ...base,
    fontFamily,
    fontScale,
    lineSpacing,
    pageMargin,
    sectionSpacing,
    pageSize,
    columns,
    headerAlign,
  };
}
