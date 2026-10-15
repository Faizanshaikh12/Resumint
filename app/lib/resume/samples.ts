import { nanoid } from "nanoid";
import {
  resumeContentSchema,
  resumeDesignSchema,
  type ResumeContent,
  type ResumeDesign,
  type TemplateId,
} from "../schemas/resume";
import { createDefaultContent, createDefaultDesign, createSampleContent } from "./defaults";
import type { SampleId } from "../schemas/resume-actions";

export interface SampleResume {
  id: SampleId;
  name: string;
  title: string;
  description: string;
  templateId: TemplateId;
  content: ResumeContent;
  design: ResumeDesign;
}

export function createDeveloperSample(): SampleResume {
  const content = createSampleContent();
  const design = createDefaultDesign();
  design.accentColor = "#2563eb"; // Blue
  design.templateId = "technical";

  return {
    id: "developer",
    name: "Software Engineer",
    title: "Software Engineer (Full-Stack)",
    description: "Tailored for software engineers, backend developers, and systems architects with detailed technical stacks.",
    templateId: "technical",
    content: resumeContentSchema.parse(content),
    design: resumeDesignSchema.parse(design),
  };
}

export function createStudentSample(): SampleResume {
  const base = createSampleContent();
  const design = createDefaultDesign();
  design.accentColor = "#059669"; // Emerald green
  design.templateId = "minimal";

  const content: ResumeContent = {
    ...base,
    personal: {
      ...base.personal,
      name: "Jordan Lee",
      title: "Computer Science Graduate",
      email: "jordan.lee@university.edu",
      phone: "+1 (555) 789-0123",
      location: "Boston, MA",
    },
    summary:
      "Recent Computer Science graduate with strong foundations in algorithms, data structures, and web development. Passionate about building accessible, performant software with modern frameworks.",
    experience: [
      {
        id: nanoid(),
        company: "Tech Start Innovations",
        position: "Software Engineering Intern",
        location: "Boston, MA",
        date: { start: "2023-06", end: "2023-08", current: false },
        description: "Contributed to frontend feature development and automated testing.",
        bullets: [
          "Developed reusable UI components in React and TypeScript reducing code duplication by 25%.",
          "Wrote unit and integration test suites using Vitest, achieving 90% component test coverage.",
          "Collaborated in daily agile standups and code reviews with senior engineering mentors.",
        ],
      },
    ],
    education: [
      {
        id: nanoid(),
        institution: "Northeastern University",
        degree: "Bachelor of Science",
        fieldOfStudy: "Computer Science",
        location: "Boston, MA",
        date: { start: "2020-09", end: "2024-05", current: false },
        score: "3.92 GPA",
        bullets: [
          "Summa Cum Laude Honors graduate.",
          "Teaching Assistant for CS 2500 (Fundamentals of Computer Science).",
        ],
      },
    ],
    sectionOrder: [
      "summary",
      "education",
      "experience",
      "skills",
      "projects",
      "languages",
      "interests",
    ],
  };

  return {
    id: "student",
    name: "New Graduate / Student",
    title: "Student & Entry-Level",
    description: "Education-first layout with internship experience, academic achievements, and foundational skills.",
    templateId: "minimal",
    content: resumeContentSchema.parse(content),
    design: resumeDesignSchema.parse(design),
  };
}

export function createDesignerSample(): SampleResume {
  const base = createSampleContent();
  const design = createDefaultDesign();
  design.accentColor = "#7c3aed"; // Violet
  design.templateId = "modern";

  const content: ResumeContent = {
    ...base,
    personal: {
      ...base.personal,
      name: "Taylor Bennett",
      title: "Lead Product Designer",
      email: "taylor.design@example.com",
      phone: "+1 (555) 345-6789",
      location: "New York, NY",
    },
    summary:
      "Human-centered Product Designer with 7+ years of experience crafting design systems, user journeys, and high-conversion SaaS web applications. Proven track record turning complex technical workflows into intuitive interfaces.",
    experience: [
      {
        id: nanoid(),
        company: "Starlight Digital Studio",
        position: "Lead Product Designer",
        location: "New York, NY",
        date: { start: "2021-04", end: "", current: true },
        description: "Leading the global product design system and UX research.",
        bullets: [
          "Spearheaded design system overhaul in Figma and Tailwind CSS, speeding designer-to-developer handoff by 40%.",
          "Conducted usability testing with 100+ participants, elevating user task completion rates from 68% to 94%.",
          "Designed end-to-end checkout flow resulting in a $1.2M annual revenue increase.",
        ],
      },
    ],
    skills: [
      { id: nanoid(), name: "Figma & Design Systems", level: "Expert", category: "Design Tools" },
      { id: nanoid(), name: "UX Research & Usability Testing", level: "Expert", category: "Methodology" },
      { id: nanoid(), name: "Prototyping & Wireframing", level: "Expert", category: "Design" },
      { id: nanoid(), name: "HTML & Tailwind CSS", level: "Advanced", category: "Frontend" },
      { id: nanoid(), name: "WCAG Accessibility (a11y)", level: "Expert", category: "Standards" },
    ],
  };

  return {
    id: "designer",
    name: "Product Designer",
    title: "Product Designer (UI/UX)",
    description: "Sleek presentation emphasizing design systems, UX research, user metrics, and portfolio highlights.",
    templateId: "modern",
    content: resumeContentSchema.parse(content),
    design: resumeDesignSchema.parse(design),
  };
}

const samplesMap: Record<SampleId, () => SampleResume> = {
  developer: createDeveloperSample,
  student: createStudentSample,
  designer: createDesignerSample,
};

export function listSamples(): SampleResume[] {
  return [
    createDeveloperSample(),
    createStudentSample(),
    createDesignerSample(),
  ];
}

export function getSample(id: string): SampleResume | null {
  const factory = samplesMap[id as SampleId];
  return factory ? factory() : null;
}
