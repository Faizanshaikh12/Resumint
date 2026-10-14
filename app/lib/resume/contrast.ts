/**
 * WCAG 2.1 Contrast Calculation Utilities
 *
 * Implements relative luminance and contrast ratio according to:
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 * https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Parses a 3-character or 6-character hex string into RGB numbers [0..255].
 * Handles optional leading '#' and fallbacks gracefully for invalid formats.
 */
export function hexToRgb(hex: string): RGB {
  let clean = hex.trim().replace(/^#/, "");
  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (clean.length !== 6) {
    // Fallback to default blue if invalid
    return { r: 37, g: 99, b: 235 };
  }

  const num = parseInt(clean, 16);
  if (Number.isNaN(num)) {
    return { r: 37, g: 99, b: 235 };
  }

  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Computes the relative luminance of an sRGB color.
 */
export function getRelativeLuminance(rgb: RGB): number {
  const [rs, gs, bs] = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map((val) => {
    return val <= 0.04045 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * (rs ?? 0) + 0.7152 * (gs ?? 0) + 0.0722 * (bs ?? 0);
}

/**
 * Calculates the WCAG contrast ratio between two colors (e.g. 1.0 to 21.0).
 */
export function getContrastRatio(color1: string, color2: string = "#ffffff"): number {
  const l1 = getRelativeLuminance(hexToRgb(color1));
  const l2 = getRelativeLuminance(hexToRgb(color2));

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

/**
 * Evaluates whether an accent color on white achieves WCAG AA (4.5:1) for body text / small headings.
 */
export function isAccentReadable(hex: string): boolean {
  return getContrastRatio(hex, "#ffffff") >= 4.5;
}
