import type { ResumeContent, ResumeDesign } from "~/lib/schemas/resume";
import { BasicPreview } from "./BasicPreview";

export interface ResumePreviewProps {
  content: ResumeContent;
  design?: ResumeDesign;
  templateId?: string;
  className?: string;
}

/**
 * Temporary preview abstraction for Phase 5.
 * Behind this interface: <ResumePreview content design templateId />.
 * Phase 6 will swap in the dynamic template registry without requiring editor changes.
 */
export function ResumePreview({
  content,
  design,
  templateId,
  className,
}: ResumePreviewProps) {
  return (
    <BasicPreview
      content={content}
      design={design}
      templateId={templateId}
      className={className}
    />
  );
}
