import React, { useState } from "react";
import {
  Check,
  RotateCcw,
  AlertTriangle,
  Columns,
  Square,
  AlignLeft,
  AlignCenter,
  Calendar,
  Sparkles,
} from "lucide-react";
import { toast } from "~/components/ui/sonner";
import { getAllTemplates, getTemplate } from "~/components/templates/registry";
import {
  BUNDLED_FONT_FAMILIES,
  type BundledFontFamily,
  type TemplateId,
  type ResumeDesign,
} from "~/lib/schemas/resume";
import { isAccentReadable, getContrastRatio } from "~/lib/resume/contrast";
import { FONT_STACKS } from "~/lib/resume/design-tokens";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

import { EditorContext } from "./EditorContext";

export interface DesignPanelProps {
  templateId?: TemplateId;
  design?: ResumeDesign;
  onSelectTemplate?: (templateId: TemplateId) => void;
  onUpdateDesign?: (partial: Partial<ResumeDesign>, fieldName?: string) => void;
  onResetDesign?: () => void;
}

const CURATED_SWATCHES = [
  { name: "Royal Blue", hex: "#2563eb" },
  { name: "Deep Navy", hex: "#1e3a8a" },
  { name: "Emerald", hex: "#059669" },
  { name: "Violet", hex: "#7c3aed" },
  { name: "Rose", hex: "#e11d48" },
  { name: "Amber", hex: "#d97706" },
  { name: "Slate", hex: "#0f172a" },
  { name: "Charcoal", hex: "#171717" },
];

const FONT_LABELS: Record<BundledFontFamily, string> = {
  inter: "Inter (Modern Sans)",
  "source-serif-4": "Source Serif 4 (Executive Serif)",
  lato: "Lato (Friendly Sans)",
  merriweather: "Merriweather (Classic Serif)",
  "ibm-plex-sans": "IBM Plex Sans (Technical Sans)",
  "roboto-mono": "Roboto Mono (Monospace Code)",
  "plus-jakarta-sans": "Plus Jakarta Sans (Creative Sans)",
};

