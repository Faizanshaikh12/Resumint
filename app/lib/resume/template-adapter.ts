import { TEMPLATE_SEED_DATA } from "~/db/seed/templates";
import type { ResumeDesign } from "~/lib/schemas/resume";
import type { TemplateKey, TemplateMasterRow } from "~/lib/schemas/template";

export const DEFAULT_TEMPLATE_KEY: TemplateKey = "modern";

export function getTemplateSeedRow(key?: string | null): TemplateMasterRow {
  if (key) {
    const match = TEMPLATE_SEED_DATA.find((t) => t.key === key && t.isActive);
    if (match) return match;
  }
  const defaultRow = TEMPLATE_SEED_DATA.find((t) => t.key === DEFAULT_TEMPLATE_KEY);
  if (!defaultRow) {
    throw new Error(`Default template '${DEFAULT_TEMPLATE_KEY}' not found in seed data`);
  }
  return defaultRow;
}

export function resolveTemplateDesign(
  templateKey?: string | null,
  userDesign: Partial<ResumeDesign> = {}
): ResumeDesign {
  const seedRow = getTemplateSeedRow(templateKey);

  // Template defaults derived from DB master tokens and layout variants
  const templateDefaults: ResumeDesign = {
    accentColor: seedRow.design.accentColor,
    fontFamily: seedRow.design.fontKey as any,
    fontScale: seedRow.design.fontScale,
    lineSpacing: seedRow.design.lineSpacing,
    pageMargin: seedRow.design.pageMargin,
    sectionSpacing: seedRow.design.sectionSpacing,
    pageSize: seedRow.design.pageSize,
    columns: seedRow.layout.columns,
    headerAlign: seedRow.design.headerAlign,
    dateStyle: seedRow.design.dateStyle,
    showIcons: seedRow.design.showIcons,
    headerVariant: seedRow.layout.headerVariant,
    sidebarSections: seedRow.layout.sidebarSections,
    sidebarPosition: seedRow.layout.sidebarPosition,
    sectionHeadingVariant: seedRow.layout.sectionHeadingVariant,
    itemVariant: seedRow.layout.itemVariant,
    skillsVariant: seedRow.layout.skillsVariant,
    primaryTextColor: seedRow.design.primaryTextColor,
    secondaryTextColor: seedRow.design.secondaryTextColor,
    backgroundColor: seedRow.design.backgroundColor,
  };

  // Merge: template defaults base + user explicit customizations overlay
  return {
    ...templateDefaults,
    ...userDesign,
    // Preserve layout variants from template if not explicitly specified in userDesign
    columns: userDesign.columns ?? templateDefaults.columns,
    headerVariant: userDesign.headerVariant ?? templateDefaults.headerVariant,
    sidebarSections:
      userDesign.sidebarSections && userDesign.sidebarSections.length > 0
        ? userDesign.sidebarSections
        : templateDefaults.sidebarSections,
    sidebarPosition: userDesign.sidebarPosition ?? templateDefaults.sidebarPosition,
    sectionHeadingVariant: userDesign.sectionHeadingVariant ?? templateDefaults.sectionHeadingVariant,
    itemVariant: userDesign.itemVariant ?? templateDefaults.itemVariant,
    skillsVariant: userDesign.skillsVariant ?? templateDefaults.skillsVariant,
  };
}
