import React, { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import {
  UploadCloud,
  FileJson,
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Layers,
} from "lucide-react";
import { parseResumeJson, type ExportEnvelope, MAX_EXPORT_JSON_BYTES } from "~/lib/export/json";

export interface ImportSummary {
  title: string;
  templateId: string;
  name?: string;
  sectionsCount: number;
  itemsCount: number;
  warnings?: string[];
  parsedData: ExportEnvelope;
}

export interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (envelope: ExportEnvelope) => Promise<void> | void;
  isPending?: boolean;
}

export function ImportDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: ImportDialogProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setError(null);
    setSummary(null);
    setFileName(null);
    setFileSize(null);
    setDragActive(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  };

  const processFile = async (file: File) => {
    setError(null);
    setSummary(null);
    setFileName(file.name);
    setFileSize(file.size);

    // 1. File extension validation
    if (!file.name.toLowerCase().endsWith(".json")) {
      setError("Please select a valid .json file");
      return;
    }

    // 2. Pre-parse file size cap
    if (file.size > MAX_EXPORT_JSON_BYTES) {
      setError(`File size exceeds the 220 KB maximum limit (${Math.round(file.size / 1024)} KB)`);
      return;
    }

    try {
      const text = await file.text();
      const result = parseResumeJson(text);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      const env = result.data as any;
      const content = env.content || env.resume?.content || {};
      const title = env.title || env.resume?.title || "Imported Resume";
      const templateId = env.templateId || env.resume?.templateId || "modern";
      const design = env.design || env.resume?.design;

      // Count sections and items
      const sections = [
        content.summary?.length ? 1 : 0,
        content.experience?.length ? 1 : 0,
        content.education?.length ? 1 : 0,
        content.skills?.length ? 1 : 0,
        content.languages?.length ? 1 : 0,
        content.projects?.length ? 1 : 0,
        content.certifications?.length ? 1 : 0,
        content.awards?.length ? 1 : 0,
        content.publications?.length ? 1 : 0,
        content.volunteering?.length ? 1 : 0,
        content.interests?.length ? 1 : 0,
        content.references?.length ? 1 : 0,
        content.customSections ? Object.keys(content.customSections).length : 0,
      ].reduce((acc, curr) => acc + curr, 0);

      const items =
        (content.experience?.length || 0) +
        (content.education?.length || 0) +
        (content.skills?.length || 0) +
        (content.projects?.length || 0) +
        (content.certifications?.length || 0) +
        (content.awards?.length || 0);

      setSummary({
        title,
        templateId,
        name: content.personal?.name || (content.personal as any)?.fullName,
        sectionsCount: sections,
        itemsCount: items,
        warnings: result.warnings,
        parsedData: {
          title,
          templateId,
          content,
          design,
        } as any,
      });
    } catch (err: any) {
      setError("Failed to read file: " + (err?.message || "Unknown error"));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      void processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      void processFile(e.target.files[0]);
    }
  };

  const handleConfirm = async () => {
    if (!summary || isPending) return;
    await onConfirm(summary.parsedData);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1 text-primary">
            <FileJson className="h-5 w-5" />
            <DialogTitle>Import Resume from JSON</DialogTitle>
          </div>
          <DialogDescription>
            Restore or transfer a resume backup created with Resumint.
          </DialogDescription>
        </DialogHeader>

        {/* Dropzone */}
        {!summary && (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/40"
            }`}
            data-testid="import-dropzone"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileInputChange}
              className="hidden"
              data-testid="import-file-input"
            />
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div className="text-sm font-medium text-foreground">
              Click to select or drag and drop
            </div>
            <p className="text-xs text-muted-foreground">
              Resumint JSON backup files only (up to 220 KB)
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-destructive text-xs"
            data-testid="import-error-alert"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Import Error</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Summary Card Preview */}
        {summary && (
          <div className="space-y-3" data-testid="import-summary-card">
            <div className="rounded-lg border bg-card p-4 space-y-3 shadow-xs">
              <div className="flex items-start justify-between border-b pb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-1">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Backup Verified</span>
                  </div>
                  <h4 className="font-bold text-base text-foreground truncate">
                    {summary.title}
                  </h4>
                  {summary.name && (
                    <p className="text-xs text-muted-foreground truncate">{summary.name}</p>
                  )}
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                  {summary.templateId}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  <span>
                    <strong>{summary.sectionsCount}</strong> sections
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  <span>
                    <strong>{summary.itemsCount}</strong> total items
                  </span>
                </div>
              </div>

              {summary.warnings && summary.warnings.length > 0 && (
                <div className="rounded bg-amber-500/10 border border-amber-500/20 p-2 text-[11px] text-amber-800 dark:text-amber-300">
                  {summary.warnings.map((w, idx) => (
                    <p key={idx}>{w}</p>
                  ))}
                </div>
              )}

              <div className="text-[11px] text-muted-foreground flex justify-between pt-1">
                <span className="truncate max-w-[200px]">{fileName}</span>
                {fileSize && <span>{Math.round(fileSize / 1024)} KB</span>}
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetState}
              className="text-xs text-muted-foreground w-full hover:text-foreground"
            >
              Choose a different file
            </Button>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={!summary || isPending}
            className="gap-2"
            data-testid="confirm-import-button"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Confirm Import</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
