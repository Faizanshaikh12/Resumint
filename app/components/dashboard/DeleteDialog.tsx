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
import { AlertTriangle } from "lucide-react";
import type { ActionResult } from "~/lib/schemas/resume-actions";

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeId: string;
  resumeTitle: string;
  fetcher: FetcherWithComponents<ActionResult>;
}

export function DeleteDialog({
  open,
  onOpenChange,
  resumeId,
  resumeTitle,
  fetcher,
}: DeleteDialogProps) {
  const handleDelete = () => {
    fetcher.submit(
      { intent: "delete", id: resumeId },
      { method: "post", action: "/dashboard" }
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2 sm:mx-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle>Delete &ldquo;{resumeTitle}&rdquo;?</DialogTitle>
          <DialogDescription className="space-y-2 pt-2">
            <span>
              This will permanently delete <strong>{resumeTitle}</strong>, including all historical
              version snapshots and any active share links.
            </span>
            <span className="block font-medium text-destructive">
              This action cannot be undone.
            </span>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={fetcher.state === "submitting"}
            data-testid="confirm-delete-resume-button"
          >
            Delete Resume
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
