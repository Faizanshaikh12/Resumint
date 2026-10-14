import * as React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import type { Check, FieldTarget } from "~/lib/ats/types";

interface ChecklistItemProps {
  check: Check;
  onNavigate?: (targets?: FieldTarget[]) => void;
}

export function ChecklistItem({ check, onNavigate }: ChecklistItemProps) {
  const { id, status, title, message, fix, targets } = check;
  const isClickable = Boolean(targets && targets.length > 0 && onNavigate);

  const handleClick = () => {
    if (isClickable && onNavigate) {
      onNavigate(targets);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && isClickable && onNavigate) {
      e.preventDefault();
      onNavigate(targets);
    }
  };

  // Status configuration: text label + icon (never color alone)
  let statusBadge = (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
      <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>Passed</span>
    </span>
  );

  if (status === "warn") {
    statusBadge = (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Warning</span>
      </span>
    );
  } else if (status === "fail") {
    statusBadge = (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 dark:text-rose-400">
        <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Needs attention</span>
      </span>
    );
  } else if (status === "na") {
    statusBadge = (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
        <HelpCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Not applicable</span>
      </span>
    );
  }

  return (
    <div
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`group p-3.5 rounded-lg border text-sm transition-all text-left w-full ${
        isClickable
          ? "hover:border-primary/50 hover:bg-muted/40 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          : "bg-card"
      } ${status === "pass" ? "opacity-90 bg-muted/10" : "bg-card shadow-2xs"}`}
      data-testid={`ats-check-item-${id}`}
      aria-label={`${title} - ${status === "pass" ? "Passed" : status === "warn" ? "Warning" : status === "fail" ? "Needs attention" : "Not applicable"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-semibold text-foreground text-sm">{title}</span>
            {statusBadge}
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed mb-1.5">
            {message}
          </p>

          {fix && (status === "fail" || status === "warn") && (
            <div className="mt-2 text-xs bg-muted/60 dark:bg-muted/40 p-2.5 rounded-md border text-foreground/90 space-y-1">
              <span className="font-semibold text-primary block text-[11px] uppercase tracking-wider">
                How to fix:
              </span>
              <p className="leading-relaxed">{fix}</p>
            </div>
          )}
        </div>

        {isClickable && (
          <div className="shrink-0 pt-0.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-primary">
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Jump to field</span>
          </div>
        )}
      </div>
    </div>
  );
}
