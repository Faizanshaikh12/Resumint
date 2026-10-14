import * as React from "react";
import type { AtsReport } from "~/lib/ats/types";

interface ScoreGaugeProps {
  report: AtsReport;
  isUpdating?: boolean;
}

export function ScoreGauge({ report, isUpdating }: ScoreGaugeProps) {
  const { score, label, categories } = report;

  // Gauge SVG parameters
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Determine dynamic ring color based on score thresholds
  let scoreColorClass = "text-amber-500 stroke-amber-500";
  let badgeColorClass = "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800";

  if (score >= 90) {
    scoreColorClass = "text-emerald-500 stroke-emerald-500";
    badgeColorClass = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800";
  } else if (score >= 70) {
    scoreColorClass = "text-blue-500 stroke-blue-500";
    badgeColorClass = "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800";
  } else if (score < 40) {
    scoreColorClass = "text-rose-500 stroke-rose-500";
    badgeColorClass = "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800";
  }

  return (
    <div
      className="p-5 rounded-xl border bg-card text-card-foreground shadow-xs transition-all relative overflow-hidden"
      data-testid="ats-score-gauge-card"
    >
      {/* Accessible live status for score changes */}
      <div
        role="status"
        aria-live="polite"
        className="sr-only"
        data-testid="ats-score-live-announcement"
      >
        {`Resumint checklist score: ${score} out of 100, ${label}`}
      </div>

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        {/* SVG Circular Meter */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg
            className="w-28 h-28 transform -rotate-90"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            {/* Background Ring */}
            <circle
              className="text-muted/30 stroke-current"
              strokeWidth="9"
              fill="transparent"
              r={radius}
              cx="50"
              cy="50"
            />
            {/* Value Progress Ring */}
            <circle
              className={`${scoreColorClass} transition-all duration-700 ease-out`}
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              r={radius}
              cx="50"
              cy="50"
            />
          </svg>

          {/* Center Score Number */}
          <div className="absolute flex flex-col items-center justify-center">
            <span
              className="text-3xl font-extrabold tracking-tight text-foreground"
              data-testid="ats-score-number"
            >
              {score}
            </span>
            <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
              / 100
            </span>
          </div>
        </div>

        {/* Score Details & Category Mini-Bars */}
        <div className="flex-1 w-full text-center sm:text-left min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
            <span
              className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${badgeColorClass}`}
              data-testid="ats-score-label-badge"
            >
              {label}
            </span>
            {isUpdating && (
              <span className="text-xs text-muted-foreground animate-pulse font-medium">
                Updating...
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed mb-4">
            Resumint checklist score (a guide, not a guarantee)
          </p>

          {/* Category Mini Breakdown Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 pt-1 border-t">
            {categories.map((cat) => (
              <div key={cat.id} className="text-xs space-y-1">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="truncate font-medium">{cat.label}</span>
                  <span className="font-mono text-[10px] shrink-0 ml-1">
                    {cat.score}%
                  </span>
                </div>
                <div
                  className="w-full h-1.5 rounded-full bg-muted/50 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={cat.score}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${cat.label} progress`}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      cat.score >= 85
                        ? "bg-emerald-500"
                        : cat.score >= 60
                        ? "bg-blue-500"
                        : cat.score >= 40
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, cat.score))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
