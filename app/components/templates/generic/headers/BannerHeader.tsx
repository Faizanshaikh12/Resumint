import React from "react";
import type { HeaderVariantProps } from "./StandardHeader";
import { LinkList } from "../../parts/LinkList";

export function BannerHeader({ personal, design, className = "" }: HeaderVariantProps) {
  if (!personal) return null;

  const isCentered = design.headerAlign === "center";
  const name = personal.name?.trim();
  const title = personal.title?.trim();

  if (!name && !title && !personal.email && !personal.phone && !personal.location && (!personal.links || personal.links.length === 0)) {
    return null;
  }

  return (
    <header
      className={`break-inside-avoid p-5 rounded-md text-white mb-4 ${
        isCentered ? "text-center" : "text-left"
      } ${className}`}
      style={{ backgroundColor: "var(--accent, #7c3aed)" }}
    >
      {name && (
        <h1 className="text-2xl font-extrabold tracking-tight text-white">
          {name}
        </h1>
      )}
      {title && (
        <p className="text-sm font-medium text-white/90 mt-0.5 tracking-wide">
          {title}
        </p>
      )}

      {/* Contact info strip */}
      <div
        className={`flex flex-wrap gap-x-3 gap-y-1 mt-3 text-xs text-white/80 ${
          isCentered ? "justify-center" : "justify-start"
        }`}
      >
        {personal.email && (
          <a href={`mailto:${personal.email}`} className="hover:text-white underline-offset-2 hover:underline">
            {personal.email}
          </a>
        )}
        {personal.phone && (
          <>
            {personal.email && <span aria-hidden="true" className="opacity-60">•</span>}
            <a href={`tel:${personal.phone.replace(/\s+/g, "")}`} className="hover:text-white underline-offset-2 hover:underline">
              {personal.phone}
            </a>
          </>
        )}
        {personal.location && (
          <>
            {(personal.email || personal.phone) && <span aria-hidden="true" className="opacity-60">•</span>}
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
            className={`text-white/90 ${isCentered ? "justify-center" : "justify-start"}`}
          />
        </div>
      )}
    </header>
  );
}
