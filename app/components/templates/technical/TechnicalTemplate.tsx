import React from "react";
import type { ResumeContent, ResumeDesign } from "~/lib/schemas/resume";
import { LinkList } from "../parts/LinkList";
import { SectionRenderer } from "../parts/SectionRenderer";
import type { TemplateProps } from "../modern/ModernTemplate";

const SIDEBAR_SECTIONS = new Set([
  "skills",
  "languages",
  "certifications",
  "awards",
  "publications",
  "interests",
  "references",
]);

export function TechnicalTemplate({ content, design }: TemplateProps) {
  const { personal, sectionOrder = [] } = content;
  const isCentered = design.headerAlign === "center";
  const isTwoColumn = design.columns === 2;

  const mainSections = sectionOrder.filter((key) => !SIDEBAR_SECTIONS.has(key));
  const sidebarSections = sectionOrder.filter((key) => SIDEBAR_SECTIONS.has(key));

  return (
    <div className="resume-paper technical-template space-y-4 font-mono-subtle text-neutral-800">
      {/* Header */}
      <header
        className={`break-inside-avoid pb-3 border-b border-neutral-200 ${
          isCentered ? "text-center" : "text-left"
        }`}
      >
        <h1 className="text-2xl font-bold tracking-tight text-neutral-950 font-sans">
          {personal?.name || "Your Name"}
        </h1>
        {personal?.title && (
          <p
            className="text-sm font-semibold tracking-wide font-sans mt-0.5"
            style={{ color: "var(--accent, #0284c7)" }}
          >
            {personal.title}
          </p>
        )}

        {/* Contact info */}
        <div
          className={`flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-neutral-600 font-sans ${
            isCentered ? "justify-center" : "justify-start"
          }`}
        >
          {personal?.email && (
            <a href={`mailto:${personal.email}`} className="hover:underline text-neutral-700">
              {personal.email}
            </a>
          )}
          {personal?.phone && (
            <>
              {personal?.email && <span aria-hidden="true">•</span>}
              <a href={`tel:${personal.phone.replace(/\s+/g, "")}`} className="hover:underline text-neutral-700">
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
          <div className={`mt-2 font-sans ${isCentered ? "flex justify-center" : ""}`}>
            <LinkList
              links={personal.links}
              showIcons={design.showIcons}
              className={isCentered ? "justify-center" : "justify-start"}
            />
          </div>
        )}
      </header>

      {/* Body: 1 Column or 2 Column with linear reading order */}
      {isTwoColumn ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Main Column (Col 1-2): Summary, Experience, Projects, Education */}
          <div className="md:col-span-2 space-y-4">
            {mainSections.map((sectionKey) => (
              <SectionRenderer
                key={sectionKey}
                sectionKey={sectionKey}
                content={content}
                design={design}
                renderHeader={(title) => (
                  <h2
                    className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b border-neutral-200"
                    style={{ color: "var(--accent, #0284c7)" }}
                  >
                    {title}
                  </h2>
                )}
              />
            ))}
          </div>

          {/* Sidebar Column (Col 3): Skills, Languages, Certifications, etc. */}
          <aside className="md:col-span-1 space-y-4">
            {sidebarSections.map((sectionKey) => (
              <SectionRenderer
                key={sectionKey}
                sectionKey={sectionKey}
                content={content}
                design={design}
                renderHeader={(title) => (
                  <h2
                    className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b border-neutral-200"
                    style={{ color: "var(--accent, #0284c7)" }}
                  >
                    {title}
                  </h2>
                )}
              />
            ))}
          </aside>
        </div>
      ) : (
        <div className="space-y-4">
          {sectionOrder.map((sectionKey) => (
            <SectionRenderer
              key={sectionKey}
              sectionKey={sectionKey}
              content={content}
              design={design}
              renderHeader={(title) => (
                <h2
                  className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b border-neutral-200"
                  style={{ color: "var(--accent, #0284c7)" }}
                >
                  {title}
                </h2>
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
