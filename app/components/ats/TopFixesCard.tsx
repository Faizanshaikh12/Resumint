import * as React from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import type { Check, FieldTarget } from "~/lib/ats/types";

interface TopFixesCardProps {
  topFixes: Check[];
  onNavigate?: (targets?: FieldTarget[]) => void;
}

export function TopFixesCard({ topFixes, onNavigate }: TopFixesCardProps) {
  if (!topFixes || topFixes.length === 0) {
    return null;
  }

  return (
    <div
      className="p-4 rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10 shadow-xs space-y-3"
      data-testid="ats-top-fixes-card"
    >
      <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
        <Sparkles className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
        <span>Top High-Impact Fixes</span>
      </div>

      <div className="space-y-2">
        {topFixes.map((check, index) => {
          const recoverable = Math.round(check.weight * (1 - check.credit));
          const hasTargets = check.targets && check.targets.length > 0;

          return (
            <button
              key={check.id}
              type="button"
              onClick={() => hasTargets && onNavigate?.(check.targets)}
              className="w-full text-left p-2.5 rounded-lg border bg-card hover:bg-muted/50 transition-all flex items-start justify-between gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              data-testid={`top-fix-item-${index + 1}`}
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">
                    {index + 1}. {check.title}
                  </span>
                  {recoverable > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary text-primary-foreground font-semibold shrink-0">
                      +{recoverable} pts
                    </span>
                  )}
                </div>
                {check.fix && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {check.fix}
                  </p>
                )}
              </div>

              {hasTargets && (
                <div className="shrink-0 pt-1 text-primary opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
