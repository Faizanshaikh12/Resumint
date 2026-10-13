import * as React from "react";
import { type FetcherWithComponents } from "react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { ActionResult } from "~/lib/schemas/resume-actions";

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeId: string;
  currentTitle: string;
  fetcher: FetcherWithComponents<ActionResult>;
}

export function RenameDialog({
  open,
  onOpenChange,
  resumeId,
  currentTitle,
  fetcher,
}: RenameDialogProps) {
  const [title, setTitle] = React.useState(currentTitle);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setTitle(currentTitle);
      setError(null);
      setTimeout(() => inputRef.current?.select(), 50);
    }
  }, [open, currentTitle]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Title cannot be empty");
      return;
    }
    if (trimmed.length > 100) {
      setError("Title cannot exceed 100 characters");
      return;
    }

    if (trimmed === currentTitle.trim()) {
      onOpenChange(false);
      return;
    }

    fetcher.submit(
      { intent: "rename", id: resumeId, title: trimmed },
      { method: "post", action: "/dashboard" }
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Rename Resume</DialogTitle>
            <DialogDescription>
              Enter a new title for your document (1–100 characters).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="resume-rename-input">Resume Title</Label>
            <Input
              id="resume-rename-input"
              ref={inputRef}
              value={title}
              maxLength={100}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Senior Software Engineer 2026"
              autoFocus
              className={error ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || fetcher.state === "submitting"}>
              Save Title
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
