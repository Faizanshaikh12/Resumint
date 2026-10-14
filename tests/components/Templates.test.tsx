import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import { TEMPLATES, getAllTemplates } from "~/components/templates/registry";
import { ResumePreview } from "~/components/preview/ResumePreview";
import type { ResumeContent, ResumeDesign, TemplateId } from "~/lib/schemas/resume";
import { createDefaultDesign } from "~/lib/resume/defaults";

function createFullResumeContent(): ResumeContent {
  return {
    personal: {
      name: "Jane Doe",
      title: "Principal Software Architect",
      email: "jane.doe@example.com",
      phone: "+1 555-0199",
      location: "Seattle, WA",
      links: [
        { id: "l-1", label: "GitHub", url: "https://github.com/janedoe" },
        { id: "l-2", label: "Malicious Link", url: "javascript:alert(1)" },
      ],
    },
    summary: "Dedicated software architect with 12+ years experience building cloud systems.",
    experience: [
      {
        id: "exp-1",
        company: "Acme Corp",
        position: "Staff Engineer",
        location: "Remote",
        date: { start: "2021-01", current: true },
        description: "Leading core platform engineering.",
        bullets: ["Reduced p99 latency by 45%.", "Managed team of 8 engineers."],
      },
    ],
    education: [
      {
        id: "edu-1",
        institution: "University of Washington",
        degree: "B.S.",
        fieldOfStudy: "Computer Science",
        location: "Seattle, WA",
        date: { start: "2012", end: "2016", current: false },
        score: "3.9",
        bullets: ["Dean's List all quarters."],
      },
    ],
    skills: [
      { id: "sk-1", name: "TypeScript", level: "Expert", category: "Languages" },
      { id: "sk-2", name: "React", level: "Expert", category: "Frontend" },
      { id: "sk-3", name: "Rust", level: "Intermediate", category: "Languages" },
    ],
    projects: [
      {
        id: "proj-1",
        name: "CloudEngine",
        description: "Open-source distributed database orchestration tool.",
        url: "https://github.com/janedoe/cloudengine",
        date: { start: "2023", end: "2024" },
        bullets: ["Gained 2,000+ GitHub stars."],
      },
    ],
    certifications: [
      {
        id: "cert-1",
        name: "AWS Solutions Architect Professional",
        issuer: "Amazon Web Services",
        date: "2023-05",
        url: "https://aws.amazon.com",
      },
    ],
    awards: [
      {
        id: "aw-1",
        title: "Innovator of the Year",
        issuer: "Acme Global",
        date: "2022",
        summary: "Recognized for architecture patents.",
      },
    ],
    publications: [
      {
        id: "pub-1",
        title: "Distributed Consensus in Serverless Runtimes",
        publisher: "IEEE Software",
        date: "2022",
        url: "https://doi.org/10.1109/example",
        summary: "Peer-reviewed paper on high-throughput consensus.",
      },
    ],
    volunteering: [
      {
        id: "vol-1",
        organization: "Code.org",
        role: "Youth Coding Mentor",
        date: { start: "2019", current: true },
        summary: "Teaching high school students foundational algorithms.",
        bullets: ["Mentored 40+ students."],
      },
    ],
    languages: [
      { id: "lang-1", language: "English", proficiency: "Native" },
      { id: "lang-2", language: "German", proficiency: "Professional" },
    ],
    interests: [
      { id: "int-1", name: "Mountaineering" },
      { id: "int-2", name: "Amateur Radio" },
    ],
    references: [
      {
        id: "ref-1",
        name: "Sarah Jenkins",
        reference: "VP of Engineering at Acme Corp",
        contact: "sarah@example.com",
      },
    ],
    customSections: [
      {
        id: "custom-patents",
        title: "Patents",
        items: [
          {
            id: "pat-1",
            title: "Zero-latency cache invalidation",
            subtitle: "US Patent 9,999,999",
            date: "2021",
            description: "Method and apparatus for instant edge invalidation.",
            bullets: [],
          },
        ],
      },
    ],
    sectionOrder: [
      "summary",
      "experience",
      "education",
      "skills",
      "projects",
      "certifications",
      "awards",
      "publications",
      "volunteering",
      "languages",
      "interests",
      "references",
      "custom-patents",
    ],
    hiddenSections: [],
  };
}

function createEmptyResumeContent(): ResumeContent {
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
    projects: [],
    certifications: [],
    awards: [],
    publications: [],
    volunteering: [],
    languages: [],
    interests: [],
    references: [],
    customSections: [],
    sectionOrder: ["summary", "experience", "education", "skills"],
    hiddenSections: [],
  };
}

