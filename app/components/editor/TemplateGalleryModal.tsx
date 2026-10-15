import * as React from "react";
import { Check, Sparkles, RotateCcw, Columns, Square, Layers } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { TEMPLATE_SEED_DATA } from "~/db/seed/templates";
import { GenericResumeRenderer } from "~/components/templates/generic/GenericResumeRenderer";
import { SAMPLE_RESUME_CONTENT } from "~/lib/resume/sample-content";
import type { ResumeDesign, TemplateId } from "~/lib/schemas/resume";
import type { TemplateTier } from "~/lib/schemas/template";

export interface TemplateGalleryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTemplateId: TemplateId;
  currentDesign: ResumeDesign;
  onApplyTemplate: (
    templateId: TemplateId,
    options?: { keepColorAndPageSize?: boolean }
  ) => void;
  onUndo?: () => void;
  canUndo?: boolean;
}

type FilterTier = "all" | TemplateTier;

export function TemplateGalleryModal({
  open,
  onOpenChange,
  currentTemplateId,
  currentDesign,
  onApplyTemplate,
  onUndo,
  canUndo,
}: TemplateGalleryModalProps) {
  const [selectedTier, setSelectedTier] = React.useState<FilterTier>("all");
  const [keepColorAndPageSize, setKeepColorAndPageSize] = React.useState(false);
  const [lastAppliedTemplate, setLastAppliedTemplate] = React.useState<string | null>(null);

  const filteredTemplates = React.useMemo(() => {
    if (selectedTier === "all") return TEMPLATE_SEED_DATA;
    return TEMPLATE_SEED_DATA.filter((t) => t.tier === selectedTier);
  }, [selectedTier]);

  const handleApply = (key: string) => {
    onApplyTemplate(key as TemplateId, { keepColorAndPageSize });
    setLastAppliedTemplate(key);
  };

  const handleUndo = () => {
    if (onUndo) {
      onUndo();
      setLastAppliedTemplate(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] flex flex-col p-4 sm:p-6 overflow-hidden"
        data-testid="template-gallery-modal"
      >
        <DialogHeader className="shrink-0 pb-2 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                <Layers className="h-5 w-5 text-primary" />
                <span>Resume Templates</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Switch styles instantly. Your resume content is always preserved with 100% fidelity.
              </DialogDescription>
            </div>

            {/* Undo Action if applied */}
            {canUndo && lastAppliedTemplate && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                className="text-xs h-8 gap-1.5 self-start sm:self-auto text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20"
                data-testid="template-gallery-undo-button"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Undo Style Change</span>
              </Button>
            )}
          </div>

          {/* Controls bar: Tier tabs & Keep Color option */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
            {/* Tier filter tabs */}
            <div
              role="tablist"
              aria-label="Filter templates by tier"
              className="flex items-center rounded-lg border bg-muted/40 p-0.5 text-xs font-medium"
            >
              {(
                [
                  { id: "all", label: "All (10)" },
                  { id: "basic", label: "Basic (3)" },
                  { id: "standard", label: "Standard (4)" },
                  { id: "premium", label: "Premium (3)" },
                ] as const
              ).map((tab) => {
                const isActive = selectedTier === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setSelectedTier(tab.id)}
                    className={`px-3 py-1 rounded-md transition-all ${
                      isActive
                        ? "bg-background text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Keep color and page size toggle */}
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground select-none">
              <input
                type="checkbox"
                checked={keepColorAndPageSize}
                onChange={(e) => setKeepColorAndPageSize(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary cursor-pointer"
                data-testid="keep-color-checkbox"
              />
              <span>Keep my accent color & page size</span>
            </label>
          </div>
        </DialogHeader>

        {/* Scrollable Template Grid */}
        <div
          tabIndex={0}
          role="region"
          aria-label="Templates list"
          className="flex-1 overflow-y-auto py-4 pr-1 focus:outline-none"
        >
          {filteredTemplates.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12 text-center"
              data-testid="template-gallery-empty-state"
            >
              <Layers className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-semibold text-foreground text-sm">No templates found</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                {selectedTier !== "all"
                  ? `No templates available in the ${selectedTier} tier.`
                  : "Unable to load templates from the database."}
              </p>
              {selectedTier !== "all" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTier("all")}
                  className="mt-4 text-xs h-8"
                >
                  View All Templates
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((t) => {
              const isSelected = t.key === currentTemplateId;
              const isTwoColumn = t.layout.columns === 2;

              // Build thumbnail design
              const thumbnailDesign: ResumeDesign = {
                accentColor: keepColorAndPageSize
                  ? currentDesign.accentColor
                  : t.design.accentColor,
                fontFamily: t.design.fontKey as any,
                fontScale: t.design.fontScale,
                lineSpacing: t.design.lineSpacing,
                pageMargin: t.design.pageMargin,
                sectionSpacing: t.design.sectionSpacing,
                pageSize: keepColorAndPageSize ? currentDesign.pageSize : t.design.pageSize,
                columns: t.layout.columns,
                headerAlign: t.design.headerAlign,
                dateStyle: t.design.dateStyle,
                showIcons: t.design.showIcons,
                headerVariant: t.layout.headerVariant,
                sidebarSections: t.layout.sidebarSections,
                sidebarPosition: t.layout.sidebarPosition,
                sectionHeadingVariant: t.layout.sectionHeadingVariant,
                itemVariant: t.layout.itemVariant,
                skillsVariant: t.layout.skillsVariant,
                primaryTextColor: t.design.primaryTextColor,
                secondaryTextColor: t.design.secondaryTextColor,
                backgroundColor: t.design.backgroundColor,
              };

              return (
                <div
                  key={t.key}
                  className={`group flex flex-col rounded-xl border bg-card text-card-foreground shadow-2xs transition-all overflow-hidden relative ${
                    isSelected
                      ? "ring-2 ring-primary border-primary bg-primary/5"
                      : "border-border hover:border-neutral-400 dark:hover:border-neutral-600 hover:shadow-sm"
                  }`}
                  data-testid={`template-card-${t.key}`}
                >
                  {/* Miniature Preview Container */}
                  <div className="w-full h-44 overflow-hidden bg-neutral-50 dark:bg-neutral-900 border-b relative select-none pointer-events-none flex items-start justify-center">
                    <div
                      style={{
                        transform: "scale(0.24)",
                        transformOrigin: "top center",
                        width: "794px",
                        minHeight: "1123px",
                      }}
                      className="shadow-md bg-white text-neutral-900"
                    >
                      <GenericResumeRenderer
                        content={SAMPLE_RESUME_CONTENT}
                        design={thumbnailDesign}
                        layout={t.layout}
                      />
                    </div>

                    {/* Gradient overlay for bottom fade */}
                    <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                  </div>

                  {/* Template Info & Action */}
                  <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                          <span>{t.name}</span>
                          {isSelected && (
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </h3>

                        {/* Tier Badge */}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            t.tier === "premium"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                              : t.tier === "standard"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                              : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700"
                          }`}
                        >
                          {t.tier}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {t.description}
                      </p>

                      {/* Attribute Pills */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {isTwoColumn ? (
                            <>
                              <Columns className="w-2.5 h-2.5" />
                              <span>2 Columns</span>
                            </>
                          ) : (
                            <>
                              <Square className="w-2.5 h-2.5" />
                              <span>1 Column</span>
                            </>
                          )}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>ATS Safe</span>
                        </span>
                      </div>
                    </div>

                    {/* Apply Button */}
                    <Button
                      type="button"
                      size="sm"
                      variant={isSelected ? "outline" : "default"}
                      onClick={() => handleApply(t.key)}
                      className="w-full text-xs h-8 font-medium mt-1"
                      data-testid={`apply-template-${t.key}`}
                    >
                      {isSelected ? "Currently Active" : `Apply ${t.name}`}
                    </Button>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
