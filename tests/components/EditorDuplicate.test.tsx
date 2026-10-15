import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor, render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { ResumeEditor } from "~/components/editor/ResumeEditor";
import { createSampleContent, createDefaultDesign } from "~/lib/resume/defaults";
import type { ResumePersistence } from "~/lib/resume/persistence";

const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function createMockPersistence(): ResumePersistence {
  return {
    save: vi.fn().mockResolvedValue({ ok: true, version: 2, updatedAt: new Date().toISOString() }),
    rename: vi.fn().mockResolvedValue({ ok: true, title: "Renamed Title" }),
  };
}

describe("Editor Duplicate Workflows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renders duplicate menu for authenticated resume with both duplication actions", async () => {
    const router = createMemoryRouter(
      [
        {
          path: "/",
          element: (
            <ResumeEditor
              initial={{
                id: "res-original-123",
                title: "Production CV",
                content: createSampleContent(),
                design: createDefaultDesign(),
                templateId: "modern",
                version: 1,
              }}
              persistence={createMockPersistence()}
            />
          ),
        },
      ],
      { initialEntries: ["/"] }
    );

    render(<RouterProvider router={router} />);

    // Duplicate button is present
    const duplicateMenuBtn = screen.getByTestId("editor-duplicate-menu-button");
    expect(duplicateMenuBtn).toBeInTheDocument();

    // Open dropdown menu
    fireEvent.click(duplicateMenuBtn);

    expect(screen.getByTestId("editor-duplicate-resume-option")).toBeInTheDocument();
    expect(screen.getByTestId("editor-duplicate-and-change-template-option")).toBeInTheDocument();
  });

  it("clicking Duplicate Resume creates copy and navigates to editor for new id", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          ok: true,
          resume: { id: "res-copy-999", title: "Production CV (Copy)" },
        }),
      json: async () => ({
        ok: true,
        resume: { id: "res-copy-999", title: "Production CV (Copy)" },
      }),
    });

    const router = createMemoryRouter(
      [
        {
          path: "/",
          element: (
            <ResumeEditor
              initial={{
                id: "res-original-123",
                title: "Production CV",
                content: createSampleContent(),
                design: createDefaultDesign(),
                templateId: "modern",
                version: 1,
              }}
              persistence={createMockPersistence()}
            />
          ),
        },
      ],
      { initialEntries: ["/"] }
    );

    render(<RouterProvider router={router} />);

    // Open menu
    fireEvent.click(screen.getByTestId("editor-duplicate-menu-button"));

    // Click Duplicate Resume
    fireEvent.click(screen.getByTestId("editor-duplicate-resume-option"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/resumes/res-original-123/edit.data",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ intent: "duplicate" }),
        })
      );
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/resumes/res-copy-999/edit");
    });
  });

  it("clicking Duplicate & Try Template creates copy and navigates with ?openGallery=true", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          ok: true,
          resume: { id: "res-copy-999", title: "Production CV (Copy)" },
        }),
    });

    const router = createMemoryRouter(
      [
        {
          path: "/",
          element: (
            <ResumeEditor
              initial={{
                id: "res-original-123",
                title: "Production CV",
                content: createSampleContent(),
                design: createDefaultDesign(),
                templateId: "modern",
                version: 1,
              }}
              persistence={createMockPersistence()}
            />
          ),
        },
      ],
      { initialEntries: ["/"] }
    );

    render(<RouterProvider router={router} />);

    // Open menu
    fireEvent.click(screen.getByTestId("editor-duplicate-menu-button"));

    // Click Duplicate & Try Template
    fireEvent.click(screen.getByTestId("editor-duplicate-and-change-template-option"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/resumes/res-original-123/edit.data",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ intent: "duplicate" }),
        })
      );
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/resumes/res-copy-999/edit?openGallery=true");
    });
  });
});