describe("Phase 2 Template System & ATS Compliance", () => {
  const templateIds: TemplateId[] = ["modern", "minimal", "executive", "classic", "technical"];
  const design: ResumeDesign = createDefaultDesign();
  const fullContent = createFullResumeContent();

  describe.each(templateIds)("Template: %s", (id) => {
    it("renders full content with strict semantic hierarchy (one h1, h2 per section)", () => {
      render(<ResumePreview content={fullContent} design={design} templateId={id} showGuides={false} />);

      // Exactly one h1 for candidate name
      const h1Elements = screen.getAllByRole("heading", { level: 1 });
      expect(h1Elements.length).toBe(1);
      expect(h1Elements[0].textContent).toBe("Jane Doe");

      // Key section headings exist as h2
      expect(screen.getByRole("heading", { level: 2, name: /work experience/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 2, name: /education/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 2, name: /skills/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 2, name: /patents/i })).toBeInTheDocument();

      // Bullets rendered as semantic list
      expect(screen.getByText("Reduced p99 latency by 45%.")).toBeInTheDocument();
      expect(screen.getByText("Dean's List all quarters.")).toBeInTheDocument();
    });

    it("does not render empty sections or hidden sections", () => {
      const contentWithHidden = {
        ...fullContent,
        hiddenSections: ["experience", "publications"],
      };

      const { rerender } = render(
        <ResumePreview content={contentWithHidden} design={design} templateId={id} showGuides={false} />
      );

      // Hidden sections must not appear
      expect(screen.queryByRole("heading", { level: 2, name: /work experience/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("heading", { level: 2, name: /publications/i })).not.toBeInTheDocument();

      // Empty content renders safely without empty headers
      const emptyContent = createEmptyResumeContent();
      rerender(<ResumePreview content={emptyContent} design={design} templateId={id} showGuides={false} />);

      expect(screen.queryByRole("heading", { level: 2, name: /work experience/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("heading", { level: 2, name: /education/i })).not.toBeInTheDocument();
    });

    it("sanitizes links and strips dangerous protocols", () => {
      render(<ResumePreview content={fullContent} design={design} templateId={id} showGuides={false} />);

      // Valid GitHub link exists
      const ghLink = screen.getByRole("link", { name: /^github$/i });
      expect(ghLink).toHaveAttribute("href", "https://github.com/janedoe");

      // Malicious link must not render an active javascript href
      const allLinks = screen.getAllByRole("link");
      for (const link of allLinks) {
        expect(link.getAttribute("href")).not.toContain("javascript:");
      }
    });

    it("ATS validation: text-only, no images, no text in SVG", () => {
      const { container } = render(
        <ResumePreview content={fullContent} design={design} templateId={id} showGuides={false} />
      );

      // No <img> tags
      expect(container.querySelectorAll("img").length).toBe(0);

      // Any SVGs are decorative icons only (aria-hidden)
      const svgs = container.querySelectorAll("svg");
      svgs.forEach((svg) => {
        expect(svg).toHaveAttribute("aria-hidden", "true");
        expect(svg.textContent?.trim()).toBe("");
      });
    });
  });

  describe("Content invariance across template switching", () => {
    it("maintains the exact same textual content when switching between all templates", () => {
      const extractedTexts: string[] = [];

      for (const id of templateIds) {
        const { unmount } = render(
          <ResumePreview content={fullContent} design={design} templateId={id} showGuides={false} />
        );
        const doc = screen.getByTestId("resume-preview-document");
        extractedTexts.push(doc.textContent?.replace(/\s+/g, " ").trim() || "");
        unmount();
      }

      // Check key text strings exist in every single template render
      for (const text of extractedTexts) {
        expect(text).toContain("Jane Doe");
        expect(text).toContain("Principal Software Architect");
        expect(text).toContain("Acme Corp");
        expect(text).toContain("Staff Engineer");
        expect(text).toContain("Reduced p99 latency by 45%.");
        expect(text).toContain("University of Washington");
        expect(text).toContain("Zero-latency cache invalidation");
      }
    });
  });

  describe("Template CSS rules inspection", () => {
    it("ensures no CSS content: property is used for real text content", () => {
      const cssPath = path.resolve(__dirname, "../../app/styles/resume-page.css");
      const css = fs.readFileSync(cssPath, "utf-8");

      // Check that content: isn't injecting strings of text
      const contentMatches = css.match(/content:\s*["'][^"']+["']/g);
      expect(contentMatches).toBeNull();
    });
  });
});
