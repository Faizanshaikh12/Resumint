import { describe, it, expect } from "vitest";
import { tokenize, MAX_JD_LENGTH } from "~/lib/ats/keywords/tokenize";
import { extractKeywords, lightStem } from "~/lib/ats/keywords/extract";
import { matchJobDescription, checkTermMatch } from "~/lib/ats/keywords/match";
import { buildAtsContext } from "~/lib/ats/context";
import type { ResumeContent } from "~/lib/schemas/resume";

const BACKEND_JD = `
Senior Backend Engineer
Company: CloudPulse Systems

Requirements:
- 5+ years of experience with Go (Golang) and Python 3.
- Hands-on experience with Kubernetes (k8s), Docker, and CI/CD pipelines.
- Deep expertise in PostgreSQL and Redis database optimization.
- Strong knowledge of Microservices and REST APIs.
- Experience with C++ is a plus.

Responsibilities:
- Architect high-throughput distributed systems.
- Collaborate with frontend engineers to build scalable APIs.
`;

const FRONTEND_JD = `
Staff Frontend Developer
Requirements:
- Expert in TypeScript, React, and Next.js.
- Strong proficiency in Tailwind CSS and WebSockets.
- Experience with automated testing using Vitest and Playwright.
- Excellent UI/UX Design and Figma prototyping skills.
`;

const DATA_ANALYST_JD = `
Lead Data Analyst
Qualifications:
- 4+ years of data analysis using SQL and Power BI.
- Hands-on experience with advanced Excel and Tableau.
- Proven experience running A/B Testing and tracking business KPIs.
- Familiarity with Python for data modeling.
`;

const NURSE_JD = `
Registered Nurse (RN) - Acute Care
Requirements:
- Active RN license with BLS / CPR certification.
- Demonstrated experience in Patient Care and Clinical Assessment.
- Skilled in Medication Administration and tracking Vital Signs.
- Familiarity with Electronic Health Records (EHR) and HIPAA compliance.
`;

const BOILERPLATE_ONLY_JD = `
Equal Opportunity Employer.
We offer comprehensive health benefits, 401(k) matching, and generous paid time off.
All qualified applicants will receive consideration without regard to race, color, religion, sex, sexual orientation.
`;

