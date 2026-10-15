import { nanoid } from "nanoid";
import type { ResumeContent, ResumeDesign } from "../schemas/resume";

export function createDefaultDesign(): ResumeDesign {
  return {
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
    fontSize: "md",
    margins: "normal",
  };
}

import { getSampleResumeContent } from "./sample-content";

export function createDefaultContent(): ResumeContent {
  return {
    personal: {
      name: "",
      title: "",
      email: "",
      phone: "",
      location: "",
      links: [],
    },
    summary: "",
    experience: [],
    education: [],
    skills: [],
    languages: [],
    projects: [],
    certifications: [],
    awards: [],
    publications: [],
    volunteering: [],
    interests: [],
    references: [],
    customSections: [],
    sectionOrder: [
      "summary",
      "experience",
      "education",
      "skills",
      "projects",
      "certifications",
      "languages",
      "interests",
    ],
    hiddenSections: [],
  };
}

export function createSampleContent(): ResumeContent {
  return getSampleResumeContent();
}
