import React from "react";
import type { ResumeContent, ResumeDesign } from "~/lib/schemas/resume";
import { LinkList } from "../parts/LinkList";
import { SectionRenderer } from "../parts/SectionRenderer";

export interface TemplateProps {
  content: ResumeContent;
  design: ResumeDesign;
}

export function ModernTemplate({ content, design }: TemplateProps) {
  const { personal, sectionOrder = [] } = content;
  const isCentered = design.headerAlign === "center";

  return (
    <div className="resume-paper modern-template space-y-5">
      {/* Header */}
      <header className={`break-inside-avoid ${isCentered ? "text-center" : "text-left"}`}>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-950">
          {personal?.name || "Your Name"}
        </h1>
        {personal?.title && (
          <p
            className="text-base font-semibold mt-0.5"
            style={{ color: "var(--accent, #2563eb)" }}
          >
            {personal.title}
          </p>
        )}

        {/* Contact info */}
        <div
          className={`flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-neutral-600 ${
            isCentered ? "justify-center" : "justify-start"
          }`}
        >
          {personal?.email && (
            <a
              href={`mailto:${personal.email}`}
              className="hover:underline text-neutral-700"
            >
              {personal.email}
            </a>
          )}
          {personal?.phone && (
            <>
              {personal?.email && <span aria-hidden="true">•</span>}
              <a
                href={`tel:${personal.phone.replace(/\s+/g, "")}`}
                className="hover:underline text-neutral-700"
              >
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
          <div className={`mt-2 ${isCentered ? "flex justify-center" : ""}`}>
            <LinkList
              links={personal.links}
              showIcons={design.showIcons}
              className={isCentered ? "justify-center" : "justify-start"}
            />
          </div>
        )}
      </header>

      {/* Sections in user-specified order */}
      <div className="space-y-4">
        {sectionOrder.map((sectionKey) => (
          <SectionRenderer
            key={sectionKey}
            sectionKey={sectionKey}
            content={content}
            design={design}
            renderHeader={(title) => (
              <h2
                className="text-xs font-bold uppercase tracking-wider pb-1 mb-2.5 border-b border-neutral-200"
                style={{ color: "var(--accent, #2563eb)" }}
              >
                {title}
              </h2>
            )}
          />
        ))}
      </div>
    </div>
  );
}
