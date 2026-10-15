import React from "react";
import type { HeaderVariantProps } from "./StandardHeader";
import { LinkList } from "../../parts/LinkList";

export function CenteredHeader({ personal, design, className = "" }: HeaderVariantProps) {
  if (!personal) return null;

  const name = personal.name?.trim();
  const title = personal.title?.trim();

  if (!name && !title && !personal.email && !personal.phone && !personal.location && (!personal.links || personal.links.length === 0)) {
    return null;
  }

  return (
    <header className={`break-inside-avoid text-center pb-3 border-b border-neutral-300 ${className}`}>
      {name && (
        <h1 className="text-2xl font-bold tracking-tight text-neutral-950 font-serif">
          {name}
        </h1>
      )}
      {title && (
        <p
          className="text-xs uppercase tracking-widest font-medium mt-1"
          style={{ color: "var(--accent, #1e3a8a)" }}
        >
          {title}
        </p>
      )}

      {/* Contact info strip */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-2 text-xs text-neutral-600">
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
        <div className="mt-2 flex justify-center">
          <LinkList links={personal.links} showIcons={design.showIcons} className="justify-center" />
        </div>
      )}
    </header>
  );
}
