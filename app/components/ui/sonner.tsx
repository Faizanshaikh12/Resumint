import * as React from "react";
import { cn } from "~/lib/utils";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

type ToastListener = (toasts: ToastItem[]) => void;

let listeners: ToastListener[] = [];
let activeToasts: ToastItem[] = [];

export const toast = {
  success: (message: string) => addToast(message, "success"),
  error: (message: string) => addToast(message, "error"),
  info: (message: string) => addToast(message, "info"),
};

function addToast(message: string, type: ToastType) {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast: ToastItem = { id, message, type };
  activeToasts = [...activeToasts, newToast];
  listeners.forEach((l) => l(activeToasts));

  setTimeout(() => {
    removeToast(id);
  }, 4000);
}

function removeToast(id: string) {
  activeToasts = activeToasts.filter((t) => t.id !== id);
  listeners.forEach((l) => l(activeToasts));
}

export function Toaster() {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  React.useEffect(() => {
    const listener = (newToasts: ToastItem[]) => setToasts([...newToasts]);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2 pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex items-center justify-between gap-3 rounded-lg border p-4 shadow-lg transition-all duration-300",
            t.type === "success" &&
              "border-green-500/30 bg-green-50 text-green-900 dark:bg-green-950/80 dark:text-green-200",
            t.type === "error" &&
              "border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/20",
            t.type === "info" && "border-border bg-card text-card-foreground"
          )}
        >
          <div className="flex items-center gap-2">
            {t.type === "success" && (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
            )}
            {t.type === "error" && <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />}
            {t.type === "info" && <Info className="h-4 w-4 shrink-0 text-primary" />}
            <span className="text-sm font-medium">{t.message}</span>
          </div>
          <button
            type="button"
            aria-label="Close notification"
            onClick={() => removeToast(t.id)}
            className="rounded p-0.5 opacity-70 hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
