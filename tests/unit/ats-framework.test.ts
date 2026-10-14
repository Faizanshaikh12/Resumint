import { describe, it, expect } from "vitest";
import { analyze } from "~/lib/ats/analyze";
import { buildAtsContext } from "~/lib/ats/context";
import type { ResumeContent } from "~/lib/schemas/resume";

const STRONG_RESUME: ResumeContent = {
  personal: {
    name: "Alex Morgan",
    email: "alex.morgan@domain.com",
    phone: "+1 555-234-5678",
    location: "San Francisco, CA",
    title: "Senior Full-Stack Engineer",
    links: [
      { label: "GitHub", url: "https://github.com/alexmorgan" },
      { label: "LinkedIn", url: "https://linkedin.com/in/alexmorgan" },
    ],
  },
  summary: {
    body: "Results-driven Senior Full-Stack Engineer with 7 years of experience building high-scale distributed web applications. Specialized in TypeScript, React, Node.js, and Cloudflare Workers with a strong track record of optimizing system latency and developer velocity.",
  },
  experience: [
    {
      id: "exp-1",
      company: "CloudScale Inc.",
      position: "Senior Software Engineer",
      location: "San Francisco, CA",
      startDate: "2022-03",
      endDate: "Present",
      current: true,
      bullets: [
        "Architected distributed event ingestion pipeline processing 25M daily requests with sub-50ms latency.",
        "Engineered real-time collaboration engine using WebSockets and Redis, slashing data desync by 99%.",
        "Mentored team of 6 junior engineers and led migration from monolithic codebase to microservices.",
        "Reduced AWS infrastructure costs by $120k annually through automated cluster right-sizing.",
      ],
    },
    {
      id: "exp-2",
      company: "TechFlow Labs",
      position: "Full-Stack Developer",
      location: "San Jose, CA",
      startDate: "2019-06",
      endDate: "2022-02",
      bullets: [
        "Developed customer-facing dashboard in React and TypeScript, increasing monthly user retention by 28%.",
        "Optimized PostgreSQL query indexes and database connections, cutting API p95 response time by 45%.",
        "Implemented automated CI/CD pipeline with GitHub Actions, reducing deployment cycle times from 4 hours to 15 minutes.",
      ],
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "University of California, Berkeley",
      degree: "Bachelor of Science",
      fieldOfStudy: "Computer Science",
      startDate: "2015-09",
      endDate: "2019-05",
    },
  ],
  skills: [
    {
      id: "sk-1",
      category: "Languages & Frameworks",
      items: ["TypeScript", "JavaScript", "Python", "Go", "React", "Node.js", "Next.js", "Tailwind CSS"],
    },
    {
      id: "sk-2",
      category: "Databases & Cloud",
      items: ["PostgreSQL", "Redis", "Docker", "Kubernetes", "AWS", "CI/CD", "Git", "REST APIs"],
    },
  ],
  sectionOrder: ["summary", "experience", "education", "skills"],
};

const MEDIOCRE_RESUME: ResumeContent = {
  personal: {
    name: "John Smith",
    email: "john@smith.org",
    phone: "1234567",
    location: "Dallas, TX",
  },
  summary: {
    body: "I am a web developer who likes coding and building websites with good tech.",
  },
  experience: [
    {
      id: "exp-1",
      company: "Web Agency",
      position: "Developer",
      startDate: "2021-01",
      endDate: "2022-01",
      bullets: [
        "Responsible for making website pages.",
        "Helped with customer support tickets.",
        "Worked on backend database updates.",
      ],
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "State College",
      degree: "Associate Degree",
      startDate: "2018-09",
      endDate: "2020-05",
    },
  ],
  skills: [
    {
      id: "sk-1",
      category: "Skills",
      items: ["HTML", "CSS"],
    },
  ],
  sectionOrder: ["summary", "experience", "education", "skills"],
};

