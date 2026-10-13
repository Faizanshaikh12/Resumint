import { z } from "zod";

// Template ID enum
export const templateIdSchema = z.enum([
  "modern",
  "minimal",
  "executive",
  "classic",
  "technical",
]);
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

// Resume Design Schema
export const resumeDesignSchema = z.object({
  accentColor: z
    .string()
    .max(30)
    .regex(/^#([0-9a-fA-F]{3}){1,2}$|^hsl\([^)]+\)$/, "Must be valid hex or hsl color")
    .default("#2563eb"),
  fontFamily: z
    .enum(["inter", "roboto", "playfair", "merriweather", "source-sans", "fira-code"])
    .default("inter"),
  fontSize: z.enum(["sm", "md", "lg"]).default("md"),
  lineSpacing: z.enum(["compact", "normal", "relaxed"]).default("normal"),
  margins: z.enum(["compact", "normal", "spacious"]).default("normal"),
  pageSize: z.enum(["A4", "Letter"]).default("A4"),
  sectionSpacing: z.enum(["compact", "normal", "relaxed"]).default("normal"),
  columns: z.enum(["single", "double"]).default("single"),
});

export type ResumeDesign = z.infer<typeof resumeDesignSchema>;
