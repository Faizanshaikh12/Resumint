import React from "react";
import type { ResumeContent, ResumeDesign } from "~/lib/schemas/resume";
import { getFontFamilyStack } from "~/lib/resume/fonts";
import { HeaderVariantRenderer } from "./headers/HeaderVariantRenderer";
import { SectionHeadingRenderer } from "./headings/SectionHeadingRenderer";
import { SkillsVariantRenderer } from "./skills/SkillsVariantRenderer";
import { SectionRenderer } from "../parts/SectionRenderer";

export interface GenericResumeRendererProps {
  content: ResumeContent;
  design: ResumeDesign;
  className?: string;
  style?: React.CSSProperties;
}

export function isBlankResume(content?: ResumeContent | null): boolean {
  if (!content) return true;

  const hasPersonal = Boolean(
    content.personal?.name?.trim() ||
    content.personal?.title?.trim() ||
    content.personal?.email?.trim() ||
    content.personal?.phone?.trim() ||
    content.personal?.location?.trim() ||
    (content.personal?.links && content.personal.links.length > 0)
  );
  const hasSummary = Boolean(content.summary?.trim());
  const hasExperience = (content.experience || []).some((e) => e.company?.trim() || e.position?.trim());
  const hasEducation = (content.education || []).some((e) => e.institution?.trim() || e.degree?.trim());
  const hasSkills = (content.skills || []).some((s) => s.name?.trim());
  const hasProjects = (content.projects || []).some((p) => p.name?.trim());
  const hasCertifications = (content.certifications || []).some((c) => c.name?.trim());
  const hasAwards = (content.awards || []).some((a) => a.title?.trim());
  const hasPublications = (content.publications || []).some((p) => p.title?.trim());
  const hasVolunteering = (content.volunteering || []).some((v) => v.organization?.trim() || v.role?.trim());
  const hasInterests = (content.interests || []).some((i) => i.name?.trim());
  const hasReferences = (content.references || []).some((r) => r.name?.trim());
  const hasCustom = (content.customSections || []).some((c) => c.items && c.items.length > 0);

  return !(
    hasPersonal ||
    hasSummary ||
    hasExperience ||
    hasEducation ||
    hasSkills ||
    hasProjects ||
    hasCertifications ||
    hasAwards ||
    hasPublications ||
    hasVolunteering ||
    hasInterests ||
    hasReferences ||
    hasCustom
  );
}

export function GenericResumeRenderer({
  content,
  design,
  className = "",
  style = {},
}: GenericResumeRendererProps) {
  const fontKey = (design as unknown as { fontKey?: string }).fontKey || design.fontFamily;
  const fontStack = getFontFamilyStack(fontKey);

  const cssVariables = {
    "--accent": design.accentColor || "#2563eb",
    "--font": fontStack,
    "--scale": design.fontScale ?? 1.0,
    "--line": design.lineSpacing ?? 1.3,
    "--margin": `${design.pageMargin ?? 16}mm`,
    "--gap": `${design.sectionSpacing ?? 16}mm`,
    "--page-width": design.pageSize === "Letter" ? "215.9mm" : "210mm",
    "--page-height": design.pageSize === "Letter" ? "279.4mm" : "297mm",
    "--primary-text": design.primaryTextColor || "#111827",
    "--secondary-text": design.secondaryTextColor || "#4b5563",
    "--bg-color": design.backgroundColor || "#ffffff",
    ...style,
  } as React.CSSProperties;

  // Blank resume check: produce a clean white sheet with zero placeholder strings
  if (isBlankResume(content)) {
    return (
      <div
        className={`resume-paper generic-resume-renderer blank-resume ${className}`}
        style={cssVariables}
        data-testid="blank-resume-canvas"
      />
    );
  }

  const isTwoColumn = design.columns === 2;
  const configuredSidebar = design.sidebarSections && design.sidebarSections.length > 0
    ? design.sidebarSections
    : ["skills", "languages", "certifications", "interests"];
  const sidebarSet = new Set(configuredSidebar);
  const sidebarPosition = design.sidebarPosition || "right";

  const sectionOrder = content.sectionOrder || [
    "summary",
    "experience",
    "education",
    "skills",
    "projects",
    "certifications",
  ];

  const mainSections = isTwoColumn
    ? sectionOrder.filter((key) => !sidebarSet.has(key))
    : sectionOrder;
  const sidebarSections = isTwoColumn
    ? sectionOrder.filter((key) => sidebarSet.has(key))
    : [];

  const renderHeading = (title: string, sectionKey: string) => (
    <SectionHeadingRenderer
      title={title}
      sectionKey={sectionKey}
      design={design}
    />
  );

  const renderSkills = (skills: typeof content.skills) => (
    <SkillsVariantRenderer skills={skills} design={design} />
  );

  return (
    <div
      className={`resume-paper generic-resume-renderer space-y-4 ${className}`}
      style={cssVariables}
    >
      {/* Dynamic Header */}
      <HeaderVariantRenderer personal={content.personal} design={design} />

      {/* Main Body */}
      {isTwoColumn ? (
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 items-start ${sidebarPosition === "left" ? "md:grid-flow-dense" : ""}`}>
          {/* Main Column (Col 1-2 visually, always first in semantic DOM order for ATS) */}
          <div className={`md:col-span-2 space-y-4 ${sidebarPosition === "left" ? "md:col-start-2" : ""}`}>
            {mainSections.map((sectionKey) => (
              <SectionRenderer
                key={sectionKey}
                sectionKey={sectionKey}
                content={content}
                design={design}
                renderHeader={renderHeading}
                renderSkills={renderSkills}
              />
            ))}
          </div>

          {/* Sidebar Column (Col 3 or Col 1 visually, following main column in semantic DOM) */}
          <aside className={`resume-sidebar md:col-span-1 space-y-4 ${sidebarPosition === "left" ? "md:col-start-1" : ""}`}>
            {sidebarSections.map((sectionKey) => (
              <SectionRenderer
                key={sectionKey}
                sectionKey={sectionKey}
                content={content}
                design={design}
                renderHeader={renderHeading}
                renderSkills={renderSkills}
              />
            ))}
          </aside>
        </div>
      ) : (
        <div className="space-y-4">
          {mainSections.map((sectionKey) => (
            <SectionRenderer
              key={sectionKey}
              sectionKey={sectionKey}
              content={content}
              design={design}
              renderHeader={renderHeading}
              renderSkills={renderSkills}
            />
          ))}
        </div>
      )}
    </div>
  );
}