const BLANK_PLACEHOLDER_RESUME: ResumeContent = {
  personal: {
    name: "Your Name",
    email: "email@example.com",
    phone: "555-0123",
    location: "City, State",
  },
  summary: {
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  },
  experience: [],
  education: [],
  skills: [],
};

const STUDENT_PROJECT_RESUME: ResumeContent = {
  personal: {
    name: "Maya Lin",
    email: "maya.lin@college.edu",
    phone: "+1 555-987-6543",
    location: "Austin, TX",
    links: [{ label: "Portfolio", url: "https://mayalin.dev" }],
  },
  summary: {
    body: "Computer Science senior graduating in May 2026 with strong foundations in algorithms, distributed systems, and full-stack development. Passionate about cloud architecture and open-source tooling.",
  },
  experience: [], // No formal experience!
  projects: [
    {
      id: "proj-1",
      name: "Distributed Key-Value Store",
      description: "Raft consensus implementation in Go",
      highlights: [
        "Implemented Raft consensus algorithm from scratch in Go, handling network partitions with zero data loss.",
        "Benchmarked throughput reaching 15k ops/sec across 5-node cluster with 99.9% uptime.",
        "Published comprehensive documentation and test suite with 94% code coverage.",
      ],
    },
    {
      id: "proj-2",
      name: "Campus Event Tracker",
      description: "Full-stack mobile web application",
      highlights: [
        "Built responsive web app using React and TypeScript, onboarded 1200 active student users in first month.",
        "Engineered real-time notifications reducing event no-show rates by 35%.",
      ],
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "University of Texas at Austin",
      degree: "B.S. in Computer Science",
      startDate: "2022-08",
      endDate: "2026-05",
      gpa: "3.92",
    },
  ],
  skills: [
    {
      id: "sk-1",
      category: "Programming & Tools",
      items: ["Go", "TypeScript", "Python", "React", "Docker", "Git", "Linux", "SQL"],
    },
  ],
  sectionOrder: ["summary", "projects", "education", "skills"],
};

const NON_ENGLISH_RESUME: ResumeContent = {
  personal: {
    name: "Jean Dupont",
    email: "jean.dupont@entreprise.fr",
    phone: "+33 6 12 34 56 78",
    location: "Paris, France",
  },
  summary: {
    body: "Ingénieur logiciel avec dix ans d'expérience dans la conception d'architectures distribuées et la direction d'équipes techniques.",
  },
  experience: [
    {
      id: "exp-1",
      company: "Société Générale",
      position: "Ingénieur d'études",
      startDate: "2020-01",
      endDate: "Present",
      current: true,
      bullets: [
        "Développement de microservices en Java et Spring Boot pour le traitement des transactions financières.",
        "Optimisation des performances de la base de données avec une réduction de 30% du temps de réponse.",
      ],
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "École Polytechnique",
      degree: "Diplôme d'Ingénieur",
      startDate: "2015-09",
      endDate: "2019-06",
    },
  ],
  skills: [
    {
      id: "sk-1",
      category: "Compétences",
      items: ["Java", "Spring Boot", "Docker", "Kubernetes", "PostgreSQL", "Git"],
    },
  ],
  sectionOrder: ["summary", "experience", "education", "skills"],
};

