import React, { useCallback } from "react";
import { Download, FileDown, FileText, Copy, Printer, FileJson } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "~/components/ui/dropdown-menu";
import { toast } from "~/components/ui/sonner";
import type { ResumeContent, ResumeDesign, TemplateId } from "~/lib/schemas/resume";
import { buildFilename } from "~/lib/export/filename";
import { exportResumeJson } from "~/lib/export/json";
import { exportResumeText } from "~/lib/export/text";
import { downloadText, copyToClipboard } from "~/lib/export/download";
import { usePrintResume } from "~/lib/export/usePrintResume";
import { PrintHintDialog } from "./PrintHintDialog";

export interface ExportMenuProps {
  content: ResumeContent;
  design?: ResumeDesign;
  templateId?: TemplateId;
  title: string;
  triggerButtonVariant?: "default" | "outline" | "ghost" | "secondary";
  triggerButtonSize?: "default" | "sm" | "lg";
  className?: string;
}

export function ExportMenu({
  content,
  design,
  templateId,
  title,
  triggerButtonVariant = "outline",
  triggerButtonSize = "sm",
  className = "",
}: ExportMenuProps) {
  const {
    isPrinting,
    showHintDialog,
    setShowHintDialog,
    dontShowAgain,
    setDontShowAgain,
    triggerPrint,
    confirmPrint,
  } = usePrintResume({
    content,
    design,
    title,
  });

  const handleDownloadPdf = useCallback(() => {
    triggerPrint();
  }, [triggerPrint]);

  const handleDownloadJson = useCallback(() => {
    try {
      const filename = buildFilename({
        name: content.personal?.fullName,
        title,
        ext: "json",
      });
      const jsonText = exportResumeJson({
        title,
        templateId: templateId || "modern",
        content,
        design,
      });
      downloadText(filename, "application/json", jsonText);
      toast.success("Resume JSON backup exported");
    } catch (err: any) {
      toast.error("Failed to export JSON: " + (err?.message || "Unknown error"));
    }
  }, [content, design, templateId, title]);

  const handleDownloadText = useCallback(() => {
    try {
      const filename = buildFilename({
        name: content.personal?.fullName,
        title,
        ext: "txt",
      });
      const text = exportResumeText(content, {
        sectionOrder: design?.sectionOrder,
        hiddenSections: design?.hiddenSections,
      });
      downloadText(filename, "text/plain", text);
      toast.success("Plain text resume exported");
    } catch (err: any) {
      toast.error("Failed to export text: " + (err?.message || "Unknown error"));
    }
  }, [content, design, title]);

  const handleCopyText = useCallback(async () => {
    try {
      const text = exportResumeText(content, {
        sectionOrder: design?.sectionOrder,
        hiddenSections: design?.hiddenSections,
      });
      await copyToClipboard(text);
    } catch (err: any) {
      toast.error("Failed to copy text: " + (err?.message || "Unknown error"));
    }
  }, [content, design]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={`inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 text-xs gap-2 ${className}`}
          aria-label="Export options menu"
          data-testid="export-menu-trigger"
          disabled={isPrinting}
        >
          <Download className="h-4 w-4" />
          <span>Export</span>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56 p-1.5" data-testid="export-menu-content">
          <DropdownMenuItem
            onClick={handleDownloadPdf}
            className="gap-2.5 py-2 cursor-pointer font-medium"
            data-testid="export-pdf-item"
          >
            <Printer className="h-4 w-4 text-primary" />
            <div className="flex flex-col">
              <span>Download PDF</span>
              <span className="text-[11px] text-muted-foreground font-normal">
                Print-ready ATS format
              </span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleDownloadJson}
            className="gap-2.5 py-2 cursor-pointer"
            data-testid="export-json-item"
          >
            <FileJson className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <div className="flex flex-col">
              <span>Download JSON</span>
              <span className="text-[11px] text-muted-foreground font-normal">
                Complete editable backup
              </span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleDownloadText}
            className="gap-2.5 py-2 cursor-pointer"
            data-testid="export-text-item"
          >
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <div className="flex flex-col">
              <span>Download Plain Text</span>
              <span className="text-[11px] text-muted-foreground font-normal">
                Standard .txt document
              </span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => void handleCopyText()}
            className="gap-2.5 py-2 cursor-pointer"
            data-testid="copy-text-item"
          >
            <Copy className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <div className="flex flex-col">
              <span>Copy as Text</span>
              <span className="text-[11px] text-muted-foreground font-normal">
                Copy directly to clipboard
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* One-time save as PDF hint instructions */}
      <PrintHintDialog
        open={showHintDialog}
        onOpenChange={setShowHintDialog}
        dontShowAgain={dontShowAgain}
        onDontShowAgainChange={setDontShowAgain}
        onConfirm={() => void confirmPrint()}
      />
    </>
  );
}
