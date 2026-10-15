import { getTemplateSeedRow } from "./template-adapter";
import type { ResumeDesign, TemplateId } from "~/lib/schemas/resume";

export interface ApplyTemplateOptions {
  keepColorAndPageSize?: boolean;
}

export function applyTemplateToResume(
  currentDesign: ResumeDesign,
  targetTemplateKey: string,
  options: ApplyTemplateOptions = {}
): {
  newTemplateId: TemplateId;
  newDesign: ResumeDesign;
  previousDesign: ResumeDesign;
} {
  const seedRow = getTemplateSeedRow(targetTemplateKey);
  const previousDesign: ResumeDesign = { ...currentDesign };

  const newDesign: ResumeDesign = {
    accentColor: options.keepColorAndPageSize
      ? currentDesign.accentColor
      : seedRow.design.accentColor,
    fontFamily: seedRow.design.fontKey as any,
    fontScale: seedRow.design.fontScale,
    lineSpacing: seedRow.design.lineSpacing,
    pageMargin: seedRow.design.pageMargin,
    sectionSpacing: seedRow.design.sectionSpacing,
    pageSize: options.keepColorAndPageSize
      ? currentDesign.pageSize
      : seedRow.design.pageSize,
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

  return {
    newTemplateId: seedRow.key as TemplateId,
    newDesign,
    previousDesign,
  };
}