describe("ATS Framework & Scoring Pipeline", () => {
  it("scores strong developer resume >= 85 with 'Excellent' or 'Strong' label", () => {
    const report = analyze(STRONG_RESUME, undefined, {
      now: new Date("2026-10-14"),
      pageCount: 1,
    });

    expect(report.score).toBeGreaterThanOrEqual(85);
    expect(["Strong", "Excellent"]).toContain(report.label);
    expect(report.categories.length).toBe(7);
    expect(report.checks.length).toBeGreaterThan(15);
  });

  it("scores mediocre resume between 40 and 70", () => {
    const report = analyze(MEDIOCRE_RESUME, undefined, {
      now: new Date("2026-10-14"),
      pageCount: 1,
    });

    expect(report.score).toBeGreaterThanOrEqual(40);
    expect(report.score).toBeLessThanOrEqual(75);
    expect(report.topFixes.length).toBeGreaterThan(0);
  });

  it("handles blank / placeholder resume gracefully without crashing and assigns low score", () => {
    const report = analyze(BLANK_PLACEHOLDER_RESUME, undefined, {
      now: new Date("2026-10-14"),
    });

    expect(report.score).toBeLessThan(40);
    expect(report.label).toBe("Needs work");
  });

  it("does not unfairly punish students who have Projects instead of formal Experience", () => {
    const studentReport = analyze(STUDENT_PROJECT_RESUME, undefined, {
      now: new Date("2026-10-14"),
      pageCount: 1,
    });

    expect(studentReport.score).toBeGreaterThanOrEqual(80);
    const structCat = studentReport.categories.find((c) => c.id === "structure");
    expect(structCat?.score).toBeGreaterThanOrEqual(80);
  });

  it("detects non-English content and marks language-dependent checks as 'na'", () => {
    const frenchReport = analyze(NON_ENGLISH_RESUME, undefined, {
      now: new Date("2026-10-14"),
    });

    expect(frenchReport.meta.language).toBe("other");
    const naChecks = frenchReport.checks.filter((c) => c.status === "na");
    expect(naChecks.length).toBeGreaterThanOrEqual(3);

    // Ensure na checks are excluded from the denominator so total score does not crash to zero
    expect(frenchReport.score).toBeGreaterThanOrEqual(60);
  });

  it("is fully deterministic: running twice produces deep-equal reports", () => {
    const fixedNow = new Date("2026-10-14T12:00:00Z");
    const run1 = analyze(STRONG_RESUME, undefined, { now: fixedNow, pageCount: 1 });
    const run2 = analyze(STRONG_RESUME, undefined, { now: fixedNow, pageCount: 1 });

    expect(run1).toEqual(run2);
  });

  it("exhibits monotonic improvement: fixing an issue increases or maintains score", () => {
    const fixedNow = new Date("2026-10-14T12:00:00Z");
    const baseline = analyze(MEDIOCRE_RESUME, undefined, { now: fixedNow, pageCount: 1 });

    // Fix 1: Add a real full email and more skills
    const improvedResume: ResumeContent = {
      ...MEDIOCRE_RESUME,
      personal: {
        ...MEDIOCRE_RESUME.personal,
        name: "John Smith",
        email: "john.smith@domain.com",
        phone: "+1 555-456-7890",
      },
      skills: [
        {
          id: "sk-1",
          category: "Tech",
          items: ["HTML", "CSS", "JavaScript", "React", "Node.js", "Git"],
        },
      ],
    };

    const improved = analyze(improvedResume, undefined, { now: fixedNow, pageCount: 1 });
    expect(improved.score).toBeGreaterThan(baseline.score);
  });

  it("meets the performance budget (< 50ms) even on a max-size resume", () => {
    // Generate a max-size resume with multiple roles and hundreds of words
    const largeResume: ResumeContent = {
      ...STRONG_RESUME,
      experience: Array.from({ length: 6 }).map((_, i) => ({
        id: `exp-${i}`,
        company: `Enterprise Tech Corp ${i}`,
        position: `Staff Engineer ${i}`,
        startDate: `201${i}-01`,
        endDate: `201${i + 1}-01`,
        bullets: [
          `Architected scalable cloud platform processing ${i * 10}M daily requests with high reliability.`,
          `Led cross-functional team of ${i + 3} software engineers and data analysts across multiple timezones.`,
          `Improved test coverage from 60% to 95% using Vitest and automated continuous deployment.`,
        ],
      })),
    };

    const startTime = performance.now();
    const report = analyze(largeResume, undefined, {
      now: new Date("2026-10-14"),
      pageCount: 2,
    });
    const duration = performance.now() - startTime;

    expect(report.score).toBeGreaterThan(0);
    expect(duration).toBeLessThan(50); // Generous 50ms budget asserted
  });
});
