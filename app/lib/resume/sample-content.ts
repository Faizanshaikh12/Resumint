import type { ResumeContent } from "../schemas/resume";

export const SAMPLE_RESUME_CONTENT: ResumeContent = {
  personal: {
    name: "Alex Morgan",
    title: "Senior Full-Stack Engineer",
    email: "alex.morgan@example.com",
    phone: "+1 (555) 234-5678",
    location: "San Francisco, CA",
    links: [
      {
        id: "link-1",
        label: "GitHub",
        url: "https://github.com/alexmorgan",
      },
      {
        id: "link-2",
        label: "LinkedIn",
        url: "https://linkedin.com/in/alexmorgan",
      },
    ],
  },
  summary:
    "Passionate Software Engineer with 6+ years of experience building high-scale distributed systems and user-centric web applications. Expert in TypeScript, React, and serverless edge architectures.",
  experience: [
    {
      id: "exp-1",
      company: "Apex Cloud Technologies",
      position: "Senior Full-Stack Engineer",
      location: "San Francisco, CA",
      date: {
        start: "2022-03",
        end: "",
        current: true,
      },
      description: "Leading the core platform team building cloud infrastructure tooling.",
      bullets: [
        "Spearheaded edge migration reducing P99 latency by 42% across 10M daily requests.",
        "Architected real-time collaboration canvas supporting 50+ concurrent users with zero desync.",
        "Mentored 6 junior engineers and established automated Playwright accessibility testing in CI.",
      ],
    },
    {
      id: "exp-2",
      company: "Vanguard Labs",
      position: "Software Engineer",
      location: "New York, NY",
      date: {
        start: "2019-06",
        end: "2022-02",
        current: false,
      },
      description: "Built analytics dashboards and data ingestion pipelines.",
      bullets: [
        "Designed ETL data ingestion pipeline handling 500GB daily telemetry using Apache Kafka.",
        "Refactored legacy React SPA into modular components, slashing bundle size by 35%.",
      ],
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "University of California, Berkeley",
      degree: "Bachelor of Science",
      fieldOfStudy: "Computer Science",
      location: "Berkeley, CA",
      date: {
        start: "2015-08",
        end: "2019-05",
        current: false,
      },
      score: "3.85 GPA",
      bullets: ["Dean's Honors List 2017-2019", "President of Open Source Developers Club"],
    },
  ],
  skills: [
    { id: "sk-1", name: "TypeScript", level: "Expert", category: "Languages" },
    { id: "sk-2", name: "React / Next.js", level: "Expert", category: "Frontend" },
    { id: "sk-3", name: "Tailwind CSS", level: "Expert", category: "Frontend" },
    { id: "sk-4", name: "Node.js / Workers", level: "Advanced", category: "Backend" },
    { id: "sk-5", name: "SQLite / Drizzle", level: "Advanced", category: "Databases" },
    { id: "sk-6", name: "Vitest / Playwright", level: "Advanced", category: "DevOps & Testing" },
  ],
  languages: [
    { id: "lang-1", language: "English", proficiency: "Native / Bilingual" },
    { id: "lang-2", language: "Spanish", proficiency: "Professional Working" },
  ],
  projects: [
    {
      id: "proj-1",
      name: "Resumint",
      description: "Edge-native online resume builder with client-side PDF export and zero upfront friction.",
      url: "https://github.com/Faizanshaikh12/Resumint",
      bullets: [
        "Built on React Router v7 and Cloudflare D1 with strict TypeScript typing and optimistic concurrency.",
        "Achieved 100/100 Lighthouse performance and zero WCAG AA accessibility violations.",
      ],
    },
  ],
  certifications: [
    {
      id: "cert-1",
      name: "AWS Certified Solutions Architect",
      issuer: "Amazon Web Services",
      date: "2023",
      url: "https://aws.amazon.com/certification",
    },
  ],
  awards: [],
  publications: [],
  volunteering: [],
  interests: [
    { id: "int-1", name: "Open Source Software" },
    { id: "int-2", name: "Typography & Print Design" },
  ],
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

export function getSampleResumeContent(): ResumeContent {
  return JSON.parse(JSON.stringify(SAMPLE_RESUME_CONTENT));
}
