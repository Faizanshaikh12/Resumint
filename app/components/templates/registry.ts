import React from "react";
import type { ResumeContent, ResumeDesign, TemplateId } from "~/lib/schemas/resume";
import { TEMPLATE_SEED_DATA } from "~/db/seed/templates";
import { GenericResumeRenderer } from "./generic/GenericResumeRenderer";
import { resolveTemplateDesign } from "~/lib/resume/template-adapter";

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  description: string;
  tier: "basic" | "standard" | "premium";
  atsNotes: string;
  supports: {
    columns: (1 | 2)[];
    headerAlign: ("left" | "center" | "right")[];
  };
  defaultDesign: Partial<ResumeDesign>;
  Component: React.ComponentType<{ content: ResumeContent; design: ResumeDesign }>;
}

function createTemplateComponent(templateKey: TemplateId) {
  const Component = function BoundTemplateComponent({
    content,
    design,
  }: {
    content: ResumeContent;
    design: ResumeDesign;
  }) {
    const resolved = resolveTemplateDesign(templateKey, design);
    return React.createElement(GenericResumeRenderer, { content, design: resolved });
  };
  Component.displayName = `Template_${templateKey}`;
  return Component;
}

export const TEMPLATES = Object.fromEntries(
  TEMPLATE_SEED_DATA.map((seed) => [
    seed.key as TemplateId,
    {
      id: seed.key as TemplateId,
      name: seed.name,
      description: seed.description,
      tier: seed.tier,
      atsNotes:
        seed.layout.columns === 2
          ? "Linear DOM reading order maintained even in 2-column mode via accessible CSS grid."
          : "100% ATS-friendly single-column layout with strict semantic heading hierarchy.",
      supports: {
        columns: (seed.layout.columns === 2 ? [1, 2] : [1]) as (1 | 2)[],
        headerAlign: ["left", "center"],
      },
      defaultDesign: {
        accentColor: seed.design.accentColor,
        fontFamily: seed.design.fontKey as any,
        fontScale: seed.design.fontScale,
        lineSpacing: seed.design.lineSpacing,
        pageMargin: seed.design.pageMargin,
        sectionSpacing: seed.design.sectionSpacing,
        pageSize: seed.design.pageSize,
        columns: seed.layout.columns,
        headerAlign: seed.design.headerAlign,
        dateStyle: seed.design.dateStyle,
        showIcons: seed.design.showIcons,
        headerVariant: seed.layout.headerVariant,
        sidebarSections: seed.layout.sidebarSections,
        sidebarPosition: seed.layout.sidebarPosition,
        sectionHeadingVariant: seed.layout.sectionHeadingVariant,
        itemVariant: seed.layout.itemVariant,
        skillsVariant: seed.layout.skillsVariant,
      },
      Component: createTemplateComponent(seed.key as TemplateId),
    } satisfies TemplateDefinition,
  ])
) as Record<TemplateId, TemplateDefinition>;

export const DEFAULT_TEMPLATE_ID: TemplateId = "modern";

/**
 * Resolves a template definition by ID with fallback to the default template ("modern").
 */
export function getTemplate(templateId?: string | null): TemplateDefinition {
  if (templateId && templateId in TEMPLATES) {
    return TEMPLATES[templateId as TemplateId];
  }
  return TEMPLATES[DEFAULT_TEMPLATE_ID];
}

/**
 * Returns all registered templates as an ordered array.
 */
export function getAllTemplates(): TemplateDefinition[] {
  return TEMPLATE_SEED_DATA.map((seed) => TEMPLATES[seed.key as TemplateId]);
}
