import { z } from "zod";
import { resumeContentSchema } from "./resume";

export const TEMPLATE_KEYS = [
  "plain",
  "classic",
  "compact",
  "minimal",
  "modern",
  "technical",
  "executive",
  "elegant",
  "bold",
  "creative",
] as const;

export type TemplateKey = (typeof TEMPLATE_KEYS)[number];
export const templateKeySchema = z.enum(TEMPLATE_KEYS);

export const TEMPLATE_TIERS = ["basic", "standard", "premium"] as const;
export type TemplateTier = (typeof TEMPLATE_TIERS)[number];
export const templateTierSchema = z.enum(TEMPLATE_TIERS);

export const BUNDLED_FONT_KEYS = [
  "inter",
  "source-serif-4",
  "lato",
  "merriweather",
  "ibm-plex-sans",
  "roboto-mono",
  "plus-jakarta-sans",
] as const;
export type BundledFontKey = (typeof BUNDLED_FONT_KEYS)[number];
export const bundledFontKeySchema = z.enum(BUNDLED_FONT_KEYS);

// Color validation regex: hex or hsl
const colorRegex = /^#([0-9a-fA-F]{3}){1,2}$|^hsl\([^)]+\)$/;

export const templateDesignTokensSchema = z.object({
  accentColor: z
    .string()
    .max(30)
    .regex(colorRegex, "Must be valid hex or hsl color")
    .default("#2563eb"),
  fontKey: bundledFontKeySchema.default("inter"),
  fontScale: z.number().min(0.85).max(1.25).default(1.0),
  lineSpacing: z.number().min(1.0).max(1.8).default(1.3),
  pageMargin: z.number().min(10).max(30).default(16),
  sectionSpacing: z.number().min(8).max(32).default(16),
  pageSize: z.enum(["A4", "Letter"]).default("A4"),
  headerAlign: z.enum(["left", "center", "right"]).default("left"),
  dateStyle: z.enum(["MMM YYYY", "MM/YYYY", "YYYY"]).default("MMM YYYY"),
  showIcons: z.boolean().default(true),
  primaryTextColor: z.string().max(30).regex(colorRegex).optional().default("#111827"),
  secondaryTextColor: z.string().max(30).regex(colorRegex).optional().default("#4b5563"),
  backgroundColor: z.string().max(30).regex(colorRegex).optional().default("#ffffff"),
});
export type TemplateDesignTokens = z.infer<typeof templateDesignTokensSchema>;

export const headerVariantSchema = z.enum([
  "standard",
  "centered",
  "banner",
  "compact",
]);
export type HeaderVariant = z.infer<typeof headerVariantSchema>;

export const sectionHeadingVariantSchema = z.enum([
  "underlined",
  "accent-pill",
  "small-caps",
  "left-rule",
  "minimal",
]);
export type SectionHeadingVariant = z.infer<typeof sectionHeadingVariantSchema>;

export const itemVariantSchema = z.enum([
  "compact-row",
  "stacked",
  "bulleted",
]);
export type ItemVariant = z.infer<typeof itemVariantSchema>;

export const skillsVariantSchema = z.enum([
  "tags",
  "pills",
  "categorical-list",
  "inline-comma",
]);
export type SkillsVariant = z.infer<typeof skillsVariantSchema>;

export const templateLayoutConfigSchema = z.object({
  headerVariant: headerVariantSchema.default("standard"),
  columns: z.union([z.literal(1), z.literal(2)]).default(1),
  sidebarSections: z.array(z.string().max(50)).max(15).default([]),
  sidebarPosition: z.enum(["left", "right"]).default("right"),
  sectionHeadingVariant: sectionHeadingVariantSchema.default("underlined"),
  itemVariant: itemVariantSchema.default("stacked"),
  skillsVariant: skillsVariantSchema.default("tags"),
});
export type TemplateLayoutConfig = z.infer<typeof templateLayoutConfigSchema>;

export const templateMasterRowSchema = z.object({
  id: z.string().max(50),
  key: templateKeySchema,
  name: z.string().max(100),
  description: z.string().max(500),
  tier: templateTierSchema,
  design: templateDesignTokensSchema,
  layout: templateLayoutConfigSchema,
  sampleContent: resumeContentSchema.nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  version: z.number().int().min(1).default(1),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
export type TemplateMasterRow = z.infer<typeof templateMasterRowSchema>;
