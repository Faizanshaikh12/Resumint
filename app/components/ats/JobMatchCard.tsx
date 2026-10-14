import * as React from "react";
import {
  Briefcase,
  Sparkles,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import type { AtsContext } from "~/lib/ats/types";
import { matchJobDescription, type JobMatchResult } from "~/lib/ats/keywords/match";
import { MAX_JD_LENGTH } from "~/lib/ats/keywords/tokenize";

interface JobMatchCardProps {
  resumeId?: string;
  context: AtsContext;
}

export function JobMatchCard({ resumeId, context }: JobMatchCardProps) {
  const storageKey = `resumint_jd_${resumeId || "guest_draft"}`;

  // Initialize from sessionStorage
  const [jobDescription, setJobDescription] = React.useState<string>(() => {
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        return window.sessionStorage.getItem(storageKey) || "";
      } catch {
        return "";
      }
    }
    return "";
  });

  const [matchResult, setMatchResult] = React.useState<JobMatchResult | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = React.useState(false);

  // Sync to sessionStorage on change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.slice(0, MAX_JD_LENGTH);
    setJobDescription(val);
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        window.sessionStorage.setItem(storageKey, val);
      } catch {
        // Ignore quota errors
      }
    }
  };

  const handleClear = () => {
    setJobDescription("");
    setMatchResult(null);
    setHasAnalyzed(false);
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        window.sessionStorage.removeItem(storageKey);
      } catch {
        // Ignore
      }
    }
  };

  const handleAnalyze = () => {
    if (!jobDescription.trim()) {
      setMatchResult(null);
      setHasAnalyzed(true);
      return;
    }
    const result = matchJobDescription(jobDescription, context);
    setMatchResult(result);
    setHasAnalyzed(true);
  };

  // Run automatically if session had text stored
  React.useEffect(() => {
    if (jobDescription.trim() && !hasAnalyzed) {
      const result = matchJobDescription(jobDescription, context);
      setMatchResult(result);
      setHasAnalyzed(true);
    }
  }, [context]);

  const charCount = jobDescription.length;

  return (
    <div
      className="p-5 rounded-xl border bg-card text-card-foreground shadow-xs space-y-4"
      data-testid="ats-job-match-card"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
          <h3 className="font-semibold text-sm text-foreground">
            Job Description Match
          </h3>
        </div>

        {jobDescription && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
            data-testid="clear-jd-button"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Clear</span>
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Compare your resume against a target job posting. Analyzed 100% locally in your browser—never sent to any server.
      </p>

      {/* Input area with character counter */}
      <div className="space-y-1.5">
        <label htmlFor="jd-textarea" className="sr-only">
          Paste a job description
        </label>
        <textarea
          id="jd-textarea"
          value={jobDescription}
          onChange={handleTextChange}
          placeholder="Paste requirements, responsibilities, or the full job description here..."
          rows={4}
          maxLength={MAX_JD_LENGTH}
          className="w-full text-xs p-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y font-mono leading-relaxed"
          data-testid="jd-input-textarea"
        />
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{charCount} / {MAX_JD_LENGTH} characters</span>
          <Button
            type="button"
            size="sm"
            disabled={!jobDescription.trim()}
            onClick={handleAnalyze}
            className="h-7 px-3 text-xs gap-1.5 font-medium"
            data-testid="analyze-jd-button"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Analyze Match</span>
          </Button>
        </div>
      </div>

      {/* Stuffing Guard Alert */}
      {matchResult?.stuffingWarning && (
        <div
          role="alert"
          className="p-3 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5"
          data-testid="ats-stuffing-warning"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold block">Keyword Density Notice</span>
            <p className="leading-relaxed">{matchResult.stuffingWarning}</p>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {hasAnalyzed && matchResult && (
        <div className="pt-3 border-t space-y-4" data-testid="jd-analysis-results">
          {/* Coverage Gauge Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">
                Keyword Coverage
              </span>
              <span
                className="font-mono font-bold text-sm text-foreground"
                data-testid="jd-coverage-percentage"
              >
                {matchResult.matchPercent}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted/60 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  matchResult.matchPercent >= 75
                    ? "bg-emerald-500"
                    : matchResult.matchPercent >= 50
                    ? "bg-blue-500"
                    : "bg-amber-500"
                }`}
                style={{ width: `${matchResult.matchPercent}%` }}
              />
            </div>
          </div>

          {/* Matched Keywords */}
          {matchResult.matched.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Found in your resume ({matchResult.matched.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {matchResult.matched.map((m) => (
                  <span
                    key={m.canonical}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                    data-testid={`matched-chip-${m.canonical}`}
                  >
                    <span>{m.canonical}</span>
                    {m.count > 1 && (
                      <span className="text-[10px] opacity-75 font-mono">
                        ({m.count}x)
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing Keywords with Honest Hints */}
          {matchResult.missing.length > 0 ? (
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400">
                <XCircle className="h-3.5 w-3.5" />
                <span>Missing keywords to consider ({matchResult.missing.length})</span>
              </div>

              <div className="space-y-2">
                {matchResult.missing.map((item) => (
                  <div
                    key={item.canonical}
                    className="p-2.5 rounded-lg border bg-muted/20 text-xs space-y-1"
                    data-testid={`missing-chip-${item.canonical}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">
                        {item.canonical}
                      </span>
                      <span className="text-[10px] text-muted-foreground italic">
                        {item.warningNote}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground/80">
                        Suggested location:
                      </span>{" "}
                      {item.placementHint}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>Great match! All core keywords from this posting are present in your resume.</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
