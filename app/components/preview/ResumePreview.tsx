import React, { useEffect, useRef, useState, useMemo } from "react";
import type { ResumeContent, ResumeDesign } from "~/lib/schemas/resume";
import { getTemplate } from "../templates/registry";
import { normalizeDesign } from "~/lib/resume/normalize-design";
import { generateDesignTokens, PAGE_DIMENSIONS } from "~/lib/resume/design-tokens";
import { ResumeErrorBoundary } from "./ResumeErrorBoundary";
import { AlertCircle } from "lucide-react";

export interface ResumePreviewProps {
  content: ResumeContent;
  design?: ResumeDesign;
  templateId?: string;
  className?: string;
  showGuides?: boolean;
  onPageCountChange?: (count: number) => void;
}

export function ResumePreview({
  content,
  design,
  templateId,
  className = "",
  showGuides = true,
  onPageCountChange,
}: ResumePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);
  const [paperHeight, setPaperHeight] = useState(0);

  // 1. Resolve template & normalized design
  const template = useMemo(() => getTemplate(templateId), [templateId]);
  const normalizedDesign = useMemo(
    () => normalizeDesign(design, template.supports),
    [design, template.supports]
  );
  const tokens = useMemo(
    () => generateDesignTokens(normalizedDesign),
    [normalizedDesign]
  );

  const isLetter = normalizedDesign.pageSize === "Letter";
  const standardPageHeightPx = isLetter
    ? PAGE_DIMENSIONS.Letter.heightPx
    : PAGE_DIMENSIONS.A4.heightPx;
  const standardPageWidthPx = isLetter
    ? PAGE_DIMENSIONS.Letter.widthPx
    : PAGE_DIMENSIONS.A4.widthPx;

  // 2. Responsive scaling based on container width via ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;

    const updateScale = () => {
      const containerWidth = container.clientWidth;
      if (containerWidth > 0) {
        // Leave 16px buffer
        const availableWidth = Math.max(280, containerWidth - 16);
        const newScale = Math.min(1, availableWidth / standardPageWidthPx);
        setScale(newScale);
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);

    return () => observer.disconnect();
  }, [standardPageWidthPx]);

  // 3. Measure content height for page breaks
  useEffect(() => {
    const paper = paperRef.current;
    if (!paper || typeof ResizeObserver === "undefined") return;

    const updateHeight = () => {
      setPaperHeight(paper.scrollHeight);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(paper);

    return () => observer.disconnect();
  }, [content, normalizedDesign]);

  const pageCount = Math.max(1, Math.ceil(paperHeight / standardPageHeightPx));
  const hasPageOverflowWarning = pageCount > 2;

  useEffect(() => {
    onPageCountChange?.(pageCount);
  }, [pageCount, onPageCountChange]);

  // Render guides for each multiple of standard page height
  const guides = [];
  if (showGuides && pageCount > 1) {
    for (let i = 1; i < pageCount; i++) {
      guides.push(
        <div
          key={i}
          className="page-break-guide"
          style={{ top: `${i * standardPageHeightPx}px` }}
          aria-hidden="true"
        >
          <span className="page-break-badge">Page {i + 1}</span>
        </div>
      );
    }
  }

  const TemplateComponent = template.Component;

  return (
    <ResumeErrorBoundary>
      <div
        ref={containerRef}
        className={`w-full flex flex-col items-center relative ${className}`}
      >
        {/* Page status header */}
        {showGuides && (
          <div className="w-full max-w-[210mm] flex items-center justify-between py-1.5 px-3 mb-2 text-xs text-neutral-600 bg-neutral-100 rounded-md border border-neutral-200 no-print">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-neutral-800">
                Pages: {pageCount}
              </span>
              <span className="text-[11px] text-neutral-500">
                ({normalizedDesign.pageSize})
              </span>
            </div>
            {hasPageOverflowWarning && (
              <div className="flex items-center gap-1.5 text-amber-700 font-medium text-[11px]">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Most recruiters prefer 1-2 pages</span>
              </div>
            )}
          </div>
        )}

        {/* Scaled paper viewport container */}
        <div
          className="w-full flex justify-center overflow-visible resume-preview-viewport"
          style={{
            height: scale < 1 && paperHeight > 0 ? `${paperHeight * scale}px` : "auto",
          }}
        >
          <div
            className="resume-preview-scaler"
            style={{
              transform: scale < 1 ? `scale(${scale})` : undefined,
              transformOrigin: "top center",
              width: `${standardPageWidthPx}px`,
            }}
          >
            <div
              ref={paperRef}
              className="resume-paper relative mx-auto"
              style={tokens as unknown as React.CSSProperties}
              data-testid="resume-preview-document"
              data-template-id={template.id}
            >
              {guides}
              <TemplateComponent content={content} design={normalizedDesign} />
            </div>
          </div>
        </div>
      </div>
    </ResumeErrorBoundary>
  );
}
