import React from "react";
import { Link } from "react-router";
import { Sparkles, ArrowRight, ShieldCheck, Share2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";

export interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export function AuthDialog({
  open,
  onOpenChange,
  title = "Create an Account to Share",
  description = "Public link sharing requires a free Resumint account so you can manage your links, set passwords, and track views.",
}: AuthDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="auth-dialog">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
            <Share2 className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl">{title}</DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground mt-1">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 rounded-lg border bg-muted/30 p-3 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Your local draft will be safely saved to your account</span>
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <span>Generate custom secret links, QR codes, and password protect</span>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2 pt-2">
          <Link to="/signup" className="w-full">
            <Button className="w-full gap-2" size="sm" data-testid="auth-dialog-signup-button">
              <span>Sign Up Free</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>

          <div className="text-center text-xs text-muted-foreground mt-1">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Log in
            </Link>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
