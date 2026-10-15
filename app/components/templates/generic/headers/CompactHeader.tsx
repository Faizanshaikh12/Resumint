import React from "react";
import type { HeaderVariantProps } from "./StandardHeader";
import { LinkList } from "../../parts/LinkList";

export function CompactHeader({ personal, design, className = "" }: HeaderVariantProps) {
  if (!personal) return null;

  const isCentered = design.headerAlign === "center";
  const name = personal.name?.trim();
  const title = personal.title?.trim();

  if (!name && !title && !personal.email && !personal.phone && !personal.location && (!personal.links || personal.links.length === 0)) {
    return null;
  }

  return (
    <header className={`break-inside-avoid pb-2 border-b border-neutral-200 ${isCentered ? "text-center" : "text-left"} ${className}`}>
      <div className={`flex flex-wrap items-baseline gap-x-3 ${isCentered ? "justify-center" : "justify-between"}`}>
        {name && (
          <h1 className="text-xl font-bold tracking-tight text-neutral-950">
            {name}
          </h1>
        )}
        {title && (
          <p
            className="text-xs font-semibold tracking-wide"
            style={{ color: "var(--accent, #0f172a)" }}
          >
            {title}
          </p>
        )}
      </div>

      {/* Inline compact metadata */}
      <div
        className={`flex flex-wrap gap-x-2.5 gap-y-0.5 mt-1 text-[11px] text-neutral-600 ${
          isCentered ? "justify-center" : "justify-start"
        }`}
      >
        {personal.email && (
          <a href={`mailto:${personal.email}`} className="hover:underline text-neutral-700">
            {personal.email}
          </a>
        )}
        {personal.phone && (
          <>
            {personal.email && <span aria-hidden="true">•</span>}
            <a href={`tel:${personal.phone.replace(/\s+/g, "")}`} className="hover:underline text-neutral-700">
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
        <div className={`mt-1 ${isCentered ? "flex justify-center" : ""}`}>
          <LinkList
            links={personal.links}
            showIcons={design.showIcons}
            className={`text-[11px] ${isCentered ? "justify-center" : "justify-start"}`}
          />
        </div>
      )}
    </header>
  );
}
