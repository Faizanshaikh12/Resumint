import { z } from "zod";

export const TEMPLATE_IDS = [
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

// Template ID enum
export const templateIdSchema = z.enum(TEMPLATE_IDS);
export type TemplateId = z.infer<typeof templateIdSchema>;

// Link Item
export const resumeLinkSchema = z.object({
  id: z.string().max(36),
  label: z.string().max(100),
  url: z.string().max(500),
});

// Personal Info
export const personalInfoSchema = z.object({
  name: z.string().max(100).default(""),
  title: z.string().max(150).default(""),
  email: z.string().max(150).default(""),
  phone: z.string().max(50).default(""),
  location: z.string().max(150).default(""),
  links: z.array(resumeLinkSchema).max(10).default([]),
});

// Date Range
export const dateRangeSchema = z.object({
  start: z.string().max(50).default(""),
  end: z.string().max(50).optional().default(""),
  current: z.boolean().default(false),
});

// Work Experience Item
export const experienceItemSchema = z.object({
  id: z.string().max(36),
  company: z.string().max(150).default(""),
  position: z.string().max(150).default(""),
  location: z.string().max(150).optional().default(""),
  date: dateRangeSchema.default({ start: "", end: "", current: false }),
  description: z.string().max(2000).optional().default(""),
  bullets: z.array(z.string().max(500)).max(20).default([]),
});

// Education Item
export const educationItemSchema = z.object({
  id: z.string().max(36),
  institution: z.string().max(150).default(""),
  degree: z.string().max(150).default(""),
  fieldOfStudy: z.string().max(150).optional().default(""),
  location: z.string().max(150).optional().default(""),
  date: dateRangeSchema.default({ start: "", end: "", current: false }),
  score: z.string().max(50).optional().default(""),
  bullets: z.array(z.string().max(500)).max(15).default([]),
});

// Skill Item
export const skillItemSchema = z.object({
  id: z.string().max(36),
  name: z.string().max(100),
  level: z.string().max(50).optional().default(""),
  category: z.string().max(100).optional().default(""),
});

// Language Item
export const languageItemSchema = z.object({
  id: z.string().max(36),
  language: z.string().max(100),
  proficiency: z.string().max(50).default("Native / Fluent"),
});

// Project Item
export const projectItemSchema = z.object({
  id: z.string().max(36),
  name: z.string().max(150),
  description: z.string().max(2000).optional().default(""),
  url: z.string().max(500).optional().default(""),
  date: z.object({ start: z.string().max(50).optional(), end: z.string().max(50).optional() }).optional(),
  bullets: z.array(z.string().max(500)).max(15).default([]),
});

// Certification Item
export const certificationItemSchema = z.object({
  id: z.string().max(36),
  name: z.string().max(150),
  issuer: z.string().max(150),
  date: z.string().max(50).optional().default(""),
  url: z.string().max(500).optional().default(""),
});

// Award Item
export const awardItemSchema = z.object({
  id: z.string().max(36),
  title: z.string().max(150),
  issuer: z.string().max(150),
  date: z.string().max(50).optional().default(""),
  summary: z.string().max(1000).optional().default(""),
});

// Publication Item
export const publicationItemSchema = z.object({
  id: z.string().max(36),
  title: z.string().max(200),
  publisher: z.string().max(150),
  date: z.string().max(50).optional().default(""),
  url: z.string().max(500).optional().default(""),
  summary: z.string().max(1000).optional().default(""),
});

// Volunteering Item
export const volunteeringItemSchema = z.object({
  id: z.string().max(36),
  organization: z.string().max(150),
  role: z.string().max(150),
  date: dateRangeSchema.optional(),
  summary: z.string().max(1000).optional().default(""),
  bullets: z.array(z.string().max(500)).max(15).default([]),
});

// Interest Item
export const interestItemSchema = z.object({
  id: z.string().max(36),
  name: z.string().max(100),
});

// Reference Item
export const referenceItemSchema = z.object({
  id: z.string().max(36),
  name: z.string().max(150),
  reference: z.string().max(500),
  contact: z.string().max(150).optional().default(""),
});

// Custom Section Item & Section
export const customSectionItemSchema = z.object({
  id: z.string().max(36),
  title: z.string().max(150),
  subtitle: z.string().max(150).optional().default(""),
  date: z.string().max(50).optional().default(""),
  description: z.string().max(2000).optional().default(""),
  bullets: z.array(z.string().max(500)).max(15).default([]),
});

export const customSectionSchema = z.object({
  id: z.string().max(36),
  title: z.string().max(100),
  items: z.array(customSectionItemSchema).max(20).default([]),
});

export type ResumeLink = z.infer<typeof resumeLinkSchema>;
export type PersonalInfo = z.infer<typeof personalInfoSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;
export type ExperienceItem = z.infer<typeof experienceItemSchema>;
export type EducationItem = z.infer<typeof educationItemSchema>;
export type SkillItem = z.infer<typeof skillItemSchema>;
export type LanguageItem = z.infer<typeof languageItemSchema>;
export type ProjectItem = z.infer<typeof projectItemSchema>;
export type CertificationItem = z.infer<typeof certificationItemSchema>;
export type AwardItem = z.infer<typeof awardItemSchema>;
export type PublicationItem = z.infer<typeof publicationItemSchema>;
export type VolunteeringItem = z.infer<typeof volunteeringItemSchema>;
export type InterestItem = z.infer<typeof interestItemSchema>;
export type ReferenceItem = z.infer<typeof referenceItemSchema>;
export type CustomSectionItem = z.infer<typeof customSectionItemSchema>;
export type CustomSection = z.infer<typeof customSectionSchema>;


// Complete Resume Content Schema with Caps
export const resumeContentSchema = z.object({
  personal: personalInfoSchema.default({
    name: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    links: [],
  }),
  summary: z.string().max(4000).default(""),
  experience: z.array(experienceItemSchema).max(30).default([]),
  education: z.array(educationItemSchema).max(20).default([]),
  skills: z.array(skillItemSchema).max(50).default([]),
  languages: z.array(languageItemSchema).max(20).default([]),
  projects: z.array(projectItemSchema).max(30).default([]),
  certifications: z.array(certificationItemSchema).max(25).default([]),
  awards: z.array(awardItemSchema).max(20).default([]),
  publications: z.array(publicationItemSchema).max(20).default([]),
  volunteering: z.array(volunteeringItemSchema).max(20).default([]),
  interests: z.array(interestItemSchema).max(30).default([]),
  references: z.array(referenceItemSchema).max(15).default([]),
  customSections: z.array(customSectionSchema).max(5).default([]),
  sectionOrder: z.array(z.string().max(50)).max(25).default([
    "summary",
    "experience",
    "education",
    "skills",
    "projects",
    "certifications",
  ]),
  hiddenSections: z.array(z.string().max(50)).max(25).default([]),
}).refine(
  (data) => {
    // Total serialized size cap of ~200 KB to protect D1 SQLite row sizes
    const serialized = JSON.stringify(data);
    return serialized.length <= 204800;
  },
  {
    message: "Resume content exceeds maximum allowed payload size of 200 KB",
  }
);

export type ResumeContent = z.infer<typeof resumeContentSchema>;

export const BUNDLED_FONT_FAMILIES = [
  "inter",
  "source-serif-4",
  "lato",
  "merriweather",
  "ibm-plex-sans",
  "roboto-mono",
  "plus-jakarta-sans",
] as const;
export type BundledFontFamily = (typeof BUNDLED_FONT_FAMILIES)[number];

// Resume Design Schema with backward compatibility
const rawResumeDesignSchema = z.object({
  accentColor: z
    .string()
    .max(30)
    .regex(/^#([0-9a-fA-F]{3}){1,2}$|^hsl\([^)]+\)$/, "Must be valid hex or hsl color")
    .default("#2563eb"),
  fontFamily: z
    .enum(BUNDLED_FONT_FAMILIES)
    .default("inter"),
  fontScale: z.number().min(0.85).max(1.25).default(1.0),
  lineSpacing: z.number().min(1.0).max(1.8).default(1.3),
  pageMargin: z.number().min(10).max(30).default(16),
  sectionSpacing: z.number().min(8).max(32).default(16),
  pageSize: z.enum(["A4", "Letter"]).default("A4"),
  columns: z.union([z.literal(1), z.literal(2)]).default(1),
  headerAlign: z.enum(["left", "center", "right"]).default("left"),
  dateStyle: z.enum(["MMM YYYY", "MM/YYYY", "YYYY"]).default("MMM YYYY"),
  showIcons: z.boolean().default(true),
  // Layout variants & token enhancements
  headerVariant: z.enum(["standard", "centered", "banner", "compact"]).optional().default("standard"),
  sidebarSections: z.array(z.string().max(50)).optional().default([]),
  sidebarPosition: z.enum(["left", "right"]).optional().default("right"),
  sectionHeadingVariant: z.enum(["underlined", "accent-pill", "small-caps", "left-rule", "minimal"]).optional().default("underlined"),
  itemVariant: z.enum(["compact-row", "stacked", "bulleted"]).optional().default("stacked"),
  skillsVariant: z.enum(["tags", "pills", "categorical-list", "inline-comma"]).optional().default("tags"),
  primaryTextColor: z.string().max(30).optional().default("#111827"),
  secondaryTextColor: z.string().max(30).optional().default("#4b5563"),
  backgroundColor: z.string().max(30).optional().default("#ffffff"),
  // Deprecated backward-compatible fields retained for smooth transitions
  fontSize: z.enum(["sm", "md", "lg"]).optional().default("md"),
  margins: z.enum(["compact", "normal", "spacious"]).optional().default("normal"),
});

export const resumeDesignSchema = z.preprocess((val) => {
  if (typeof val !== "object" || val === null) return {};
  const record = { ...(val as Record<string, unknown>) };

  if (record.fontKey && !record.fontFamily) {
    record.fontFamily = record.fontKey;
  }

  // Map legacy font families to bundled fonts
  if (typeof record.fontFamily === "string") {
    const legacyMap: Record<string, BundledFontFamily> = {
      roboto: "ibm-plex-sans",
      playfair: "source-serif-4",
      "source-sans": "inter",
      "fira-code": "roboto-mono",
    };
    if (record.fontFamily in legacyMap) {
      record.fontFamily = legacyMap[record.fontFamily];
    } else if (!BUNDLED_FONT_FAMILIES.includes(record.fontFamily as BundledFontFamily)) {
      record.fontFamily = "inter";
    }
  }

  // Map legacy columns ("single" | "double") to 1 | 2
  if (record.columns === "single") record.columns = 1;
  else if (record.columns === "double") record.columns = 2;

  // Map legacy fontSize ("sm" | "md" | "lg") to fontScale
  if (record.fontScale === undefined && typeof record.fontSize === "string") {
    if (record.fontSize === "sm") record.fontScale = 0.9;
    else if (record.fontSize === "lg") record.fontScale = 1.15;
    else record.fontScale = 1.0;
  }

  // Map legacy lineSpacing ("compact" | "normal" | "relaxed") to number
  if (typeof record.lineSpacing === "string") {
    if (record.lineSpacing === "compact") record.lineSpacing = 1.15;
    else if (record.lineSpacing === "relaxed") record.lineSpacing = 1.5;
    else record.lineSpacing = 1.3;
  }

  // Map legacy margins ("compact" | "normal" | "spacious") to pageMargin (mm)
  if (record.pageMargin === undefined && typeof record.margins === "string") {
    if (record.margins === "compact") record.pageMargin = 12;
    else if (record.margins === "spacious") record.pageMargin = 22;
    else record.pageMargin = 16;
  }

  // Map legacy sectionSpacing ("compact" | "normal" | "relaxed") to number (mm)
  if (typeof record.sectionSpacing === "string") {
    if (record.sectionSpacing === "compact") record.sectionSpacing = 12;
    else if (record.sectionSpacing === "relaxed") record.sectionSpacing = 22;
    else record.sectionSpacing = 16;
  }

  return record;
}, rawResumeDesignSchema);

export type ResumeDesign = z.infer<typeof rawResumeDesignSchema>;
