import * as React from "react";
import type { AtsReport, AtsContext, CategoryId, FieldTarget } from "~/lib/ats/types";
import { CATEGORY_DEFINITIONS } from "~/lib/ats/types";
import { ScoreGauge } from "./ScoreGauge";
import { TopFixesCard } from "./TopFixesCard";
import { ChecklistItem } from "./ChecklistItem";
import { JobMatchCard } from "./JobMatchCard";

export type FilterChip = "all" | "attention" | "passed";

interface AtsCheckerPanelProps {
  report: AtsReport;
  context: AtsContext;
  resumeId?: string;
  onNavigate?: (targets?: FieldTarget[]) => void;
  isUpdating?: boolean;
}

export function AtsCheckerPanel({
  report,
  context,
  resumeId,
  onNavigate,
  isUpdating,
}: AtsCheckerPanelProps) {
  const [filter, setFilter] = React.useState<FilterChip>("all");

  // Filter checks
  const filteredChecks = React.useMemo(() => {
    switch (filter) {
      case "attention":
        return report.checks.filter(
          (c) => c.status === "fail" || c.status === "warn"
        );
      case "passed":
        return report.checks.filter((c) => c.status === "pass");
      case "all":
      default:
        return report.checks;
    }
  }, [report.checks, filter]);

  // Group checks by category definition order
  const categoryOrder: CategoryId[] = [
    "contact",
    "structure",
    "summary",
    "experience",
    "dates",
    "length",
    "language",
  ];

  const checksByCategory = React.useMemo(() => {
    const map = new Map<CategoryId, typeof filteredChecks>();
    for (const check of filteredChecks) {
      const list = map.get(check.category) || [];
      list.push(check);
      map.set(check.category, list);
    }
    return map;
  }, [filteredChecks]);

  const attentionCount = report.checks.filter(
    (c) => c.status === "fail" || c.status === "warn"
  ).length;
  const passedCount = report.checks.filter((c) => c.status === "pass").length;

  return (
    <div
      className="space-y-6 max-w-2xl mx-auto pb-12"
      data-testid="ats-checker-panel"
    >
      {/* 1. Score Gauge Card */}
      <ScoreGauge report={report} isUpdating={isUpdating} />

      {/* 2. Top 3 Fixes High-Impact Card */}
      <TopFixesCard topFixes={report.topFixes} onNavigate={onNavigate} />

      {/* 3. Filter Chips */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-sm text-foreground">
            Checklist Items
          </h3>

          <div
            role="radiogroup"
            aria-label="Filter checklist items"
            className="flex items-center rounded-lg border bg-muted/40 p-0.5 text-xs"
          >
            <button
              type="button"
              role="radio"
              aria-checked={filter === "all"}
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                filter === "all"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="filter-chip-all"
            >
              All ({report.checks.length})
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={filter === "attention"}
              onClick={() => setFilter("attention")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                filter === "attention"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="filter-chip-attention"
            >
              Needs attention ({attentionCount})
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={filter === "passed"}
              onClick={() => setFilter("passed")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                filter === "passed"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="filter-chip-passed"
            >
              Passed ({passedCount})
            </button>
          </div>
        </div>

        {/* 4. Grouped Checklist */}
        <div className="space-y-5">
          {categoryOrder.map((catId) => {
            const items = checksByCategory.get(catId);
            if (!items || items.length === 0) return null;

            const def = CATEGORY_DEFINITIONS[catId];
            const catScoreObj = report.categories.find((c) => c.id === catId);

            return (
              <section
                key={catId}
                className="space-y-2.5"
                aria-labelledby={`cat-heading-${catId}`}
              >
                <div className="flex items-center justify-between pb-1 border-b border-border/60">
                  <h4
                    id={`cat-heading-${catId}`}
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    {def.label}
                  </h4>
                  {catScoreObj && (
                    <span className="text-xs font-mono font-medium text-muted-foreground">
                      {catScoreObj.score}%
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {items.map((check) => (
                    <ChecklistItem
                      key={check.id}
                      check={check}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              </section>
            );
          })}

          {filteredChecks.length === 0 && (
            <div className="p-8 text-center border rounded-xl bg-card text-muted-foreground text-xs space-y-1">
              <p className="font-semibold text-foreground">No checks found for this filter</p>
              <p>Try switching to "All" to inspect all checklist categories.</p>
            </div>
          )}
        </div>
      </div>

      {/* 5. Job Description Match Card */}
      <JobMatchCard resumeId={resumeId} context={context} />
    </div>
  );
}
