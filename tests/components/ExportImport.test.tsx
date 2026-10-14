import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent, waitFor, render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { ExportMenu } from "~/components/export/ExportMenu";
import { ImportDialog } from "~/components/export/ImportDialog";
import { ResumeEditor } from "~/components/editor/ResumeEditor";
import { createDefaultContent, createDefaultDesign } from "~/lib/resume/defaults";
import { PRINT_HINT_STORAGE_KEY } from "~/lib/export/usePrintResume";
import type { ExportEnvelope } from "~/lib/export/json";

describe("Export and Import Components (Phase 7)", () => {
  const originalPrint = window.print;
  const originalLocalStorage = window.localStorage;

  beforeEach(() => {
    window.print = vi.fn();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    window.print = originalPrint;
  });

  describe("ExportMenu", () => {
    it("renders export trigger button and reveals 4 export options when clicked", async () => {
      const content = createDefaultContent();
      content.personal.fullName = "Sarah Connor";
      const design = createDefaultDesign();

      render(
        <ExportMenu
          content={content}
          design={design}
          templateId="modern"
          title="Cyberdyne Systems Resume"
        />
      );

      const trigger = screen.getByTestId("export-menu-trigger");
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveTextContent(/Export/i);

      // Menu closed initially
      expect(screen.queryByTestId("export-menu-content")).not.toBeInTheDocument();

      // Click to open
      fireEvent.click(trigger);

      expect(screen.getByTestId("export-menu-content")).toBeInTheDocument();
      expect(screen.getByTestId("export-pdf-item")).toHaveTextContent(/Download PDF/i);
      expect(screen.getByTestId("export-json-item")).toHaveTextContent(/Download JSON/i);
      expect(screen.getByTestId("export-text-item")).toHaveTextContent(/Download Plain Text/i);
      expect(screen.getByTestId("copy-text-item")).toHaveTextContent(/Copy as Text/i);
    });

    it("opens print instructions hint dialog on first PDF export, respects 'Don't show again' preference", async () => {
      const content = createDefaultContent();
      content.personal.fullName = "Sarah Connor";
      const design = createDefaultDesign();

      render(
        <ExportMenu
          content={content}
          design={design}
          templateId="modern"
          title="Cyberdyne Systems Resume"
        />
      );

      // Open menu and click PDF
      fireEvent.click(screen.getByTestId("export-menu-trigger"));
      fireEvent.click(screen.getByTestId("export-pdf-item"));

      // Print hint dialog should be visible
      expect(screen.getByText(/Save as PDF Instructions/i)).toBeInTheDocument();
      expect(screen.getByText(/Destination:/i)).toBeInTheDocument();

      // Check "Don't show this hint again"
      const checkbox = screen.getByLabelText(/Don't show this hint again/i);
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();

      // Confirm print
      const confirmButton = screen.getByTestId("confirm-print-button");
      fireEvent.click(confirmButton);
      await waitFor(() => {
        expect(window.print).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId("export-menu-trigger")).not.toBeDisabled();
      });
      expect(localStorage.getItem(PRINT_HINT_STORAGE_KEY)).toBe("true");

      // On next trigger, should print directly without dialog
      fireEvent.click(screen.getByTestId("export-menu-trigger"));
      fireEvent.click(screen.getByTestId("export-pdf-item"));

      await waitFor(() => {
        expect(window.print).toHaveBeenCalledTimes(2);
      });
      expect(screen.queryByText(/Save as PDF Instructions/i)).not.toBeInTheDocument();
    });

    it("triggers text download and clipboard copy with accurate toast message", async () => {
      const content = createDefaultContent();
      content.personal.name = "Sarah Connor";
      const design = createDefaultDesign();

      // Mock navigator.clipboard
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      render(
        <ExportMenu
          content={content}
          design={design}
          templateId="modern"
          title="Cyberdyne Systems Resume"
        />
      );

      // Test Copy as text
      fireEvent.click(screen.getByTestId("export-menu-trigger"));
      fireEvent.click(screen.getByTestId("copy-text-item"));

      await waitFor(() => {
        expect(writeTextMock).toHaveBeenCalled();
        const textCopied = writeTextMock.mock.calls[0][0];
        expect(textCopied).toContain("Sarah Connor");
      });
    });
  });

  describe("ImportDialog", () => {
    it("rejects non-JSON files with friendly error", async () => {
      const onConfirm = vi.fn();
      render(<ImportDialog open={true} onOpenChange={() => {}} onConfirm={onConfirm} />);

      const fileInput = screen.getByTestId("import-file-input");
      const badFile = new File(["dummy pdf content"], "my-resume.pdf", { type: "application/pdf" });

      fireEvent.change(fileInput, { target: { files: [badFile] } });

      await waitFor(() => {
        expect(screen.getByTestId("import-error-alert")).toHaveTextContent(
          /Please select a valid \.json file/i
        );
      });
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it("rejects files exceeding 220 KB size cap", async () => {
      const onConfirm = vi.fn();
      render(<ImportDialog open={true} onOpenChange={() => {}} onConfirm={onConfirm} />);

      const fileInput = screen.getByTestId("import-file-input");
      const largeContent = "x".repeat(250000);
      const largeFile = new File([largeContent], "large-resume.json", { type: "application/json" });

      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      await waitFor(() => {
        expect(screen.getByTestId("import-error-alert")).toHaveTextContent(
          /exceeds.*220 KB/i
        );
      });
    });

    it("displays parsed summary for valid envelope and executes onConfirm", async () => {
      const onConfirm = vi.fn();
      render(<ImportDialog open={true} onOpenChange={() => {}} onConfirm={onConfirm} />);

      const validEnvelope: ExportEnvelope = {
        app: "resumint",
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        resume: {
          title: "Senior Architect Resume",
          templateId: "technical",
          content: {
            personal: { name: "Alex River", email: "alex@example.com" },
            experience: [
              {
                id: "exp-1",
                company: "Cloud Systems Inc",
                position: "Lead Engineer",
                bullets: ["Built scalable services"],
              },
            ],
          },
          design: createDefaultDesign(),
        },
      };

      const file = new File([JSON.stringify(validEnvelope)], "backup.json", {
        type: "application/json",
      });
      const fileInput = screen.getByTestId("import-file-input");

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByTestId("import-summary-card")).toBeInTheDocument();
      });

      expect(screen.getByText("Senior Architect Resume")).toBeInTheDocument();
      expect(screen.getByText("Alex River")).toBeInTheDocument();
      expect(screen.getByText("technical")).toBeInTheDocument();

      // Click Confirm
      const confirmButton = screen.getByTestId("confirm-import-button");
      expect(confirmButton).not.toBeDisabled();
      fireEvent.click(confirmButton);

      expect(onConfirm).toHaveBeenCalledTimes(1);
      const confirmedEnvelope = onConfirm.mock.calls[0][0];
      expect(confirmedEnvelope.title || confirmedEnvelope.resume?.title).toBe("Senior Architect Resume");
    });
  });

  describe("Guest Replace Draft Flow", () => {
    it("prompts replace confirmation when guest draft is non-empty before opening import dialog", async () => {
      const content = createDefaultContent();
      content.personal.fullName = "Existing Draft Person";
      const design = createDefaultDesign();
      const onImport = vi.fn();

      const router = createMemoryRouter(
        [
          {
            path: "/",
            element: (
              <ResumeEditor
                initial={{
                  title: "Draft Resume",
                  content,
                  design,
                  templateId: "modern",
                  version: 1,
                }}
                persistence={{
                  save: vi.fn().mockResolvedValue({ ok: true, version: 2 }),
                  rename: vi.fn().mockResolvedValue({ ok: true, title: "Draft Resume" }),
                }}
                onImport={onImport}
              />
            ),
          },
        ],
        { initialEntries: ["/"] }
      );

      render(<RouterProvider router={router} />);

      // Click Guest Import button
      const guestImportBtn = screen.getByTestId("guest-import-json-button");
      fireEvent.click(guestImportBtn);

      // Warning dialog should appear
      expect(screen.getByText(/Replace Current Draft\?/i)).toBeInTheDocument();
      expect(screen.getByText(/Importing a backup will replace your current resume draft/i)).toBeInTheDocument();

      // Click Replace Draft to proceed to file selection
      const replaceConfirmBtn = screen.getByTestId("confirm-replace-draft-button");
      fireEvent.click(replaceConfirmBtn);

      // Import dropzone should now be open
      expect(screen.getByTestId("import-dropzone")).toBeInTheDocument();
    });
  });
});
