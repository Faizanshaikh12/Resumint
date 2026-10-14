import { describe, it, expect } from "vitest";
import { contactRules } from "~/lib/ats/rules/contact";
import { structureRules } from "~/lib/ats/rules/structure";
import { summaryRules } from "~/lib/ats/rules/summary";
import { experienceRules } from "~/lib/ats/rules/experience";
import { datesRules } from "~/lib/ats/rules/dates";
import { lengthRules } from "~/lib/ats/rules/length";
import { languageRules } from "~/lib/ats/rules/language";
import { buildAtsContext } from "~/lib/ats/context";
import type { ResumeContent } from "~/lib/schemas/resume";

describe("ATS Individual Rule Units", () => {
  describe("Contact & Basics Rules", () => {
    it("flags missing full name, invalid email, and placeholder values", () => {
      const content: ResumeContent = {
        personal: {
          name: "",
          email: "not-an-email",
          phone: "123",
          location: "",
        },
      };
      const ctx = buildAtsContext(content);
      const checks = contactRules(ctx) as any[];

      const nameCheck = checks.find((c) => c.id === "contact-name");
      const emailCheck = checks.find((c) => c.id === "contact-email");
      const phoneCheck = checks.find((c) => c.id === "contact-phone");
      const locCheck = checks.find((c) => c.id === "contact-location");

      expect(nameCheck?.status).toBe("fail");
      expect(emailCheck?.status).toBe("warn");
      expect(phoneCheck?.status).toBe("warn");
      expect(locCheck?.status).toBe("warn");
    });

    it("passes with valid contact details and https links", () => {
      const content: ResumeContent = {
        personal: {
          name: "Jane Doe",
          email: "jane@doe.com",
          phone: "+1 555-432-1234",
          location: "New York, NY",
          links: [{ label: "Portfolio", url: "https://janedoe.com" }],
        },
      };
      const ctx = buildAtsContext(content);
      const checks = contactRules(ctx) as any[];

      expect(checks.every((c) => c.status === "pass")).toBe(true);
    });

    it("detects placeholder name 'Your Name'", () => {
      const content: ResumeContent = {
        personal: {
          name: "Your Name",
          email: "test@example.com",
          phone: "555-0199",
          location: "City, State",
        },
      };
      const ctx = buildAtsContext(content);
      const checks = contactRules(ctx) as any[];
      const phCheck = checks.find((c) => c.id === "contact-placeholders");
      expect(phCheck?.status).toBe("fail");
    });
  });

  describe("Structure Rules", () => {
    it("flags missing core sections when neither experience nor projects exist", () => {
      const content: ResumeContent = {
        personal: { name: "User" },
        education: [],
        skills: [],
      };
      const ctx = buildAtsContext(content);
      const checks = structureRules(ctx) as any[];
      const coreCheck = checks.find((c) => c.id === "structure-core-sections");
      expect(coreCheck?.status).toBe("fail");
    });

    it("warns about unusual custom headings like 'My Jobs' or 'Schooling'", () => {
      const content: ResumeContent = {
        personal: { name: "User" },
        sectionOrder: ["custom-1"],
        customSections: {
          "custom-1": {
            id: "custom-1",
            title: "My Jobs",
            items: [{ id: "item-1", title: "Role", subtitle: "Company" }],
          },
        },
      };
      const ctx = buildAtsContext(content);
      const checks = structureRules(ctx) as any[];
      const headingCheck = checks.find((c) => c.id === "structure-headings");
      expect(headingCheck?.status).toBe("warn");
      expect(headingCheck?.fix).toContain("Experience");
    });

    it("flags duplicate sections in layout", () => {
      const content: ResumeContent = {
        personal: { name: "User" },
        sectionOrder: ["experience", "education", "experience"],
      };
      const ctx = buildAtsContext(content);
      const checks = structureRules(ctx) as any[];
      const dupCheck = checks.find((c) => c.id === "structure-duplicates");
      expect(dupCheck?.status).toBe("fail");
    });
  });

  describe("Summary Rules", () => {
    it("warns when summary is missing", () => {
      const content: ResumeContent = { personal: { name: "User" } };
      const ctx = buildAtsContext(content);
      const checks = summaryRules(ctx) as any[];
      const presCheck = checks.find((c) => c.id === "summary-presence");
      expect(presCheck?.status).toBe("warn");
    });

    it("warns if summary starts with first-person 'I am...'", () => {
      const content: ResumeContent = {
        personal: { name: "User" },
        summary: { body: "I am a senior frontend engineer with 8 years of experience building modern web apps." },
        sectionOrder: ["summary"],
      };
      const ctx = buildAtsContext(content);
      const checks = summaryRules(ctx) as any[];
      const fpCheck = checks.find((c) => c.id === "summary-first-person");
      expect(fpCheck?.status).toBe("warn");
    });

    it("passes for professional summary written in implied first person", () => {
      const content: ResumeContent = {
        personal: { name: "User" },
        summary: {
          body: "Senior frontend engineer with 8 years of experience building modern web apps. Specialized in React and TypeScript with deep performance tuning expertise.",
        },
        sectionOrder: ["summary"],
      };
      const ctx = buildAtsContext(content);
      const checks = summaryRules(ctx) as any[];
      expect(checks.every((c) => c.status === "pass")).toBe(true);
    });
  });

  describe("Experience Bullets Rules", () => {
    it("warns on weak opening phrases like 'Responsible for' or 'Helped with'", () => {
      const content: ResumeContent = {
        personal: { name: "User" },
        experience: [
          {
            id: "exp-1",
            company: "Acme",
            position: "Engineer",
            bullets: [
              "Responsible for managing production servers.",
              "Helped with customer support inquiries.",
            ],
          },
        ],
        sectionOrder: ["experience"],
      };
      const ctx = buildAtsContext(content);
      const checks = experienceRules(ctx) as any[];
      const verbCheck = checks.find((c) => c.id === "experience-action-verbs");
      expect(verbCheck?.status).toBe("warn");
    });

    it("passes when bullets start with strong action verbs: Led, Developed, Managed", () => {
      const content: ResumeContent = {
        personal: { name: "User" },
        experience: [
          {
            id: "exp-1",
            company: "Acme",
            position: "Engineer",
            startDate: "2020-01",
            endDate: "2022-01",
            bullets: [
              "Led team of 5 engineers to deliver microservice architecture.",
              "Developed real-time analytics pipeline processing 10k events per second.",
              "Managed $50k annual cloud budget and trimmed infrastructure costs by 20%.",
            ],
          },
        ],
        sectionOrder: ["experience"],
      };
      const ctx = buildAtsContext(content);
      const checks = experienceRules(ctx) as any[];
      const verbCheck = checks.find((c) => c.id === "experience-action-verbs");
      const quantCheck = checks.find((c) => c.id === "experience-quantified");

      expect(verbCheck?.status).toBe("pass");
      expect(quantCheck?.status).toBe("pass");
    });

    it("flags unquantified bullets", () => {
      const content: ResumeContent = {
        personal: { name: "User" },
        experience: [
          {
            id: "exp-1",
            company: "Acme",
            position: "Engineer",
            bullets: [
              "Designed backend services and wrote database queries.",
              "Collaborated with product managers on user interface designs.",
            ],
          },
        ],
        sectionOrder: ["experience"],
      };
      const ctx = buildAtsContext(content);
      const checks = experienceRules(ctx) as any[];
      const quantCheck = checks.find((c) => c.id === "experience-quantified");
      expect(quantCheck?.status).toBe("fail");
    });

    it("warns if an action verb is repeated more than 2x in the same role", () => {
      const content: ResumeContent = {
        personal: { name: "User" },
        experience: [
          {
            id: "exp-1",
            company: "Acme",
            position: "Engineer",
            bullets: [
              "Developed web dashboard for client monitoring.",
              "Developed automated data pipelines in Python.",
              "Developed continuous deployment scripts in GitHub Actions.",
            ],
          },
        ],
        sectionOrder: ["experience"],
      };
      const ctx = buildAtsContext(content);
      const checks = experienceRules(ctx) as any[];
      const repCheck = checks.find((c) => c.id === "experience-repeated-verbs");
      expect(repCheck?.status).toBe("warn");
      expect(repCheck?.message).toContain("developed");
    });
  });

  describe("Dates Rules", () => {
    it("flags inverted date ranges where end date precedes start date", () => {
      const content: ResumeContent = {
        personal: { name: "User" },
        experience: [
          {
            id: "exp-1",
            company: "Acme",
            position: "Engineer",
            startDate: "2023-05",
            endDate: "2021-01", // Inverted!
          },
        ],
        sectionOrder: ["experience"],
      };
      const ctx = buildAtsContext(content);
      const checks = datesRules(ctx) as any[];
      const invCheck = checks.find((c) => c.id === "dates-start-before-end");
      expect(invCheck?.status).toBe("fail");
    });

    it("warns (and never fails) on unexplained gaps > 12 months", () => {
      const content: ResumeContent = {
        personal: { name: "User" },
        experience: [
          {
            id: "exp-1",
            company: "New Corp",
            startDate: "2024-01",
            endDate: "Present",
            current: true,
          },
          {
            id: "exp-2",
            company: "Old Corp",
            startDate: "2020-01",
            endDate: "2021-01", // 3-year gap between 2021-01 and 2024-01
          },
        ],
        sectionOrder: ["experience"],
      };
      const ctx = buildAtsContext(content, undefined, { now: new Date("2026-10-14") });
      const checks = datesRules(ctx) as any[];
      const gapCheck = checks.find((c) => c.id === "dates-gaps");
      expect(gapCheck?.status).toBe("warn"); // Never fail
      expect(gapCheck?.credit).toBeGreaterThan(0);
    });

    it("recognizes 'Present' and current role correctly", () => {
      const content: ResumeContent = {
        personal: { name: "User" },
        experience: [
          {
            id: "exp-1",
            company: "Acme",
            position: "Lead",
            startDate: "2022-01",
            endDate: "Present",
          },
        ],
        sectionOrder: ["experience"],
      };
      const ctx = buildAtsContext(content, undefined, { now: new Date("2026-10-14") });
      const checks = datesRules(ctx) as any[];
      const curCheck = checks.find((c) => c.id === "dates-current-role");
      expect(curCheck?.status).toBe("pass");
    });
  });

  describe("Length & Formatting Rules", () => {
    it("respects injected pageCount from Phase 6 page model", () => {
      const content: ResumeContent = {
        personal: { name: "User" },
        summary: { body: "Experienced engineer." },
        sectionOrder: ["summary"],
      };
      const ctx1 = buildAtsContext(content, undefined, { pageCount: 2 });
      const checks1 = lengthRules(ctx1) as any[];
      expect(checks1.find((c) => c.id === "length-page-count")?.status).toBe("pass");

      const ctx4 = buildAtsContext(content, undefined, { pageCount: 4 });
      const checks4 = lengthRules(ctx4) as any[];
      expect(checks4.find((c) => c.id === "length-page-count")?.status).toBe("fail");
    });

    it("warns on skills list that is too small or too large", () => {
      const fewSkills: ResumeContent = {
        personal: { name: "User" },
        skills: [{ id: "sk-1", category: "Skills", items: ["HTML", "CSS"] }],
        sectionOrder: ["skills"],
      };
      const ctxFew = buildAtsContext(fewSkills);
      const checksFew = lengthRules(ctxFew) as any[];
      expect(checksFew.find((c) => c.id === "length-skills-count")?.status).toBe("warn");

      const manySkills: ResumeContent = {
        personal: { name: "User" },
        skills: [
          {
            id: "sk-1",
            category: "Skills",
            items: Array.from({ length: 30 }).map((_, i) => `Skill ${i}`),
          },
        ],
        sectionOrder: ["skills"],
      };
      const ctxMany = buildAtsContext(manySkills);
      const checksMany = lengthRules(ctxMany) as any[];
      expect(checksMany.find((c) => c.id === "length-skills-count")?.status).toBe("warn");
    });
  });

  describe("Language & Style Rules", () => {
    it("flags repeated words ('the the') and double spaces", () => {
      const content: ResumeContent = {
        personal: { name: "User" },
        experience: [
          {
            id: "exp-1",
            company: "Company",
            bullets: [
              "Maintained the the server cluster in production.",
              "Configured  database replication with double spaces.",
            ],
          },
        ],
        sectionOrder: ["experience"],
      };
      const ctx = buildAtsContext(content);
      const checks = languageRules(ctx) as any[];
      const typoCheck = checks.find((c) => c.id === "language-formatting-cleanliness");
      expect(typoCheck?.status).toBe("warn");
    });

    it("checks punctuation consistency across bullet points", () => {
      const consistentContent: ResumeContent = {
        personal: { name: "User" },
        experience: [
          {
            id: "exp-1",
            company: "Company",
            bullets: ["Delivered feature A.", "Architected feature B.", "Tested feature C."],
          },
        ],
        sectionOrder: ["experience"],
      };
      const ctx1 = buildAtsContext(consistentContent);
      const checks1 = languageRules(ctx1) as any[];
      expect(checks1.find((c) => c.id === "language-punctuation-consistency")?.status).toBe("pass");

      const inconsistentContent: ResumeContent = {
        personal: { name: "User" },
        experience: [
          {
            id: "exp-1",
            company: "Company",
            bullets: ["Delivered feature A.", "Architected feature B", "Tested feature C."],
          },
        ],
        sectionOrder: ["experience"],
      };
      const ctx2 = buildAtsContext(inconsistentContent);
      const checks2 = languageRules(ctx2) as any[];
      expect(checks2.find((c) => c.id === "language-punctuation-consistency")?.status).toBe("warn");
    });
  });
});
