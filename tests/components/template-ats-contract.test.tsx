import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GenericResumeRenderer, isBlankResume } from "~/components/templates/generic/GenericResumeRenderer";
import { TEMPLATE_SEED_DATA } from "~/db/seed/templates";
import type { ResumeContent, ResumeDesign } from "~/lib/schemas/resume";

function createMockContent(): ResumeContent {
  return {
    personal: {
      name: "Morgan Vance",
      title: "Lead Cloud Architect",
      email: "morgan.vance@example.com",
      phone: "+1 555-0199",
      location: "San Francisco, CA",
      links: [
        { id: "l-1", label: "GitHub", url: "https://github.com/morganvance" },
      ],
    },
    summary: "Senior architect with extensive background in distributed systems and edge runtimes.",
    experience: [
      {
        id: "exp-1",
        company: "Starlight Corp",
        position: "Principal Architect",
        location: "Remote",
        date: { start: "2020-01", current: true },
        description: "Leading cloud migration.",
        bullets: ["Reduced infrastructure costs by 35%.", "Maintained 99.99% uptime."],
      },
    ],
    education: [
      {
        id: "edu-1",
        institution: "Stanford University",
        degree: "B.S. in Computer Science",
        fieldOfStudy: "Computer Science",
        location: "Stanford, CA",
        date: { start: "2014", end: "2018", current: false },
        score: "3.9",
        bullets: ["Graduated with Distinction"],
      },
    ],
    skills: [
      { id: "s-1", name: "TypeScript", level: "Expert", category: "Languages" },
      { id: "s-2", name: "Cloudflare Workers", level: "Expert", category: "Cloud" },
    ],
    languages: [
      { id: "lang-1", language: "English", proficiency: "Native" },
    ],
    projects: [
      {
        id: "proj-1",
        name: "EdgeMesh",
        description: "Zero-latency edge routing library.",
        bullets: ["Over 500k monthly downloads."],
      },
    ],
    certifications: [
      {
        id: "cert-1",
        name: "AWS Certified Solutions Architect",
        issuer: "Amazon Web Services",
      },
    ],
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
      "projects",
      "skills",
      "languages",
      "certifications",
    ],
    hiddenSections: [],
  };
}

describe("GenericResumeRenderer & ATS Contract Across All 10 Templates", () => {
  const content = createMockContent();

  for (const template of TEMPLATE_SEED_DATA) {
    describe(`Template: ${template.name} (${template.key} - ${template.tier})`, () => {
      const design: ResumeDesign = {
        accentColor: template.design.accentColor,
        fontFamily: template.design.fontKey as any,
        fontScale: template.design.fontScale,
        lineSpacing: template.design.lineSpacing,
        pageMargin: template.design.pageMargin,
        sectionSpacing: template.design.sectionSpacing,
        pageSize: template.design.pageSize,
        columns: template.layout.columns,
        headerAlign: template.design.headerAlign,
        dateStyle: template.design.dateStyle,
        showIcons: template.design.showIcons,
        headerVariant: template.layout.headerVariant,
        sidebarSections: template.layout.sidebarSections,
        sidebarPosition: template.layout.sidebarPosition,
        sectionHeadingVariant: template.layout.sectionHeadingVariant,
        itemVariant: template.layout.itemVariant,
        skillsVariant: template.layout.skillsVariant,
      };

      it("satisfies ATS single H1 hierarchy", () => {
        const { container } = render(<GenericResumeRenderer content={content} design={design} />);
        const h1Elements = container.querySelectorAll("h1");
        expect(h1Elements.length).toBe(1);
        expect(h1Elements[0]?.textContent).toBe("Morgan Vance");
      });

      it("uses semantic H2 elements for section headings", () => {
        const { container } = render(<GenericResumeRenderer content={content} design={design} />);
        const h2Elements = container.querySelectorAll("h2");
        expect(h2Elements.length).toBeGreaterThanOrEqual(4);
      });

      it("does not use HTML tables for layout (pure CSS grid/flex)", () => {
        const { container } = render(<GenericResumeRenderer content={content} design={design} />);
        const tables = container.querySelectorAll("table");
        expect(tables.length).toBe(0);
      });

      it("renders experience before sidebar sections in semantic DOM order", () => {
        const { container } = render(<GenericResumeRenderer content={content} design={design} />);
        const expSection = container.querySelector('[aria-label="Work Experience"]');
        const skillsSection = container.querySelector('[aria-label="Skills"]');

        expect(expSection).not.toBeNull();
        expect(skillsSection).not.toBeNull();

        // In DOM tree, expSection should appear before skillsSection
        const position = expSection!.compareDocumentPosition(skillsSection!);
        expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      });

      it("contains valid mailto and tel anchor links", () => {
        const { container } = render(<GenericResumeRenderer content={content} design={design} />);
        const mailLink = container.querySelector('a[href="mailto:morgan.vance@example.com"]');
        const telLink = container.querySelector('a[href="tel:+1555-0199"]');
        expect(mailLink).not.toBeNull();
        expect(telLink).not.toBeNull();
      });
    });
  }

  describe("Blank Resume Behavior", () => {
    const emptyContent: ResumeContent = {
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
      sectionOrder: ["summary", "experience"],
      hiddenSections: [],
    };

    it("correctly identifies blank resume", () => {
      expect(isBlankResume(emptyContent)).toBe(true);
      expect(isBlankResume(content)).toBe(false);
    });

    it("renders clean white canvas without placeholder text or dummy names", () => {
      const defaultDesign: ResumeDesign = {
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

      const { container } = render(
        <GenericResumeRenderer content={emptyContent} design={defaultDesign} />
      );

      // Should not contain H1 or dummy names
      expect(container.querySelectorAll("h1").length).toBe(0);
      expect(container.textContent?.trim()).toBe("");
      expect(container.querySelector('[data-testid="blank-resume-canvas"]')).not.toBeNull();
    });
  });
});
