import { nanoid } from "nanoid";
import type {
  AwardItem,
  CertificationItem,
  CustomSection,
  CustomSectionItem,
  EducationItem,
  ExperienceItem,
  InterestItem,
  LanguageItem,
  ProjectItem,
  PublicationItem,
  ReferenceItem,
  ResumeLink,
  SkillItem,
  VolunteeringItem,
} from "../schemas/resume";

export type StandardSectionId =
  | "personal"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "languages"
  | "projects"
  | "certifications"
  | "awards"
  | "publications"
  | "volunteering"
  | "interests"
  | "references";

export interface SectionMeta<TItem = unknown> {
  id: string;
  label: string;
  isCustomizable: boolean;
  multiItem: boolean;
  createDefaultItem?: () => TItem;
}

export const STANDARD_SECTION_IDS: readonly StandardSectionId[] = [
  "personal",
  "summary",
  "experience",
  "education",
  "skills",
  "languages",
  "projects",
  "certifications",
  "awards",
  "publications",
  "volunteering",
  "interests",
  "references",
] as const;

export function createDefaultLink(): ResumeLink {
  return {
    id: nanoid(),
    label: "",
    url: "",
  };
}

export function createDefaultExperienceItem(): ExperienceItem {
  return {
    id: nanoid(),
    company: "",
    position: "",
    location: "",
    date: { start: "", end: "", current: false },
    description: "",
    bullets: [],
  };
}

export function createDefaultEducationItem(): EducationItem {
  return {
    id: nanoid(),
    institution: "",
    degree: "",
    fieldOfStudy: "",
    location: "",
    date: { start: "", end: "", current: false },
    score: "",
    bullets: [],
  };
}

export function createDefaultSkillItem(name = "", level = "", category = ""): SkillItem {
  return {
    id: nanoid(),
    name,
    level,
    category,
  };
}

export function createDefaultLanguageItem(language = "", proficiency = "Native / Fluent"): LanguageItem {
  return {
    id: nanoid(),
    language,
    proficiency,
  };
}

export function createDefaultProjectItem(): ProjectItem {
  return {
    id: nanoid(),
    name: "",
    description: "",
    url: "",
    date: { start: "", end: "" },
    bullets: [],
  };
}

export function createDefaultCertificationItem(): CertificationItem {
  return {
    id: nanoid(),
    name: "",
    issuer: "",
    date: "",
    url: "",
  };
}

export function createDefaultAwardItem(): AwardItem {
  return {
    id: nanoid(),
    title: "",
    issuer: "",
    date: "",
    summary: "",
  };
}

export function createDefaultPublicationItem(): PublicationItem {
  return {
    id: nanoid(),
    title: "",
    publisher: "",
    date: "",
    url: "",
    summary: "",
  };
}

export function createDefaultVolunteeringItem(): VolunteeringItem {
  return {
    id: nanoid(),
    organization: "",
    role: "",
    date: { start: "", end: "", current: false },
    summary: "",
    bullets: [],
  };
}

export function createDefaultInterestItem(name = ""): InterestItem {
  return {
    id: nanoid(),
    name,
  };
}

export function createDefaultReferenceItem(): ReferenceItem {
  return {
    id: nanoid(),
    name: "",
    reference: "",
    contact: "",
  };
}

export function createDefaultCustomSectionItem(): CustomSectionItem {
  return {
    id: nanoid(),
    title: "",
    subtitle: "",
    date: "",
    description: "",
    bullets: [],
  };
}

export function createDefaultCustomSection(title = "Custom Section"): CustomSection {
  return {
    id: nanoid(),
    title,
    items: [],
  };
}

export const SECTION_REGISTRY: Record<StandardSectionId, SectionMeta> = {
  personal: {
    id: "personal",
    label: "Personal Information",
    isCustomizable: false,
    multiItem: false,
  },
  summary: {
    id: "summary",
    label: "Professional Summary",
    isCustomizable: false,
    multiItem: false,
  },
  experience: {
    id: "experience",
    label: "Work Experience",
    isCustomizable: false,
    multiItem: true,
    createDefaultItem: createDefaultExperienceItem,
  },
  education: {
    id: "education",
    label: "Education",
    isCustomizable: false,
    multiItem: true,
    createDefaultItem: createDefaultEducationItem,
  },
  skills: {
    id: "skills",
    label: "Skills",
    isCustomizable: false,
    multiItem: true,
    createDefaultItem: createDefaultSkillItem,
  },
  languages: {
    id: "languages",
    label: "Languages",
    isCustomizable: false,
    multiItem: true,
    createDefaultItem: createDefaultLanguageItem,
  },
  projects: {
    id: "projects",
    label: "Projects",
    isCustomizable: false,
    multiItem: true,
    createDefaultItem: createDefaultProjectItem,
  },
  certifications: {
    id: "certifications",
    label: "Certifications",
    isCustomizable: false,
    multiItem: true,
    createDefaultItem: createDefaultCertificationItem,
  },
  awards: {
    id: "awards",
    label: "Awards & Honors",
    isCustomizable: false,
    multiItem: true,
    createDefaultItem: createDefaultAwardItem,
  },
  publications: {
    id: "publications",
    label: "Publications",
    isCustomizable: false,
    multiItem: true,
    createDefaultItem: createDefaultPublicationItem,
  },
  volunteering: {
    id: "volunteering",
    label: "Volunteering",
    isCustomizable: false,
    multiItem: true,
    createDefaultItem: createDefaultVolunteeringItem,
  },
  interests: {
    id: "interests",
    label: "Interests",
    isCustomizable: false,
    multiItem: true,
    createDefaultItem: createDefaultInterestItem,
  },
  references: {
    id: "references",
    label: "References",
    isCustomizable: false,
    multiItem: true,
    createDefaultItem: createDefaultReferenceItem,
  },
};

/**
 * Returns metadata for any section (standard or custom).
 */
export function getSectionMeta(sectionId: string, customTitle?: string): SectionMeta {
  if (sectionId in SECTION_REGISTRY) {
    return SECTION_REGISTRY[sectionId as StandardSectionId];
  }

  return {
    id: sectionId,
    label: customTitle || "Custom Section",
    isCustomizable: true,
    multiItem: true,
    createDefaultItem: createDefaultCustomSectionItem,
  };
}
