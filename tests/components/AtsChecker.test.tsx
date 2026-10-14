import * as React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AtsCheckerPanel } from "~/components/ats/AtsCheckerPanel";
import { ScoreBadge } from "~/components/ats/ScoreBadge";
import { analyze } from "~/lib/ats/analyze";
import { buildAtsContext } from "~/lib/ats/context";
import type { ResumeContent } from "~/lib/schemas/resume";

const SAMPLE_RESUME: ResumeContent = {
  personal: {
    name: "Alex Morgan",
    email: "alex@example.com",
    phone: "+1 555-123-4567",
    location: "San Francisco, CA",
    title: "Software Engineer",
  },
  summary: {
    body: "Software Engineer with 5 years experience building distributed web services with TypeScript and Go.",
  },
  experience: [
    {
      id: "exp-1",
      company: "Acme Cloud",
      position: "Engineer",
      startDate: "2022-01",
      endDate: "Present",
      current: true,
      bullets: [
        "Architected real-time messaging pipeline handling 10k messages per second.",
        "Reduced database query latency by 35% using Redis caching.",
      ],
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "State University",
      degree: "B.S. in CS",
      startDate: "2017-08",
      endDate: "2021-05",
    },
  ],
  skills: [
    {
      id: "sk-1",
      category: "Technologies",
      items: ["TypeScript", "Go", "Docker", "Kubernetes", "PostgreSQL", "Redis", "CI/CD"],
    },
  ],
  sectionOrder: ["summary", "experience", "education", "skills"],
};

describe("AtsCheckerPanel Component", () => {
  let context: ReturnType<typeof buildAtsContext>;
  let report: ReturnType<typeof analyze>;

  beforeEach(() => {
    sessionStorage.clear();
    context = buildAtsContext(SAMPLE_RESUME, undefined, {
      now: new Date("2026-10-14"),
      pageCount: 1,
    });
    report = analyze(SAMPLE_RESUME, undefined, {
      now: new Date("2026-10-14"),
      pageCount: 1,
    });
  });

  it("renders score header, number, label, and accessible live text alternative", () => {
    render(
      <AtsCheckerPanel
        report={report}
        context={context}
        resumeId="test-resume-1"
      />
    );

    expect(screen.getByTestId("ats-score-gauge-card")).toBeDefined();
    expect(screen.getByTestId("ats-score-number").textContent).toBe(String(report.score));
    expect(screen.getByTestId("ats-score-label-badge").textContent).toBe(report.label);

    const announcement = screen.getByTestId("ats-score-live-announcement");
    expect(announcement.textContent).toContain(String(report.score));
    expect(announcement.textContent).toContain(report.label);
    expect(screen.getByText(/Resumint checklist score \(a guide, not a guarantee\)/i)).toBeDefined();
  });

  it("filters checklist items using filter chips (All, Needs attention, Passed)", () => {
    render(
      <AtsCheckerPanel
        report={report}
        context={context}
        resumeId="test-resume-1"
      />
    );

    const chipAll = screen.getByTestId("filter-chip-all");
    const chipAttention = screen.getByTestId("filter-chip-attention");
    const chipPassed = screen.getByTestId("filter-chip-passed");

    expect(chipAll).toBeDefined();
    expect(chipAttention).toBeDefined();
    expect(chipPassed).toBeDefined();

    // Click Needs attention
    fireEvent.click(chipAttention);
    expect(chipAttention.getAttribute("aria-checked")).toBe("true");

    // Click Passed
    fireEvent.click(chipPassed);
    expect(chipPassed.getAttribute("aria-checked")).toBe("true");

    // Switch back to All
    fireEvent.click(chipAll);
    expect(chipAll.getAttribute("aria-checked")).toBe("true");
  });

  it("calls onNavigate when clicking an actionable check item", () => {
    const handleNavigate = vi.fn();
    render(
      <AtsCheckerPanel
        report={report}
        context={context}
        resumeId="test-resume-1"
        onNavigate={handleNavigate}
      />
    );

    // Find the first checklist item button with targets
    const checkItem = screen.getByTestId("ats-check-item-contact-name");
    fireEvent.click(checkItem);

    expect(handleNavigate).toHaveBeenCalled();
  });

  it("handles Job Description paste, character count, local analysis, and clear button with sessionStorage", async () => {
    render(
      <AtsCheckerPanel
        report={report}
        context={context}
        resumeId="test-resume-1"
      />
    );

    const textarea = screen.getByTestId("jd-input-textarea") as HTMLTextAreaElement;
    const analyzeBtn = screen.getByTestId("analyze-jd-button");

    expect(analyzeBtn).toBeDisabled();

    // Paste sample job description
    const sampleJd = "We are seeking a Go Engineer with Kubernetes and Docker experience.";
    fireEvent.change(textarea, { target: { value: sampleJd } });

    expect(textarea.value).toBe(sampleJd);
    expect(screen.getByText(`${sampleJd.length} / 10000 characters`)).toBeDefined();

    // Check sessionStorage
    expect(sessionStorage.getItem("resumint_jd_test-resume-1")).toBe(sampleJd);

    // Run Analyze
    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      expect(screen.getByTestId("jd-analysis-results")).toBeDefined();
      expect(screen.getByTestId("jd-coverage-percentage")).toBeDefined();
    });

    // Check matched chip
    expect(screen.getByTestId("matched-chip-Go")).toBeDefined();

    // Clear JD
    const clearBtn = screen.getByTestId("clear-jd-button");
    fireEvent.click(clearBtn);

    expect(textarea.value).toBe("");
    expect(sessionStorage.getItem("resumint_jd_test-resume-1")).toBeNull();
  });
});

describe("ScoreBadge Component", () => {
  it("renders badge and triggers onClick when clicked", () => {
    const handleClick = vi.fn();
    const context = buildAtsContext(SAMPLE_RESUME);
    const report = analyze(SAMPLE_RESUME);

    render(
      <ScoreBadge
        report={report}
        onClick={handleClick}
      />
    );

    const badge = screen.getByTestId("editor-header-score-badge");
    expect(badge.textContent).toContain(String(report.score));
    fireEvent.click(badge);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
