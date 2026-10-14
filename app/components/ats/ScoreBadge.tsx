import * as React from "react";
import { Gauge } from "lucide-react";
import type { AtsReport } from "~/lib/ats/types";

interface ScoreBadgeProps {
  report: AtsReport;
  onClick: () => void;
  isUpdating?: boolean;
}

export function ScoreBadge({ report, onClick, isUpdating }: ScoreBadgeProps) {
  const { score, label } = report;

  let colorClasses = "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800";

  if (score >= 90) {
    colorClasses = "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800";
  } else if (score >= 70) {
    colorClasses = "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-800";
  } else if (score < 40) {
    colorClasses = "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800";
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0 ${colorClasses}`}
      title="Click to view ATS checklist and recommendations"
      aria-label={`Resume score: ${score} out of 100 (${label}). Click to open Check tab.`}
      data-testid="editor-header-score-badge"
    >
      <Gauge className={`h-3.5 w-3.5 ${isUpdating ? "animate-spin" : ""}`} aria-hidden="true" />
      <span className="font-mono font-bold">{score}</span>
      <span className="text-[10px] opacity-80 hidden sm:inline">/ 100</span>
      <span className="hidden md:inline font-normal">({label})</span>
    </button>
  );
}
