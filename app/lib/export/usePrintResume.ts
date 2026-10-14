import { useState, useCallback, useEffect } from "react";
import type { ResumeContent, ResumeDesign } from "~/lib/schemas/resume";
import { buildFilename } from "./filename";
import { printResume } from "./print";

export const PRINT_HINT_STORAGE_KEY = "resumint_hide_print_hint";

export interface UsePrintResumeProps {
  content: ResumeContent;
  design?: ResumeDesign;
  title: string;
}

export interface UsePrintResumeReturn {
  isPrinting: boolean;
  showHintDialog: boolean;
  setShowHintDialog: (show: boolean) => void;
  dontShowAgain: boolean;
  setDontShowAgain: (val: boolean) => void;
  filename: string;
  triggerPrint: () => void;
  confirmPrint: () => Promise<boolean>;
}

export function usePrintResume({
  content,
  title,
}: UsePrintResumeProps): UsePrintResumeReturn {
  const [isPrinting, setIsPrinting] = useState(false);
  const [showHintDialog, setShowHintDialog] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Load preference on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PRINT_HINT_STORAGE_KEY);
      if (stored === "true") {
        setDontShowAgain(true);
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, []);

  const filename = buildFilename({
    name: content.personal?.fullName,
    title,
    ext: "pdf",
  });

  const performPrint = useCallback(async () => {
    setIsPrinting(true);
    try {
      return await printResume({
        filename,
        onAfterPrint: () => setIsPrinting(false),
      });
    } finally {
      setIsPrinting(false);
    }
  }, [filename]);

  const triggerPrint = useCallback(() => {
    if (dontShowAgain) {
      void performPrint();
    } else {
      setShowHintDialog(true);
    }
  }, [dontShowAgain, performPrint]);

  const confirmPrint = useCallback(async () => {
    setShowHintDialog(false);
    if (dontShowAgain) {
      try {
        localStorage.setItem(PRINT_HINT_STORAGE_KEY, "true");
      } catch {
        // Ignore storage errors
      }
    }
    return performPrint();
  }, [dontShowAgain, performPrint]);

  return {
    isPrinting,
    showHintDialog,
    setShowHintDialog,
    dontShowAgain,
    setDontShowAgain,
    filename,
    triggerPrint,
    confirmPrint,
  };
}
