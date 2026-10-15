import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DesignPanel } from "~/components/editor/DesignPanel";
import { createDefaultDesign } from "~/lib/resume/defaults";
import type { ResumeDesign } from "~/lib/schemas/resume";

describe("DesignPanel Component", () => {
  const defaultDesign: ResumeDesign = createDefaultDesign();

  it("renders template options with radio semantics and correct selection", () => {
    const onSelectTemplate = vi.fn();
    render(
      <DesignPanel
        templateId="modern"
        design={defaultDesign}
        onSelectTemplate={onSelectTemplate}
        onUpdateDesign={vi.fn()}
        onResetDesign={vi.fn()}
      />
    );

    const radiogroup = screen.getByRole("radiogroup", { name: /Choose resume template/i });
    expect(radiogroup).toBeInTheDocument();

    const modernRadio = screen.getByRole("radio", { name: /Modern/i });
    expect(modernRadio).toHaveAttribute("aria-checked", "true");

    const minimalRadio = screen.getByRole("radio", { name: /Minimal/i });
    expect(minimalRadio).toHaveAttribute("aria-checked", "false");

    fireEvent.click(minimalRadio);
    expect(onSelectTemplate).toHaveBeenCalledWith("minimal");
  });

  it("passes keepColorAndPageSize option when toggle is checked", () => {
    const onSelectTemplate = vi.fn();
    render(
      <DesignPanel
        templateId="modern"
        design={defaultDesign}
        onSelectTemplate={onSelectTemplate}
        onUpdateDesign={vi.fn()}
        onResetDesign={vi.fn()}
      />
    );

    const toggle = screen.getByTestId("design-panel-keep-color");
    fireEvent.click(toggle);

    const minimalRadio = screen.getByRole("radio", { name: /Minimal/i });
    fireEvent.click(minimalRadio);

    expect(onSelectTemplate).toHaveBeenCalledWith("minimal", { keepColorAndPageSize: true });
  });

  it("clicking color swatch calls onUpdateDesign with accent color", () => {
    const onUpdateDesign = vi.fn();
    render(
      <DesignPanel
        templateId="modern"
        design={defaultDesign}
        onSelectTemplate={vi.fn()}
        onUpdateDesign={onUpdateDesign}
        onResetDesign={vi.fn()}
      />
    );

    const emeraldSwatch = screen.getByLabelText(/Select Emerald/i);
    fireEvent.click(emeraldSwatch);

    expect(onUpdateDesign).toHaveBeenCalledWith({ accentColor: "#059669" }, "accentColor");
  });

  it("shows WCAG contrast warning when accent color has low contrast against white", () => {
    render(
      <DesignPanel
        templateId="modern"
        design={{ ...defaultDesign, accentColor: "#facc15" }} // bright yellow
        onSelectTemplate={vi.fn()}
        onUpdateDesign={vi.fn()}
        onResetDesign={vi.fn()}
      />
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/Low Contrast Warning/i)).toBeInTheDocument();
  });

  it("does not show contrast warning when accent color is accessible", () => {
    render(
      <DesignPanel
        templateId="modern"
        design={{ ...defaultDesign, accentColor: "#1e3a8a" }} // dark navy
        onSelectTemplate={vi.fn()}
        onUpdateDesign={vi.fn()}
        onResetDesign={vi.fn()}
      />
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("adjusting sliders calls onUpdateDesign with clamped/parsed values", () => {
    const onUpdateDesign = vi.fn();
    render(
      <DesignPanel
        templateId="modern"
        design={defaultDesign}
        onSelectTemplate={vi.fn()}
        onUpdateDesign={onUpdateDesign}
        onResetDesign={vi.fn()}
      />
    );

    const fontScaleSlider = screen.getByLabelText(/^Font Size$/i);
    fireEvent.change(fontScaleSlider, { target: { value: "1.15" } });
    expect(onUpdateDesign).toHaveBeenCalledWith({ fontScale: 1.15 }, "fontScale");

    const pageMarginSlider = screen.getByLabelText(/^Page Margin$/i);
    fireEvent.change(pageMarginSlider, { target: { value: "24" } });
    expect(onUpdateDesign).toHaveBeenCalledWith({ pageMargin: 24 }, "pageMargin");
  });

  it("disables 2 columns button on single-column template", () => {
    render(
      <DesignPanel
        templateId="classic" // Classic only supports 1 column
        design={defaultDesign}
        onSelectTemplate={vi.fn()}
        onUpdateDesign={vi.fn()}
        onResetDesign={vi.fn()}
      />
    );

    const twoColButton = screen.getByRole("button", { name: /2 Columns/i });
    expect(twoColButton).toBeDisabled();
    expect(screen.getByText(/Template 1-col only/i)).toBeInTheDocument();
  });

  it("reset defaults asks for confirmation before invoking onResetDesign", () => {
    const onResetDesign = vi.fn();
    render(
      <DesignPanel
        templateId="modern"
        design={defaultDesign}
        onSelectTemplate={vi.fn()}
        onUpdateDesign={vi.fn()}
        onResetDesign={onResetDesign}
      />
    );

    const resetBtn = screen.getByRole("button", { name: /Reset Defaults/i });
    fireEvent.click(resetBtn);

    expect(screen.getByRole("button", { name: /Confirm Reset/i })).toBeInTheDocument();
    expect(onResetDesign).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /Confirm Reset/i }));
    expect(onResetDesign).toHaveBeenCalledTimes(1);
  });
});