describe("ATS Keyword Engine", () => {
  describe("Tokenize", () => {
    it("preserves technical tokens with symbols: C++, C#, .NET, Node.js, Next.js, CI/CD, Wi-Fi", () => {
      const text = "We need skills in C++, C#, .NET Core, Node.js, Next.js, CI/CD, and Wi-Fi.";
      const tokens = tokenize(text);

      expect(tokens).toContain("c++");
      expect(tokens).toContain("c#");
      expect(tokens).toContain(".net");
      expect(tokens).toContain("node.js");
      expect(tokens).toContain("next.js");
      expect(tokens).toContain("ci/cd");
      expect(tokens).toContain("wi-fi");
    });

    it("strips URLs and emails", () => {
      const text = "Contact recruiter@acme.com or visit https://acme.careers.com/jobs for details.";
      const tokens = tokenize(text);

      expect(tokens).not.toContain("recruiter@acme.com");
      expect(tokens).not.toContain("https");
      expect(tokens).not.toContain("acme.careers.com");
    });

    it("caps input length at MAX_JD_LENGTH (10,000 chars)", () => {
      const hugeText = "python ".repeat(3000);
      expect(hugeText.length).toBeGreaterThan(MAX_JD_LENGTH);

      const tokens = tokenize(hugeText);
      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens.length).toBeLessThan(2500);
    });
  });

  describe("Extract Keywords", () => {
    it("extracts and ranks core skills with requirement boost from Backend JD", () => {
      const keywords = extractKeywords(BACKEND_JD);
      const canonicals = keywords.map((k) => k.canonical);

      expect(canonicals).toContain("Go");
      expect(canonicals).toContain("Kubernetes");
      expect(canonicals).toContain("PostgreSQL");
      expect(canonicals).toContain("Docker");
      expect(canonicals).toContain("CI/CD");
      expect(canonicals).toContain("Redis");
      expect(canonicals).toContain("Microservices");
      expect(canonicals).toContain("C++");
    });

    it("extracts frontend skills with aliases from Frontend JD", () => {
      const keywords = extractKeywords(FRONTEND_JD);
      const canonicals = keywords.map((k) => k.canonical);

      expect(canonicals).toContain("React");
      expect(canonicals).toContain("Next.js");
      expect(canonicals).toContain("TypeScript");
      expect(canonicals).toContain("Tailwind CSS");
      expect(canonicals).toContain("Playwright");
      expect(canonicals).toContain("Vitest");
    });

    it("extracts non-tech clinical skills from Healthcare/Nurse JD", () => {
      const keywords = extractKeywords(NURSE_JD);
      const canonicals = keywords.map((k) => k.canonical);

      expect(canonicals).toContain("Patient Care");
      expect(canonicals).toContain("Vital Signs");
      expect(canonicals).toContain("Medication Administration");
      expect(canonicals).toContain("HIPAA");
    });

    it("penalizes boilerplate and yields empty or minimal keywords for boilerplate-only JD", () => {
      const keywords = extractKeywords(BOILERPLATE_ONLY_JD);
      expect(keywords.length).toBeLessThanOrEqual(1);
    });

    it("lightStem handles plurals and suffixes cleanly without ruining technical acronyms", () => {
      expect(lightStem("technologies")).toBe("technology");
      expect(lightStem("databases")).toBe("database");
      expect(lightStem("pipelines")).toBe("pipeline");
      expect(lightStem("deploying")).toBe("deploy");
      // Protected acronyms
      expect(lightStem("aws")).toBe("aws");
      expect(lightStem("css")).toBe("css");
      expect(lightStem("redis")).toBe("redis");
    });
  });

  describe("Word Boundary & Match Safety", () => {
    it("enforces word boundary safety: Java must not match JavaScript", () => {
      const text = "Senior engineer skilled in JavaScript and TypeScript.";
      const javaMatch = checkTermMatch("Java", [], text);
      const jsMatch = checkTermMatch("JavaScript", ["js"], text);

      expect(javaMatch.isMatched).toBe(false);
      expect(jsMatch.isMatched).toBe(true);
    });

    it("enforces word boundary safety: Go must not match going or Google", () => {
      const text = "We are going to visit the Google campus.";
      const goMatch = checkTermMatch("Go", ["golang"], text);
      expect(goMatch.isMatched).toBe(false);

      const textWithGo = "Proficient in Go and Python.";
      const goMatchValid = checkTermMatch("Go", ["golang"], textWithGo);
      expect(goMatchValid.isMatched).toBe(true);
    });

    it("matches alias terms: 'k8s' matches 'Kubernetes'", () => {
      const text = "Deployed microservices to k8s clusters in AWS.";
      const k8sMatch = checkTermMatch("Kubernetes", ["k8s"], text);
      expect(k8sMatch.isMatched).toBe(true);
    });

    it("matches multi-word phrases like 'machine learning'", () => {
      const text = "Applied machine learning algorithms for recommendation.";
      const mlMatch = checkTermMatch("Machine Learning", ["ml"], text);
      expect(mlMatch.isMatched).toBe(true);
    });
  });

  describe("Job Description Matcher Integration", () => {
    const resumeContent: ResumeContent = {
      personal: { name: "Dev" },
      summary: {
        body: "Backend engineer with expertise in Go, Kubernetes, PostgreSQL, and Docker.",
      },
      experience: [
        {
          id: "exp-1",
          company: "Acme",
          position: "Software Engineer",
          bullets: [
            "Built REST APIs in Go and managed CI/CD pipelines in GitHub Actions.",
            "Optimized Redis cache layer reducing p99 latency by 30%.",
          ],
        },
      ],
      skills: [
        {
          id: "sk-1",
          category: "Tech",
          items: ["Go", "Kubernetes", "PostgreSQL", "Docker", "Redis", "CI/CD", "REST APIs"],
        },
      ],
      sectionOrder: ["summary", "experience", "skills"],
    };

    it("computes weighted match percentage against Backend JD with matched and missing chips", () => {
      const ctx = buildAtsContext(resumeContent);
      const result = matchJobDescription(BACKEND_JD, ctx);

      expect(result.matchPercent).toBeGreaterThanOrEqual(65);
      const matchedNames = result.matched.map((m) => m.canonical);
      expect(matchedNames).toContain("Go");
      expect(matchedNames).toContain("Kubernetes");
      expect(matchedNames).toContain("PostgreSQL");
      expect(matchedNames).toContain("Docker");
      expect(matchedNames).toContain("CI/CD");

      // C++ was in JD but not in resume -> should be in missing
      const missingNames = result.missing.map((m) => m.canonical);
      expect(missingNames).toContain("C++");

      // Verify each missing keyword includes honest disclaimer
      expect(result.missing[0]?.warningNote).toBe("Add only if true for you");
      expect(result.missing[0]?.placementHint).toBeDefined();
    });

    it("triggers stuffing guard if a keyword appears with unnatural density", () => {
      const stuffedResume: ResumeContent = {
        personal: { name: "Dev" },
        summary: {
          body: "Python Python Python Python Python Python Python Python Python developer.",
        },
        sectionOrder: ["summary"],
      };
      const ctx = buildAtsContext(stuffedResume);
      const result = matchJobDescription("Looking for a Python developer with Python skills.", ctx);

      expect(result.stuffingWarning).toBeDefined();
      expect(result.stuffingWarning).toContain("Python");
    });

    it("handles empty or whitespace JD gracefully with 0% coverage and no crash", () => {
      const ctx = buildAtsContext(resumeContent);
      const result = matchJobDescription("   ", ctx);
      expect(result.matchPercent).toBe(0);
      expect(result.matched).toEqual([]);
      expect(result.missing).toEqual([]);
    });
  });
});
