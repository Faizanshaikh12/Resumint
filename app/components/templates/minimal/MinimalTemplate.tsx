import React from "react";
import type { ResumeContent, ResumeDesign } from "~/lib/schemas/resume";
import { LinkList } from "../parts/LinkList";
import { SectionRenderer } from "../parts/SectionRenderer";
import type { TemplateProps } from "../modern/ModernTemplate";

export function MinimalTemplate({ content, design }: TemplateProps) {
  const { personal, sectionOrder = [] } = content;
  const isCentered = design.headerAlign === "center";

  return (
    <div className="resume-paper minimal-template space-y-6">
      {/* Header */}
      <header className={`break-inside-avoid ${isCentered ? "text-center" : "text-left"}`}>
        <h1 className="text-2xl font-light tracking-wide text-neutral-900">
          {personal?.name || "Your Name"}
        </h1>
        {personal?.title && (
          <p className="text-sm tracking-wider uppercase text-neutral-500 font-medium mt-1">
            {personal.title}
          </p>
        )}

        {/* Contact info */}
        <div
          className={`flex flex-wrap gap-x-4 gap-y-1 mt-2.5 text-xs text-neutral-600 font-light ${
            isCentered ? "justify-center" : "justify-start"
          }`}
        >
          {personal?.email && (
            <a href={`mailto:${personal.email}`} className="hover:text-black">
              {personal.email}
            </a>
          )}
          {personal?.phone && (
            <>
              {personal?.email && <span aria-hidden="true" className="text-neutral-300">/</span>}
              <a href={`tel:${personal.phone.replace(/\s+/g, "")}`} className="hover:text-black">
                {personal.phone}
              </a>
            </>
          )}
          {personal?.location && (
            <>
              {(personal?.email || personal?.phone) && (
                <span aria-hidden="true" className="text-neutral-300">/</span>
              )}
              <span>{personal.location}</span>
            </>
          )}
        </div>

        {/* Links */}
        {personal?.links && personal.links.length > 0 && (
          <div className={`mt-2 ${isCentered ? "flex justify-center" : ""}`}>
            <LinkList
              links={personal.links}
              showIcons={design.showIcons}
              className={isCentered ? "justify-center" : "justify-start"}
            />
          </div>
        )}
      </header>

      {/* Sections */}
      <div className="space-y-5">
        {sectionOrder.map((sectionKey) => (
          <SectionRenderer
            key={sectionKey}
            sectionKey={sectionKey}
            content={content}
            design={design}
            renderHeader={(title) => (
              <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-800 pb-1 mb-2 border-b border-neutral-300">
                {title}
              </h2>
            )}
          />
        ))}
      </div>
    </div>
  );
}
