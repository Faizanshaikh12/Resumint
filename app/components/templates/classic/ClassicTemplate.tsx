import React from "react";
import type { ResumeContent, ResumeDesign } from "~/lib/schemas/resume";
import { LinkList } from "../parts/LinkList";
import { SectionRenderer } from "../parts/SectionRenderer";
import type { TemplateProps } from "../modern/ModernTemplate";

export function ClassicTemplate({ content, design }: TemplateProps) {
  const { personal, sectionOrder = [] } = content;
  const isCentered = design.headerAlign === "center";

  return (
    <div className="resume-paper classic-template space-y-4">
      {/* Header */}
      <header className={`break-inside-avoid pb-2 border-b-2 border-neutral-900 ${isCentered ? "text-center" : "text-left"}`}>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 uppercase">
          {personal?.name || "Your Name"}
        </h1>
        {personal?.title && (
          <p className="text-sm font-semibold text-neutral-700 mt-0.5">
            {personal.title}
          </p>
        )}

        {/* Contact info */}
        <div
          className={`flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-neutral-700 font-medium ${
            isCentered ? "justify-center" : "justify-start"
          }`}
        >
          {personal?.email && (
            <a href={`mailto:${personal.email}`} className="hover:underline">
              {personal.email}
            </a>
          )}
          {personal?.phone && (
            <>
              {personal?.email && <span aria-hidden="true">•</span>}
              <a href={`tel:${personal.phone.replace(/\s+/g, "")}`} className="hover:underline">
                {personal.phone}
              </a>
            </>
          )}
          {personal?.location && (
            <>
              {(personal?.email || personal?.phone) && <span aria-hidden="true">•</span>}
              <span>{personal.location}</span>
            </>
          )}
        </div>

        {/* Links */}
        {personal?.links && personal.links.length > 0 && (
          <div className={`mt-1.5 ${isCentered ? "flex justify-center" : ""}`}>
            <LinkList
              links={personal.links}
              showIcons={design.showIcons}
              className={isCentered ? "justify-center" : "justify-start"}
            />
          </div>
        )}
      </header>

      {/* Sections */}
      <div className="space-y-4">
        {sectionOrder.map((sectionKey) => (
          <SectionRenderer
            key={sectionKey}
            sectionKey={sectionKey}
            content={content}
            design={design}
            renderHeader={(title) => (
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 pb-0.5 mb-2 border-b-2 border-neutral-900">
                {title}
              </h2>
            )}
          />
        ))}
      </div>
    </div>
  );
}
