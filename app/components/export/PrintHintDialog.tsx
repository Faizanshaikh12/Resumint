import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Printer, Check, Info } from "lucide-react";

export interface PrintHintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dontShowAgain: boolean;
  onDontShowAgainChange: (checked: boolean) => void;
  onConfirm: () => void;
}

export function PrintHintDialog({
  open,
  onOpenChange,
  dontShowAgain,
  onDontShowAgainChange,
  onConfirm,
}: PrintHintDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1 text-primary">
            <Printer className="h-5 w-5" />
            <DialogTitle>Save as PDF Instructions</DialogTitle>
          </div>
          <DialogDescription>
            Resumint exports pixel-perfect, ATS-friendly PDFs using your browser's native print engine.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-sm text-foreground">
          <p className="font-medium text-xs uppercase tracking-wider text-muted-foreground">
            Recommended Print Dialog Settings:
          </p>
          <ul className="space-y-2 text-xs sm:text-sm">
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs mt-0.5">
                1
              </span>
              <span>
                <strong>Destination:</strong> Select <em>"Save as PDF"</em> (or your PDF printer).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs mt-0.5">
                2
              </span>
              <span>
                <strong>Margins:</strong> Set to <em>"None"</em> or <em>"Default"</em> (margins are built into the template).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs mt-0.5">
                3
              </span>
              <span>
                <strong>Headers & Footers:</strong> Turn <em>OFF</em> (removes browser URL and date stamps).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs mt-0.5">
                4
              </span>
              <span>
                <strong>Background Graphics:</strong> Turn <em>ON</em> (keeps theme colors, sidebars, and accent bars).
              </span>
            </li>
          </ul>

          <div className="rounded-md bg-muted/60 p-2.5 flex items-start gap-2 text-xs text-muted-foreground mt-3">
            <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
            <span>
              <strong>Mobile Tip:</strong> On iOS Safari or Chrome Android, choose Share &gt; Print, then pinch outward to view and save the full PDF.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t">
          <input
            type="checkbox"
            id="dont-show-print-hint"
            checked={dontShowAgain}
            onChange={(e) => onDontShowAgainChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
          />
          <label
            htmlFor="dont-show-print-hint"
            className="text-xs text-muted-foreground select-none cursor-pointer"
          >
            Don't show this hint again
          </label>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            className="gap-1.5"
            data-testid="confirm-print-button"
          >
            <Check className="h-4 w-4" />
            Continue to Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
