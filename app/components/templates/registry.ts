import React from "react";
import type { ResumeContent, ResumeDesign, TemplateId } from "~/lib/schemas/resume";
import { ModernTemplate } from "./modern/ModernTemplate";
import { MinimalTemplate } from "./minimal/MinimalTemplate";
import { ExecutiveTemplate } from "./executive/ExecutiveTemplate";
import { ClassicTemplate } from "./classic/ClassicTemplate";
import { TechnicalTemplate } from "./technical/TechnicalTemplate";

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  description: string;
  atsNotes: string;
  supports: {
    columns: (1 | 2)[];
    headerAlign: ("left" | "center")[];
  };
  defaultDesign: Partial<ResumeDesign>;
  Component: React.ComponentType<{ content: ResumeContent; design: ResumeDesign }>;
}

export const TEMPLATES: Record<TemplateId, TemplateDefinition> = {
  modern: {
    id: "modern",
    name: "Modern",
    description: "Clean, contemporary layout with accent-colored section headings and subtle rules.",
    atsNotes: "100% ATS-friendly single-column layout with strict semantic heading hierarchy.",
    supports: {
      columns: [1],
      headerAlign: ["left", "center"],
    },
    defaultDesign: {
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
    },
    Component: ModernTemplate,
  },
  minimal: {
    id: "minimal",
    name: "Minimal",
    description: "Maximum whitespace, distraction-free typography with crisp thin dividers.",
    atsNotes: "High readability, high parser compatibility; zero decorative distractions.",
    supports: {
      columns: [1],
      headerAlign: ["left", "center"],
    },
    defaultDesign: {
      accentColor: "#171717",
      fontFamily: "inter",
      fontScale: 1.0,
      lineSpacing: 1.35,
      pageMargin: 18,
      sectionSpacing: 18,
      pageSize: "A4",
      columns: 1,
      headerAlign: "left",
      dateStyle: "MMM YYYY",
      showIcons: false,
    },
    Component: MinimalTemplate,
  },
  executive: {
    id: "executive",
    name: "Executive",
    description: "Formal serif typography, centered header, restrained accent dividers for leaders.",
    atsNotes: "Formal traditional structure parses reliably across legacy and enterprise ATS software.",
    supports: {
      columns: [1],
      headerAlign: ["left", "center"],
    },
    defaultDesign: {
      accentColor: "#1e3a8a",
      fontFamily: "source-serif-4",
      fontScale: 1.0,
      lineSpacing: 1.3,
      pageMargin: 18,
      sectionSpacing: 16,
      pageSize: "A4",
      columns: 1,
      headerAlign: "center",
      dateStyle: "MMM YYYY",
      showIcons: true,
    },
    Component: ExecutiveTemplate,
  },
  classic: {
    id: "classic",
    name: "Classic",
    description: "Traditional chronological layout with bold uppercase section rules and clear hierarchy.",
    atsNotes: "Proven chronological standard universally supported by all recruitment scanning algorithms.",
    supports: {
      columns: [1],
      headerAlign: ["left", "center"],
    },
    defaultDesign: {
      accentColor: "#111827",
      fontFamily: "merriweather",
      fontScale: 0.95,
      lineSpacing: 1.25,
      pageMargin: 16,
      sectionSpacing: 14,
      pageSize: "A4",
      columns: 1,
      headerAlign: "left",
      dateStyle: "MMM YYYY",
      showIcons: true,
    },
    Component: ClassicTemplate,
  },
  technical: {
    id: "technical",
    name: "Technical",
    description: "Skills-forward compact structure with optional 2-column sidebar for tech stacks.",
    atsNotes: "Linear DOM reading order maintained even in 2-column mode via accessible CSS grid.",
    supports: {
      columns: [1, 2],
      headerAlign: ["left", "center"],
    },
    defaultDesign: {
      accentColor: "#0284c7",
      fontFamily: "ibm-plex-sans",
      fontScale: 0.95,
      lineSpacing: 1.25,
      pageMargin: 14,
      sectionSpacing: 14,
      pageSize: "A4",
      columns: 2,
      headerAlign: "left",
      dateStyle: "MMM YYYY",
      showIcons: true,
    },
    Component: TechnicalTemplate,
  },
};

export const DEFAULT_TEMPLATE_ID: TemplateId = "modern";

/**
 * Resolves a template definition by ID with fallback to the default template ("modern").
 */
export function getTemplate(templateId?: string | null): TemplateDefinition {
  if (templateId && templateId in TEMPLATES) {
    return TEMPLATES[templateId as TemplateId];
  }
  return TEMPLATES[DEFAULT_TEMPLATE_ID];
}

/**
 * Returns all registered templates as an ordered array.
 */
export function getAllTemplates(): TemplateDefinition[] {
  return [
    TEMPLATES.modern,
    TEMPLATES.minimal,
    TEMPLATES.executive,
    TEMPLATES.classic,
    TEMPLATES.technical,
  ];
}
