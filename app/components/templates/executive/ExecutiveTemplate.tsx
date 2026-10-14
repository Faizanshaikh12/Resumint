import React from "react";
import type { ResumeContent, ResumeDesign } from "~/lib/schemas/resume";
import { LinkList } from "../parts/LinkList";
import { SectionRenderer } from "../parts/SectionRenderer";
import type { TemplateProps } from "../modern/ModernTemplate";

export function ExecutiveTemplate({ content, design }: TemplateProps) {
  const { personal, sectionOrder = [] } = content;
  const isCentered = design.headerAlign !== "left"; // Default centered for executive

  return (
    <div className="resume-paper executive-template space-y-5 font-serif">
      {/* Header */}
      <header className={`break-inside-avoid ${isCentered ? "text-center" : "text-left"}`}>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 font-serif">
          {personal?.name || "Your Name"}
        </h1>
        {personal?.title && (
          <p
            className="text-sm font-semibold tracking-wide uppercase mt-1"
            style={{ color: "var(--accent, #1e3a8a)" }}
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
            <a href={`mailto:${personal.email}`} className="hover:underline text-neutral-800">
              {personal.email}
            </a>
          )}
          {personal?.phone && (
            <>
              {personal?.email && <span aria-hidden="true">|</span>}
              <a href={`tel:${personal.phone.replace(/\s+/g, "")}`} className="hover:underline text-neutral-800">
                {personal.phone}
              </a>
            </>
          )}
          {personal?.location && (
            <>
              {(personal?.email || personal?.phone) && <span aria-hidden="true">|</span>}
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

        {/* Subtle decorative divider under header */}
        <div className="mt-3 border-b-2 border-neutral-800" />
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
              <div className="flex items-center gap-3 mb-2.5">
                <h2
                  className="text-xs font-bold uppercase tracking-widest shrink-0"
                  style={{ color: "var(--accent, #1e3a8a)" }}
                >
                  {title}
                </h2>
                <div className="h-px bg-neutral-300 w-full" />
              </div>
            )}
          />
        ))}
      </div>
    </div>
  );
}
