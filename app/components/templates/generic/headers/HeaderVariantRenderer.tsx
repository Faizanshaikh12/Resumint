import React from "react";
import type { PersonalInfo, ResumeDesign } from "~/lib/schemas/resume";
import { StandardHeader } from "./StandardHeader";
import { CenteredHeader } from "./CenteredHeader";
import { BannerHeader } from "./BannerHeader";
import { CompactHeader } from "./CompactHeader";

export interface HeaderVariantRendererProps {
  personal?: PersonalInfo;
  design: ResumeDesign;
  className?: string;
}

export function HeaderVariantRenderer({ personal, design, className }: HeaderVariantRendererProps) {
  const variant = design.headerVariant ?? "standard";

  switch (variant) {
    case "centered":
      return <CenteredHeader personal={personal} design={design} className={className} />;
    case "banner":
      return <BannerHeader personal={personal} design={design} className={className} />;
    case "compact":
      return <CompactHeader personal={personal} design={design} className={className} />;
    case "standard":
    default:
      return <StandardHeader personal={personal} design={design} className={className} />;
  }
}
