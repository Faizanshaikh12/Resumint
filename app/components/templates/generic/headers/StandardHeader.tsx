import React from "react";
import type { PersonalInfo, ResumeDesign } from "~/lib/schemas/resume";
import { LinkList } from "../../parts/LinkList";

export interface HeaderVariantProps {
  personal?: PersonalInfo;
  design: ResumeDesign;
  className?: string;
}

export function StandardHeader({ personal, design, className = "" }: HeaderVariantProps) {
  if (!personal) return null;

  const isCentered = design.headerAlign === "center";
  const name = personal.name?.trim();
  const title = personal.title?.trim();

  // If blank resume, render nothing
  if (!name && !title && !personal.email && !personal.phone && !personal.location && (!personal.links || personal.links.length === 0)) {
    return null;
  }

  return (
    <header className={`break-inside-avoid ${isCentered ? "text-center" : "text-left"} ${className}`}>
      {name && (
        <h1 className="text-2xl font-bold tracking-tight text-neutral-950">
          {name}
        </h1>
      )}
      {title && (
        <p
          className="text-base font-semibold mt-0.5"
          style={{ color: "var(--accent, #2563eb)" }}
        >
          {title}
        </p>
      )}

      {/* Contact info strip */}
      <div
        className={`flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-neutral-600 ${
          isCentered ? "justify-center" : "justify-start"
        }`}
      >
        {personal.email && (
          <a
            href={`mailto:${personal.email}`}
            className="hover:underline text-neutral-700"
          >
            {personal.email}
          </a>
        )}
        {personal.phone && (
          <>
            {personal.email && <span aria-hidden="true">•</span>}
            <a
              href={`tel:${personal.phone.replace(/\s+/g, "")}`}
              className="hover:underline text-neutral-700"
            >
              {personal.phone}
            </a>
          </>
        )}
        {personal.location && (
          <>
            {(personal.email || personal.phone) && <span aria-hidden="true">•</span>}
            <span>{personal.location}</span>
          </>
        )}
      </div>

      {/* Links */}
      {personal.links && personal.links.length > 0 && (
        <div className={`mt-2 ${isCentered ? "flex justify-center" : ""}`}>
          <LinkList
            links={personal.links}
            showIcons={design.showIcons}
            className={isCentered ? "justify-center" : "justify-start"}
          />
        </div>
      )}
    </header>
  );
}
