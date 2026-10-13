import * as React from "react";
import { Link } from "react-router";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Save,
  Pencil,
  Check,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useEditor } from "./EditorContext";

export function EditorHeader() {
  const {
    title,
    rename,
    save,
    saveStatus,
    saveError,
    isDirty,
    version,
  } = useEditor();

  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [titleInput, setTitleInput] = React.useState(title);
  const titleInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setTitleInput(title);
  }, [title]);

  React.useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [isEditingTitle]);

  const handleTitleSubmit = async () => {
    const trimmed = titleInput.trim();
    if (!trimmed || trimmed === title) {
      setTitleInput(title);
      setIsEditingTitle(false);
      return;
    }

    const success = await rename(trimmed);
    if (!success) {
      setTitleInput(title);
    }
    setIsEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void handleTitleSubmit();
    } else if (e.key === "Escape") {
      setTitleInput(title);
      setIsEditingTitle(false);
    }
  };

  return (
    <header className="border-b bg-card px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20">
      <div className="flex items-center gap-3 min-w-0">
        <Link to="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2 h-9 px-2.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>
        </Link>

        <div className="h-4 w-px bg-border hidden sm:block" />

        {/* Inline Editable Title */}
        <div className="flex items-center gap-2 min-w-0">
          {isEditingTitle ? (
            <div className="flex items-center gap-1.5">
              <Input
                ref={titleInputRef}
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={handleKeyDown}
                className="h-8 max-w-[240px] sm:max-w-xs font-semibold text-sm"
                aria-label="Resume Title"
                maxLength={100}
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={handleTitleSubmit}
                aria-label="Save title"
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingTitle(true)}
              className="group flex items-center gap-2 text-left font-semibold text-foreground text-sm sm:text-base hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1.5 py-0.5"
              title="Click to rename"
              aria-label={`Rename resume ${title}`}
            >
              <span className="truncate max-w-[180px] sm:max-w-xs">{title}</span>
              <Pencil className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
            </button>
          )}

          <span className="text-xs text-muted-foreground font-mono hidden md:inline">
            v{version}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Save Status Live Region */}
        <div
          role="status"
          aria-live="polite"
          className="text-xs flex items-center gap-1.5"
          data-testid="save-status-indicator"
        >
          {saveStatus === "saving" && (
            <span className="text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Saving...</span>
            </span>
          )}

          {saveStatus === "saved" && !isDirty && (
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Saved</span>
            </span>
          )}

          {isDirty && saveStatus !== "saving" && (
            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>Unsaved changes</span>
            </span>
          )}

          {saveStatus === "conflict" && (
            <span
              className="text-destructive font-medium flex items-center gap-1"
              title="A newer version was saved elsewhere. Please resolve conflict."
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Conflict (v{version})</span>
            </span>
          )}

          {saveStatus === "error" && (
            <span
              className="text-destructive font-medium flex items-center gap-1"
              title={saveError || "Error saving resume"}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Save error</span>
            </span>
          )}
        </div>

        {/* Manual Save Button */}
        <Button
          onClick={() => void save()}
          disabled={saveStatus === "saving"}
          size="sm"
          className="gap-2 h-9"
          data-testid="manual-save-button"
        >
          {saveStatus === "saving" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>Save</span>
        </Button>
      </div>
    </header>
  );
}
