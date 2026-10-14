import React from "react";
import type { ResumeDesign } from "~/lib/schemas/resume";

export interface PrintRootProps {
  children?: React.ReactNode;
  design?: ResumeDesign;
}

/**
 * PrintRoot wraps the resume preview with dynamic paged media styles (@page size)
 * and root print container semantics.
 */
export function PrintRoot({ children, design }: PrintRootProps) {
  const isLetter = design?.pageSize === "Letter";
  const pageSizeCss = isLetter ? "8.5in 11in" : "210mm 297mm";

  return (
    <div id="resumint-print-root" className="w-full flex justify-center">
      <style
        dangerouslySetInnerHTML={{
          __html: `@page { size: ${pageSizeCss}; margin: 0; }`,
        }}
      />
      {children}
    </div>
  );
}
