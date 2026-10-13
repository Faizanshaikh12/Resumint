import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { ResumeCard } from "~/components/dashboard/ResumeCard";
import { DashboardEmptyState } from "~/components/dashboard/DashboardEmptyState";
import type { ResumeSummary } from "~/db/queries/resumes";
import type { FetcherWithComponents } from "react-router";
import type { ActionResult } from "~/lib/schemas/resume-actions";

function createMockFetcher() {
  return {
    submit: vi.fn(),
    state: "idle",
    data: undefined,
    formData: undefined,
    Form: () => null,
    load: vi.fn(),
    key: "mock-fetcher",
  } as unknown as FetcherWithComponents<ActionResult>;
}

const mockResume: ResumeSummary = {
  id: "resume-test-123",
  userId: "user-1",
  title: "Full Stack Engineer",
  templateId: "modern",
  version: 1,
  createdAt: new Date(Date.now() - 3600 * 1000 * 24),
  updatedAt: new Date(Date.now() - 3600 * 1000 * 2),
  hasShareLink: true,
};

describe("Dashboard Components (Phase 4)", () => {
  describe("ResumeCard", () => {
    it("renders resume title, template badge, share badge, and relative time", () => {
      const fetcher = createMockFetcher();

      render(
        <MemoryRouter>
          <ResumeCard resume={mockResume} fetcher={fetcher} atLimit={false} />
        </MemoryRouter>
      );

      expect(screen.getByText("Full Stack Engineer")).toBeInTheDocument();
      expect(screen.getByText("modern")).toBeInTheDocument();
      expect(screen.getByText("Shared")).toBeInTheDocument();
      expect(screen.getByText(/Updated 2 hours ago/i)).toBeInTheDocument();
    });

    it("opens action menu and triggers duplicate intent", () => {
      const fetcher = createMockFetcher();

      render(
        <MemoryRouter>
          <ResumeCard resume={mockResume} fetcher={fetcher} atLimit={false} />
        </MemoryRouter>
      );

      const triggerBtn = screen.getByRole("button", {
        name: /actions for full stack engineer/i,
      });
      fireEvent.click(triggerBtn);

      const duplicateOption = screen.getByText(/duplicate/i);
      expect(duplicateOption).toBeInTheDocument();

      fireEvent.click(duplicateOption);
      expect(fetcher.submit).toHaveBeenCalledWith(
        { intent: "duplicate", id: "resume-test-123" },
        { method: "post", action: "/dashboard" }
      );
    });

    it("opens rename dialog when rename option is clicked", () => {
      const fetcher = createMockFetcher();

      render(
        <MemoryRouter>
          <ResumeCard resume={mockResume} fetcher={fetcher} atLimit={false} />
        </MemoryRouter>
      );

      const triggerBtn = screen.getByRole("button", {
        name: /actions for full stack engineer/i,
      });
      fireEvent.click(triggerBtn);

      const renameOption = screen.getByText(/^rename$/i);
      fireEvent.click(renameOption);

      expect(screen.getByRole("heading", { name: /rename resume/i })).toBeInTheDocument();
      expect(screen.getByDisplayValue("Full Stack Engineer")).toBeInTheDocument();
    });

    it("opens delete confirmation dialog and executes delete intent", () => {
      const fetcher = createMockFetcher();

      render(
        <MemoryRouter>
          <ResumeCard resume={mockResume} fetcher={fetcher} atLimit={false} />
        </MemoryRouter>
      );

      const triggerBtn = screen.getByRole("button", {
        name: /actions for full stack engineer/i,
      });
      fireEvent.click(triggerBtn);

      const deleteOption = screen.getByText(/^delete$/i);
      fireEvent.click(deleteOption);

      // Verify resume name is mentioned in confirmation dialog
      expect(
        screen.getByRole("heading", { name: /delete “Full Stack Engineer”\?/i })
      ).toBeInTheDocument();

      const confirmDeleteBtn = screen.getByRole("button", { name: /^delete resume$/i });
      fireEvent.click(confirmDeleteBtn);

      expect(fetcher.submit).toHaveBeenCalledWith(
        { intent: "delete", id: "resume-test-123" },
        { method: "post", action: "/dashboard" }
      );
    });
  });

  describe("DashboardEmptyState", () => {
    it("renders empty state with CTA to create first resume when no search active", () => {
      render(
        <MemoryRouter>
          <DashboardEmptyState isSearchActive={false} atLimit={false} />
        </MemoryRouter>
      );

      expect(screen.getByText("No documents yet")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /create your first resume/i })).toBeInTheDocument();
    });

    it("renders no-search-results state when search query returns 0 matches", () => {
      const onClear = vi.fn();
      render(
        <MemoryRouter>
          <DashboardEmptyState
            isSearchActive={true}
            searchQuery="Nonexistent Keyword"
            onClearSearch={onClear}
            atLimit={false}
          />
        </MemoryRouter>
      );

      expect(screen.getByText("No documents found")).toBeInTheDocument();
      expect(screen.getByText(/Nonexistent Keyword/)).toBeInTheDocument();

      const clearBtn = screen.getByRole("button", { name: /clear search filter/i });
      fireEvent.click(clearBtn);
      expect(onClear).toHaveBeenCalledTimes(1);
    });

    it("disables create button when account is at limit", () => {
      render(
        <MemoryRouter>
          <DashboardEmptyState isSearchActive={false} atLimit={true} />
        </MemoryRouter>
      );

      const createBtn = screen.getByRole("button", { name: /create your first resume/i });
      expect(createBtn).toBeDisabled();
    });
  });
});
