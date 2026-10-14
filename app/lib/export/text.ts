import type { ResumeContent } from "~/lib/schemas/resume";
import { formatDateRange } from "~/lib/resume/dates";
import { getAllSectionIds } from "~/lib/resume/editor-state";

const SECTION_TITLES: Record<string, string> = {
  summary: "Professional Summary",
  experience: "Work Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
  awards: "Awards",
  publications: "Publications",
  volunteering: "Volunteering",
  languages: "Languages",
  interests: "Interests",
  references: "References",
};

export interface ExportTextOptions {
  sectionOrder?: string[];
  hiddenSections?: string[];
  crlf?: boolean;
}

/**
 * Generates a clean, deterministic, UTF-8 plain-text representation of a resume.
 * Formats visible sections with uppercase headings, bullets with "- ", and dates as ranges.
 * Omits empty and hidden sections.
 */
export function exportResumeText(
  content: ResumeContent,
  options: ExportTextOptions = {}
): string {
  const hiddenSet = new Set(options.hiddenSections || content.hiddenSections || []);
  const allIds = getAllSectionIds(content);
  const order = options.sectionOrder || content.sectionOrder || allIds;
  const eol = options.crlf ? "\r\n" : "\n";

  const lines: string[] = [];

  // 1. Personal Header
  const { personal } = content;
  if (personal.name) {
    lines.push(personal.name.trim());
  }
  if (personal.title) {
    lines.push(personal.title.trim());
  }

  // Contact line
  const contactParts: string[] = [];
  if (personal.email) contactParts.push(personal.email.trim());
  if (personal.phone) contactParts.push(personal.phone.trim());
  if (personal.location) contactParts.push(personal.location.trim());

  if (personal.links && personal.links.length > 0) {
    for (const link of personal.links) {
      if (link.url) {
        const label = link.label ? `${link.label}: ${link.url}` : link.url;
        contactParts.push(label);
      }
    }
  }

  if (contactParts.length > 0) {
    lines.push(contactParts.join(" | "));
  }

  // Helper for adding section heading
  const addHeading = (title: string) => {
    lines.push("");
    lines.push(title.toUpperCase());
    lines.push("-".repeat(title.length));
  };

  // 2. Iterate through sections in specified order
  for (const sectionId of order) {
    if (hiddenSet.has(sectionId)) continue;

    // Summary
    if (sectionId === "summary") {
      if (content.summary && content.summary.trim()) {
        addHeading(SECTION_TITLES["summary"] || "Summary");
        lines.push(content.summary.trim());
      }
      continue;
    }

    // Work Experience
    if (sectionId === "experience") {
      const items = content.experience || [];
      if (items.length > 0) {
        addHeading(SECTION_TITLES["experience"] || "Experience");
        for (const exp of items) {
          const titleLine = [exp.title, exp.company].filter(Boolean).join(" - ");
          const metaLine = [exp.location, formatDateRange(exp.date)].filter(Boolean).join(" | ");
          if (titleLine) lines.push(titleLine);
          if (metaLine) lines.push(metaLine);
          if (exp.description) lines.push(exp.description.trim());
          if (exp.bullets && exp.bullets.length > 0) {
            for (const b of exp.bullets) {
              if (b.trim()) lines.push(`- ${b.trim()}`);
            }
          }
          lines.push("");
        }
        if (lines[lines.length - 1] === "") lines.pop(); // Remove trailing blank
      }
      continue;
    }

    // Education
    if (sectionId === "education") {
      const items = content.education || [];
      if (items.length > 0) {
        addHeading(SECTION_TITLES["education"] || "Education");
        for (const edu of items) {
          const degLine = [edu.degree, edu.institution].filter(Boolean).join(" - ");
          const metaLine = [
            edu.location,
            formatDateRange(edu.date),
            edu.score ? `GPA/Score: ${edu.score}` : "",
          ]
            .filter(Boolean)
            .join(" | ");
          if (degLine) lines.push(degLine);
          if (metaLine) lines.push(metaLine);
          if (edu.description) lines.push(edu.description.trim());
          if (edu.bullets && edu.bullets.length > 0) {
            for (const b of edu.bullets) {
              if (b.trim()) lines.push(`- ${b.trim()}`);
            }
          }
          lines.push("");
        }
        if (lines[lines.length - 1] === "") lines.pop();
      }
      continue;
    }

    // Skills
    if (sectionId === "skills") {
      const items = content.skills || [];
      if (items.length > 0) {
        addHeading(SECTION_TITLES["skills"] || "Skills");
        for (const sk of items) {
          const name = sk.name ? `${sk.name}: ` : "";
          const list = (sk.keywords || []).filter(Boolean).join(", ");
          if (name || list) {
            lines.push(`${name}${list}`);
          }
        }
      }
      continue;
    }

    // Projects
    if (sectionId === "projects") {
      const items = content.projects || [];
      if (items.length > 0) {
        addHeading(SECTION_TITLES["projects"] || "Projects");
        for (const p of items) {
          const header = [p.name, p.role].filter(Boolean).join(" - ");
          const meta = [p.url, formatDateRange(p.date)].filter(Boolean).join(" | ");
          if (header) lines.push(header);
          if (meta) lines.push(meta);
          if (p.description) lines.push(p.description.trim());
          if (p.bullets && p.bullets.length > 0) {
            for (const b of p.bullets) {
              if (b.trim()) lines.push(`- ${b.trim()}`);
            }
          }
          lines.push("");
        }
        if (lines[lines.length - 1] === "") lines.pop();
      }
      continue;
    }

    // Certifications
    if (sectionId === "certifications") {
      const items = content.certifications || [];
      if (items.length > 0) {
        addHeading(SECTION_TITLES["certifications"] || "Certifications");
        for (const c of items) {
          const line = [c.name, c.issuer, formatDateRange(c.date)].filter(Boolean).join(" - ");
          if (line) lines.push(line);
        }
      }
      continue;
    }

    // Awards
    if (sectionId === "awards") {
      const items = content.awards || [];
      if (items.length > 0) {
        addHeading(SECTION_TITLES["awards"] || "Awards");
        for (const a of items) {
          const line = [a.title, a.issuer, formatDateRange(a.date)].filter(Boolean).join(" - ");
          if (line) lines.push(line);
          if (a.summary) lines.push(`  ${a.summary}`);
        }
      }
      continue;
    }

    // Publications
    if (sectionId === "publications") {
      const items = content.publications || [];
      if (items.length > 0) {
        addHeading(SECTION_TITLES["publications"] || "Publications");
        for (const pub of items) {
          const line = [pub.name, pub.publisher, formatDateRange(pub.date)]
            .filter(Boolean)
            .join(" - ");
          if (line) lines.push(line);
          if (pub.summary) lines.push(`  ${pub.summary}`);
        }
      }
      continue;
    }

    // Volunteering
    if (sectionId === "volunteering") {
      const items = content.volunteering || [];
      if (items.length > 0) {
        addHeading(SECTION_TITLES["volunteering"] || "Volunteering");
        for (const v of items) {
          const line = [v.position, v.organization, formatDateRange(v.date)]
            .filter(Boolean)
            .join(" - ");
          if (line) lines.push(line);
          if (v.summary) lines.push(v.summary.trim());
          if (v.bullets && v.bullets.length > 0) {
            for (const b of v.bullets) {
              if (b.trim()) lines.push(`- ${b.trim()}`);
            }
          }
          lines.push("");
        }
        if (lines[lines.length - 1] === "") lines.pop();
      }
      continue;
    }

    // Languages
    if (sectionId === "languages") {
      const items = content.languages || [];
      if (items.length > 0) {
        addHeading(SECTION_TITLES["languages"] || "Languages");
        const list = items
          .map((l) => [l.language, l.fluency ? `(${l.fluency})` : ""].filter(Boolean).join(" "))
          .join(", ");
        if (list) lines.push(list);
      }
      continue;
    }

    // Interests
    if (sectionId === "interests") {
      const items = content.interests || [];
      if (items.length > 0) {
        addHeading(SECTION_TITLES["interests"] || "Interests");
        const list = items.map((i) => i.name).filter(Boolean).join(", ");
        if (list) lines.push(list);
      }
      continue;
    }

    // References
    if (sectionId === "references") {
      const items = content.references || [];
      if (items.length > 0) {
        addHeading(SECTION_TITLES["references"] || "References");
        for (const ref of items) {
          const line = [ref.name, ref.reference].filter(Boolean).join(" - ");
          if (line) lines.push(line);
        }
      }
      continue;
    }

    // Custom Sections
    const customSec = (content.customSections || []).find((s) => s.id === sectionId);
    if (customSec && customSec.items.length > 0) {
      addHeading(customSec.title || "Custom Section");
      for (const it of customSec.items) {
        const header = [it.title, it.subtitle].filter(Boolean).join(" - ");
        const meta = [it.date, it.description].filter(Boolean).join(" | ");
        if (header) lines.push(header);
        if (meta) lines.push(meta);
        if (it.bullets && it.bullets.length > 0) {
          for (const b of it.bullets) {
            if (b.trim()) lines.push(`- ${b.trim()}`);
          }
        }
        lines.push("");
      }
      if (lines[lines.length - 1] === "") lines.pop();
    }
  }

  return lines.join(eol).trim() + eol;
}
