import React from "react";
import type { ResumeDesign } from "~/lib/schemas/resume";

export interface SectionHeadingProps {
  title: string;
  sectionKey?: string;
  design: ResumeDesign;
  className?: string;
}

export function SectionHeadingRenderer({ title, sectionKey, design, className = "" }: SectionHeadingProps) {
  const variant = design.sectionHeadingVariant ?? "underlined";

  switch (variant) {
    case "accent-pill":
      return (
        <h2
          data-section-key={sectionKey}
          className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded inline-block mb-2.5 text-white ${className}`}
          style={{ backgroundColor: "var(--accent, #2563eb)" }}
        >
          {title}
        </h2>
      );

    case "small-caps":
      return (
        <h2
          data-section-key={sectionKey}
          className={`text-xs font-bold uppercase tracking-widest text-neutral-900 pb-1 mb-2.5 border-b border-neutral-300 ${className}`}
          style={{ color: "var(--accent, #92400e)" }}
        >
          {title}
        </h2>
      );

    case "left-rule":
      return (
        <h2
          data-section-key={sectionKey}
          className={`text-sm font-bold tracking-tight text-neutral-950 pl-2.5 mb-2.5 border-l-[3px] ${className}`}
          style={{ borderColor: "var(--accent, #7c3aed)" }}
        >
          {title}
        </h2>
      );

    case "minimal":
      return (
        <h2
          data-section-key={sectionKey}
          className={`text-xs font-bold uppercase tracking-widest text-neutral-900 mb-2 ${className}`}
        >
          {title}
        </h2>
      );

    case "underlined":
    default:
      return (
        <h2
          data-section-key={sectionKey}
          className={`text-sm font-bold tracking-tight pb-1 mb-2.5 border-b border-neutral-200 ${className}`}
          style={{ color: "var(--accent, #2563eb)" }}
        >
          {title}
        </h2>
      );
  }
}