export function DesignPanel(props: DesignPanelProps = {}) {
  const context = React.useContext(EditorContext);
  const templateId = props.templateId ?? context?.templateId ?? "modern";
  const design = props.design ?? context?.design ?? getTemplate(templateId).defaultDesign;
  const onSelectTemplate = props.onSelectTemplate ?? context?.setTemplate ?? (() => {});
  const onUpdateDesign = props.onUpdateDesign ?? context?.updateDesign ?? (() => {});
  const onResetDesign = props.onResetDesign ?? context?.resetDesign ?? (() => {});

  const allTemplates = getAllTemplates();
  const currentTemplate = getTemplate(templateId);

  const [hexInput, setHexInput] = useState(design.accentColor || "#2563eb");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  React.useEffect(() => {
    setHexInput(design.accentColor || "#2563eb");
  }, [design.accentColor]);

  const supports2Columns = currentTemplate.supports.columns.includes(2);
  const supportsCenter = currentTemplate.supports.headerAlign.includes("center");

  const contrastRatio = getContrastRatio(design.accentColor || "#2563eb", "#ffffff");
  const isReadable = isAccentReadable(design.accentColor || "#2563eb");

  const handleColorChange = (hex: string) => {
    setHexInput(hex);
    if (/^#([0-9a-fA-F]{3}){1,2}$/.test(hex)) {
      onUpdateDesign({ accentColor: hex }, "accentColor");
    }
  };

  const handleResetConfirm = () => {
    onResetDesign();
    setShowResetConfirm(false);
    toast.success("Design reset to template defaults");
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 max-w-2xl mx-auto" data-testid="design-panel">
      {/* 1. Template Gallery */}
      <section className="space-y-3" aria-labelledby="template-gallery-heading">
        <div>
          <h2 id="template-gallery-heading" className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Template Gallery
          </h2>
          <p className="text-xs text-neutral-500">
            Switch styles instantly. Your resume content is always preserved.
          </p>
        </div>

        <div
          role="radiogroup"
          aria-label="Choose resume template"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {allTemplates.map((t) => {
            const isSelected = t.id === templateId;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-label={t.name}
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => onSelectTemplate(t.id)}
                className={`flex flex-col text-left p-3.5 rounded-lg border text-xs transition-all relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs ring-1 ring-blue-600"
                    : "border-neutral-200 hover:border-neutral-300 bg-card hover:bg-neutral-50/50"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                    {t.name}
                  </span>
                  {isSelected && (
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                  {t.description}
                </p>
                <span className="inline-flex items-center gap-1 mt-2.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded w-fit">
                  <Sparkles className="w-2.5 h-2.5" />
                  ATS-Friendly
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Accent Color */}
      <section className="space-y-3" aria-labelledby="accent-color-heading">
        <h2 id="accent-color-heading" className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Accent Color
        </h2>
        <div className="space-y-3">
          {/* Swatches */}
          <div className="flex flex-wrap items-center gap-2">
            {CURATED_SWATCHES.map((swatch) => {
              const active = design.accentColor?.toLowerCase() === swatch.hex.toLowerCase();
              return (
                <button
                  key={swatch.hex}
                  type="button"
                  title={swatch.name}
                  aria-label={`Select ${swatch.name}`}
                  onClick={() => handleColorChange(swatch.hex)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    active ? "ring-2 ring-neutral-900 dark:ring-white scale-110" : ""
                  }`}
                  style={{ backgroundColor: swatch.hex }}
                >
                  {active && <Check className="w-3.5 h-3.5 text-white drop-shadow-xs" />}
                </button>
              );
            })}
          </div>

          {/* Custom Hex Input */}
          <div className="flex items-center gap-2 max-w-xs">
            <input
              type="color"
              aria-label="Color Picker"
              value={design.accentColor || "#2563eb"}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-9 h-9 p-0.5 rounded border border-neutral-300 cursor-pointer bg-transparent"
            />
            <Input
              type="text"
              aria-label="Custom Hex Color"
              value={hexInput}
              maxLength={7}
              placeholder="#2563eb"
              onChange={(e) => handleColorChange(e.target.value)}
              className="font-mono text-xs h-9 uppercase"
            />
          </div>

          {/* WCAG Contrast Warning */}
          {!isReadable && (
            <div
              role="alert"
              className="flex items-start gap-2 p-2.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-xs"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Low Contrast Warning ({contrastRatio}:1 on white)</span>
                <p className="text-amber-800 text-[11px] mt-0.5">
                  Recruiters and automated print scans may struggle to read text with low contrast.
                  We recommend a minimum 4.5:1 ratio.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. Typography */}
      <section className="space-y-3" aria-labelledby="typography-heading">
        <h2 id="typography-heading" className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Typography
        </h2>
        <div className="space-y-1.5 max-w-md">
          <Label htmlFor="font-family-select" className="text-xs text-neutral-600">
            Font Family
          </Label>
          <select
            id="font-family-select"
            value={design.fontFamily || "inter"}
            onChange={(e) =>
              onUpdateDesign({ fontFamily: e.target.value as BundledFontFamily }, "fontFamily")
            }
            className="w-full text-xs h-9 rounded-md border border-neutral-300 bg-background px-3 py-1 text-neutral-900 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            {BUNDLED_FONT_FAMILIES.map((font) => (
              <option
                key={font}
                value={font}
                style={{ fontFamily: FONT_STACKS[font] }}
              >
                {FONT_LABELS[font]}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* 4. Sizing & Spacing Sliders */}
      <section className="space-y-4" aria-labelledby="spacing-heading">
        <h2 id="spacing-heading" className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Size & Spacing
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Font Scale */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <Label htmlFor="font-scale-slider" className="text-neutral-600">
                Font Size
              </Label>
              <span className="font-mono text-neutral-500">
                {Math.round((design.fontScale || 1.0) * 100)}%
              </span>
            </div>
            <input
              id="font-scale-slider"
              type="range"
              min="0.85"
              max="1.25"
              step="0.05"
              value={design.fontScale ?? 1.0}
              onChange={(e) =>
                onUpdateDesign({ fontScale: parseFloat(e.target.value) }, "fontScale")
              }
              className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Line Spacing */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <Label htmlFor="line-spacing-slider" className="text-neutral-600">
                Line Spacing
              </Label>
              <span className="font-mono text-neutral-500">
                {(design.lineSpacing ?? 1.3).toFixed(2)}
              </span>
            </div>
            <input
              id="line-spacing-slider"
              type="range"
              min="1.0"
              max="1.8"
              step="0.05"
              value={design.lineSpacing ?? 1.3}
              onChange={(e) =>
                onUpdateDesign({ lineSpacing: parseFloat(e.target.value) }, "lineSpacing")
              }
              className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Page Margins */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <Label htmlFor="page-margin-slider" className="text-neutral-600">
                Page Margin
              </Label>
              <span className="font-mono text-neutral-500">
                {design.pageMargin ?? 16}mm
              </span>
            </div>
            <input
              id="page-margin-slider"
              type="range"
              min="10"
              max="30"
              step="1"
              value={design.pageMargin ?? 16}
              onChange={(e) =>
                onUpdateDesign({ pageMargin: parseInt(e.target.value, 10) }, "pageMargin")
              }
              className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Section Spacing */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <Label htmlFor="section-spacing-slider" className="text-neutral-600">
                Section Spacing
              </Label>
              <span className="font-mono text-neutral-500">
                {design.sectionSpacing ?? 16}mm
              </span>
            </div>
            <input
              id="section-spacing-slider"
              type="range"
              min="8"
              max="32"
              step="1"
              value={design.sectionSpacing ?? 16}
              onChange={(e) =>
                onUpdateDesign({ sectionSpacing: parseInt(e.target.value, 10) }, "sectionSpacing")
              }
              className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>
      </section>

      {/* 5. Layout & Formatting Options */}
      <section className="space-y-4" aria-labelledby="layout-options-heading">
        <h2 id="layout-options-heading" className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Layout & Formatting
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Page Size */}
          <div className="space-y-1.5">
            <span className="text-xs text-neutral-600">Page Size</span>
            <div className="flex rounded-md border border-neutral-300 p-0.5 bg-neutral-100 dark:bg-neutral-800">
              <button
                type="button"
                onClick={() => onUpdateDesign({ pageSize: "A4" }, "pageSize")}
                className={`flex-1 py-1 text-xs font-medium rounded transition-colors ${
                  design.pageSize !== "Letter"
                    ? "bg-white dark:bg-neutral-900 shadow-xs text-neutral-900 dark:text-white"
                    : "text-neutral-600 dark:text-neutral-400"
                }`}
              >
                A4 (210×297mm)
              </button>
              <button
                type="button"
                onClick={() => onUpdateDesign({ pageSize: "Letter" }, "pageSize")}
                className={`flex-1 py-1 text-xs font-medium rounded transition-colors ${
                  design.pageSize === "Letter"
                    ? "bg-white dark:bg-neutral-900 shadow-xs text-neutral-900 dark:text-white"
                    : "text-neutral-600 dark:text-neutral-400"
                }`}
              >
                Letter (8.5×11in)
              </button>
            </div>
          </div>

          {/* Columns */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-600">Columns</span>
              {!supports2Columns && (
                <span className="text-[10px] text-neutral-400">Template 1-col only</span>
              )}
            </div>
            <div className="flex rounded-md border border-neutral-300 p-0.5 bg-neutral-100 dark:bg-neutral-800">
              <button
                type="button"
                onClick={() => onUpdateDesign({ columns: 1 }, "columns")}
                className={`flex-1 py-1 text-xs font-medium rounded flex items-center justify-center gap-1 transition-colors ${
                  design.columns !== 2
                    ? "bg-white dark:bg-neutral-900 shadow-xs text-neutral-900 dark:text-white"
                    : "text-neutral-600 dark:text-neutral-400"
                }`}
              >
                <Square className="w-3 h-3" />
                <span>1 Column</span>
              </button>
              <button
                type="button"
                disabled={!supports2Columns}
                title={!supports2Columns ? "This template only supports single-column layout" : undefined}
                onClick={() => onUpdateDesign({ columns: 2 }, "columns")}
                className={`flex-1 py-1 text-xs font-medium rounded flex items-center justify-center gap-1 transition-colors ${
                  design.columns === 2
                    ? "bg-white dark:bg-neutral-900 shadow-xs text-neutral-900 dark:text-white"
                    : "text-neutral-600 dark:text-neutral-400"
                } ${!supports2Columns ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                <Columns className="w-3 h-3" />
                <span>2 Columns</span>
              </button>
            </div>
          </div>

          {/* Header Alignment */}
          <div className="space-y-1.5">
            <span className="text-xs text-neutral-600">Header Alignment</span>
            <div className="flex rounded-md border border-neutral-300 p-0.5 bg-neutral-100 dark:bg-neutral-800">
              <button
                type="button"
                onClick={() => onUpdateDesign({ headerAlign: "left" }, "headerAlign")}
                className={`flex-1 py-1 text-xs font-medium rounded flex items-center justify-center gap-1 transition-colors ${
                  design.headerAlign !== "center"
                    ? "bg-white dark:bg-neutral-900 shadow-xs text-neutral-900 dark:text-white"
                    : "text-neutral-600 dark:text-neutral-400"
                }`}
              >
                <AlignLeft className="w-3 h-3" />
                <span>Left</span>
              </button>
              <button
                type="button"
                disabled={!supportsCenter}
                onClick={() => onUpdateDesign({ headerAlign: "center" }, "headerAlign")}
                className={`flex-1 py-1 text-xs font-medium rounded flex items-center justify-center gap-1 transition-colors ${
                  design.headerAlign === "center"
                    ? "bg-white dark:bg-neutral-900 shadow-xs text-neutral-900 dark:text-white"
                    : "text-neutral-600 dark:text-neutral-400"
                } ${!supportsCenter ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                <AlignCenter className="w-3 h-3" />
                <span>Center</span>
              </button>
            </div>
          </div>

          {/* Date Style */}
          <div className="space-y-1.5">
            <span className="text-xs text-neutral-600">Date Style</span>
            <select
              aria-label="Date Style"
              value={design.dateStyle || "MMM YYYY"}
              onChange={(e) =>
                onUpdateDesign(
                  { dateStyle: e.target.value as "MMM YYYY" | "MM/YYYY" | "YYYY" },
                  "dateStyle"
                )
              }
              className="w-full text-xs h-8 rounded-md border border-neutral-300 bg-background px-2.5 py-1 text-neutral-900 shadow-xs"
            >
              <option value="MMM YYYY">MMM YYYY (e.g. Apr 2023)</option>
              <option value="MM/YYYY">MM/YYYY (e.g. 04/2023)</option>
              <option value="YYYY">YYYY (e.g. 2023)</option>
            </select>
          </div>
        </div>

        {/* Show Icons Toggle */}
        <div className="flex items-center gap-2 pt-1">
          <input
            id="show-icons-checkbox"
            type="checkbox"
            checked={design.showIcons ?? true}
            onChange={(e) => onUpdateDesign({ showIcons: e.target.checked }, "showIcons")}
            className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
          />
          <Label htmlFor="show-icons-checkbox" className="text-xs font-medium text-neutral-700 cursor-pointer">
            Show icons for contact info and links
          </Label>
        </div>
      </section>

      {/* 6. Reset Defaults */}
      <section className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
        <div>
          <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block">
            Reset Customizations
          </span>
          <span className="text-[11px] text-neutral-500">
            Reverts all design values back to {currentTemplate.name}&apos;s default styles.
          </span>
        </div>

        {showResetConfirm ? (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowResetConfirm(false)}
              className="text-xs h-8"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleResetConfirm}
              className="text-xs h-8"
            >
              Confirm Reset
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowResetConfirm(true)}
            className="text-xs h-8 gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </Button>
        )}
      </section>
    </div>
  );
}
