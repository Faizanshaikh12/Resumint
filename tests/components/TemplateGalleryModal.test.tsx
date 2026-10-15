import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TemplateGalleryModal } from "~/components/editor/TemplateGalleryModal";
import { createDefaultDesign } from "~/lib/resume/defaults";

describe("TemplateGalleryModal Component", () => {
  const currentDesign = createDefaultDesign();

  it("renders all 10 templates and tier tabs by default", () => {
    render(
      <TemplateGalleryModal
        open={true}
        onOpenChange={vi.fn()}
        currentTemplateId="modern"
        currentDesign={currentDesign}
        onApplyTemplate={vi.fn()}
      />
    );

    expect(screen.getByText("Resume Templates")).toBeInTheDocument();

    // Check tier tabs
    expect(screen.getByRole("tab", { name: /All \(10\)/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Basic \(3\)/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Standard \(4\)/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Premium \(3\)/i })).toBeInTheDocument();

    // Verify all 10 template names exist
    const templateNames = [
      "Plain",
      "Classic",
      "Compact",
      "Minimal",
      "Modern",
      "Technical",
      "Executive",
      "Elegant",
      "Bold",
      "Creative",
    ];
    for (const name of templateNames) {
      expect(screen.getByRole("heading", { name: new RegExp(`^${name}$`, "i") })).toBeInTheDocument();
    }
  });

  it("filters templates by tier when clicking tier tabs", () => {
    render(
      <TemplateGalleryModal
        open={true}
        onOpenChange={vi.fn()}
        currentTemplateId="modern"
        currentDesign={currentDesign}
        onApplyTemplate={vi.fn()}
      />
    );

    // Filter to Basic
    fireEvent.click(screen.getByRole("tab", { name: /Basic \(3\)/i }));
    expect(screen.getByRole("heading", { name: /^Plain$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Classic$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Compact$/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /^Modern$/i })).not.toBeInTheDocument();

    // Filter to Premium
    fireEvent.click(screen.getByRole("tab", { name: /Premium \(3\)/i }));
    expect(screen.getByRole("heading", { name: /^Elegant$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Bold$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Creative$/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /^Plain$/i })).not.toBeInTheDocument();
  });

  it("marks current template as Currently Active", () => {
    render(
      <TemplateGalleryModal
        open={true}
        onOpenChange={vi.fn()}
        currentTemplateId="executive"
        currentDesign={currentDesign}
        onApplyTemplate={vi.fn()}
      />
    );

    const execCard = screen.getByTestId("template-card-executive");
    expect(execCard).toBeInTheDocument();
    expect(execCard).toHaveTextContent("Currently Active");
  });

  it("applies template with default keepColorAndPageSize: false", () => {
    const onApply = vi.fn();
    render(
      <TemplateGalleryModal
        open={true}
        onOpenChange={vi.fn()}
        currentTemplateId="modern"
        currentDesign={currentDesign}
        onApplyTemplate={onApply}
      />
    );

    const applyTechnical = screen.getByTestId("apply-template-technical");
    fireEvent.click(applyTechnical);

    expect(onApply).toHaveBeenCalledWith("technical", { keepColorAndPageSize: false });
  });

  it("applies template with keepColorAndPageSize: true when checkbox is checked", () => {
    const onApply = vi.fn();
    render(
      <TemplateGalleryModal
        open={true}
        onOpenChange={vi.fn()}
        currentTemplateId="modern"
        currentDesign={currentDesign}
        onApplyTemplate={onApply}
      />
    );

    const checkbox = screen.getByTestId("keep-color-checkbox");
    fireEvent.click(checkbox);

    const applyCreative = screen.getByTestId("apply-template-creative");
    fireEvent.click(applyCreative);

    expect(onApply).toHaveBeenCalledWith("creative", { keepColorAndPageSize: true });
  });

  it("renders undo button and triggers onUndo callback", () => {
    const onUndo = vi.fn();
    const { rerender } = render(
      <TemplateGalleryModal
        open={true}
        onOpenChange={vi.fn()}
        currentTemplateId="modern"
        currentDesign={currentDesign}
        onApplyTemplate={vi.fn()}
        canUndo={true}
        onUndo={onUndo}
      />
    );

    // Click apply on a template
    const applyBold = screen.getByTestId("apply-template-bold");
    fireEvent.click(applyBold);

    // Undo button should appear
    const undoBtn = screen.getByTestId("template-gallery-undo-button");
    expect(undoBtn).toBeInTheDocument();

    fireEvent.click(undoBtn);
    expect(onUndo).toHaveBeenCalledTimes(1);
  });
});
