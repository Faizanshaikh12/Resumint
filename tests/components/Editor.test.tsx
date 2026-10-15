import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor, render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { ResumeEditor } from "~/components/editor/ResumeEditor";
import { createDefaultContent, createDefaultDesign, createSampleContent } from "~/lib/resume/defaults";
import type { ResumePersistence } from "~/lib/resume/persistence";

function createMockPersistence(): ResumePersistence {
  return {
    save: vi.fn().mockResolvedValue({ ok: true, version: 2, updatedAt: new Date().toISOString() }),
    rename: vi.fn().mockResolvedValue({ ok: true, title: "Renamed Title" }),
  };
}

function renderEditorWithRouter(props: {
  initialContent?: any;
  initialDesign?: any;
  persistence?: ResumePersistence;
}) {
  const content = props.initialContent || createSampleContent();
  const design = props.initialDesign || createDefaultDesign();
  const persistence = props.persistence || createMockPersistence();

  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: (
          <ResumeEditor
            initial={{
              id: "res-1",
              title: "My Software Resume",
              content,
              design,
              templateId: "modern",
              version: 1,
            }}
            persistence={persistence}
          />
        ),
      },
    ],
    { initialEntries: ["/"] }
  );

  return {
    ...render(<RouterProvider router={router} />),
    persistence,
  };
}

describe("ResumeEditor Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders editor header, navigation, form pane, and live preview", () => {
    renderEditorWithRouter({});

    expect(screen.getByText("My Software Resume")).toBeInTheDocument();
    expect(screen.getByText("Personal Information")).toBeInTheDocument();
    expect(screen.getByTestId("resume-preview-document")).toBeInTheDocument();
    expect(screen.getAllByText("Alex Morgan").length).toBeGreaterThan(0);
  });

  it("updates personal info and immediately reflects in the live preview", async () => {
    renderEditorWithRouter({});

    const nameInput = screen.getByLabelText(/Full Name/i);
    fireEvent.change(nameInput, { target: { value: "Samantha Carter" } });

    // Preview updates live
    expect(screen.getByText("Samantha Carter")).toBeInTheDocument();

    // Dirty indicator appears
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
  });

  it("clicking manual save calls persistence.save and updates status", async () => {
    const persistence = createMockPersistence();
    renderEditorWithRouter({ persistence });

    const saveButton = screen.getByTestId("manual-save-button");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(persistence.save).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText("Saved")).toBeInTheDocument();
  });

  it("adds, edits, and removes items in experience section", async () => {
    renderEditorWithRouter({});

    // Switch to Work Experience section
    const expNavButtons = screen.getAllByRole("button", { name: /^Work Experience/i });
    fireEvent.click(expNavButtons[0]!);

    expect(
      screen.getByText(
        "Add your relevant work history, job responsibilities, and quantified achievements."
      )
    ).toBeInTheDocument();

    // Click Add Position
    const addPositionBtn = screen.getByRole("button", { name: /Add Position/i });
    fireEvent.click(addPositionBtn);

    // Enter title for the new position
    const positionInputs = screen.getAllByLabelText(/Job Title \/ Position/i);
    const lastInput = positionInputs[positionInputs.length - 1]!;
    fireEvent.change(lastInput, { target: { value: "Staff Platform Architect" } });

    expect(screen.getAllByText("Staff Platform Architect").length).toBeGreaterThan(0);
  });

  it("skills tags support adding via Enter/comma and removing via X button", async () => {
    renderEditorWithRouter({});

    // Switch to Skills
    const skillsNav = screen.getAllByRole("button", { name: /^Skills/i });
    fireEvent.click(skillsNav[0]!);

    const skillInput = screen.getByPlaceholderText(/Type a skill and press Enter/i);
    fireEvent.change(skillInput, { target: { value: "GraphQL" } });
    fireEvent.keyDown(skillInput, { key: "Enter", code: "Enter" });

    // GraphQL tag should be added
    expect(screen.getAllByText("GraphQL").length).toBeGreaterThan(0);

    // Remove the newly added skill
    const removeBtn = screen.getByLabelText(/Remove skill GraphQL/i);
    fireEvent.click(removeBtn);

    expect(screen.queryByText("GraphQL")).not.toBeInTheDocument();
  });

  it("toggling section hidden hides it from live preview", async () => {
    renderEditorWithRouter({});

    // Summary is visible initially in the preview
    expect(screen.getByRole("region", { name: /Professional Summary/i })).toBeInTheDocument();

    // Toggle Summary hidden
    const hideSummaryBtns = screen.getAllByTitle(/Visible \(click to hide\)/i);
    fireEvent.click(hideSummaryBtns[0]!);

    // Summary should now be hidden in the preview
    expect(screen.queryByRole("region", { name: /Professional Summary/i })).not.toBeInTheDocument();
  });

  it("custom section lifecycle: add section, rename, add item, and remove", async () => {
    window.confirm = vi.fn().mockReturnValue(true);
    renderEditorWithRouter({});

    // Add Custom Section
    const addCustomBtns = screen.getAllByRole("button", { name: /Add Custom Section/i });
    fireEvent.click(addCustomBtns[0]!);

    expect(screen.getAllByText("Custom Section").length).toBeGreaterThan(0);

    // Select the new custom section
    const customNavBtns = screen.getAllByRole("button", { name: /^Custom Section/i });
    fireEvent.click(customNavBtns[0]!);

    // Rename custom section
    const titleInput = screen.getByLabelText(/Section Title/i);
    fireEvent.change(titleInput, { target: { value: "Open Source Leadership" } });

    expect(screen.getAllByText("Open Source Leadership").length).toBeGreaterThan(0);

    // Add Entry
    const addEntryBtn = screen.getByRole("button", { name: /Add Entry/i });
    fireEvent.click(addEntryBtn);

    const entryTitle = screen.getByLabelText(/Entry Title \*/i);
    fireEvent.change(entryTitle, { target: { value: "Kubernetes SIG Contributor" } });

    // Live preview shows the custom section
    expect(screen.getAllByText("Kubernetes SIG Contributor").length).toBeGreaterThan(0);
  });

  it("handles blank resume: shows blank canvas, Start filling badge, and Load Sample button", () => {
    const blankContent = createDefaultContent();
    renderEditorWithRouter({ initialContent: blankContent });

    // Pristine blank canvas is rendered
    expect(screen.getByTestId("blank-resume-canvas")).toBeInTheDocument();

    // ATS badge shows welcoming "Start filling" state
    expect(screen.getByText("Start filling")).toBeInTheDocument();

    // Load Sample button is visible
    const loadSampleBtn = screen.getByTestId("load-sample-content-button");
    expect(loadSampleBtn).toBeInTheDocument();

    // Click Load Sample
    fireEvent.click(loadSampleBtn);

    // Canvas now shows populated resume
    expect(screen.queryByTestId("blank-resume-canvas")).not.toBeInTheDocument();
    expect(screen.getAllByText("Alex Morgan").length).toBeGreaterThan(0);

    // Load Sample button disappears
    expect(screen.queryByTestId("load-sample-content-button")).not.toBeInTheDocument();
  });
});
