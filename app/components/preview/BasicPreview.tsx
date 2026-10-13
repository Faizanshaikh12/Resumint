import * as React from "react";
import { formatDateRange } from "~/lib/resume/dates";
import type { ResumeContent, ResumeDesign } from "~/lib/schemas/resume";

export interface BasicPreviewProps {
  content: ResumeContent;
  design?: ResumeDesign;
  templateId?: string;
  className?: string;
}

export function BasicPreview({ content, design, className = "" }: BasicPreviewProps) {
  const { personal, summary, customSections, sectionOrder, hiddenSections } = content;
  const hiddenSet = React.useMemo(() => new Set(hiddenSections || []), [hiddenSections]);

  const activeSections = React.useMemo(() => {
    return (sectionOrder || []).filter((id) => !hiddenSet.has(id));
  }, [sectionOrder, hiddenSet]);

  const accentColor = design?.accentColor || "#2563eb";

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "summary": {
        if (!summary || !summary.trim()) return null;
        return (
          <section key="summary" className="mb-5" aria-label="Professional Summary">
            <h2
              className="text-xs font-bold uppercase tracking-wider border-b pb-1 mb-2"
              style={{ color: accentColor, borderColor: `${accentColor}40` }}
            >
              Professional Summary
            </h2>
            <p className="text-xs text-stone-700 leading-relaxed whitespace-pre-line">{summary}</p>
          </section>
        );
      }

      case "experience": {
        const items = content.experience || [];
        if (items.length === 0) return null;
        return (
          <section key="experience" className="mb-5" aria-label="Work Experience">
            <h2
              className="text-xs font-bold uppercase tracking-wider border-b pb-1 mb-2"
              style={{ color: accentColor, borderColor: `${accentColor}40` }}
            >
              Work Experience
            </h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-stone-900">
                      {item.position || "Position"}{" "}
                      {item.company && <span className="font-normal text-stone-600">&bull; {item.company}</span>}
                    </span>
                    <span className="text-[11px] text-stone-500 font-mono">
                      {formatDateRange(item.date)}
                    </span>
                  </div>
                  {item.location && (
                    <div className="text-[11px] text-stone-500 mb-1">{item.location}</div>
                  )}
                  {item.description && (
                    <p className="text-stone-700 mt-1 mb-1 leading-relaxed">{item.description}</p>
                  )}
                  {item.bullets && item.bullets.length > 0 && (
                    <ul className="list-disc list-outside ml-4 space-y-0.5 text-stone-700 mt-1">
                      {item.bullets.map((b, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      }

      case "education": {
        const items = content.education || [];
        if (items.length === 0) return null;
        return (
          <section key="education" className="mb-5" aria-label="Education">
            <h2
              className="text-xs font-bold uppercase tracking-wider border-b pb-1 mb-2"
              style={{ color: accentColor, borderColor: `${accentColor}40` }}
            >
              Education
            </h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-stone-900">
                      {item.degree || "Degree"}{" "}
                      {item.fieldOfStudy && (
                        <span className="font-normal text-stone-600">in {item.fieldOfStudy}</span>
                      )}
                    </span>
                    <span className="text-[11px] text-stone-500 font-mono">
                      {formatDateRange(item.date)}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-600">
                    {item.institution}
                    {item.location && ` &bull; ${item.location}`}
                    {item.score && ` &bull; GPA / Score: ${item.score}`}
                  </div>
                  {item.bullets && item.bullets.length > 0 && (
                    <ul className="list-disc list-outside ml-4 space-y-0.5 text-stone-700 mt-1">
                      {item.bullets.map((b, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      }

      case "skills": {
        const items = content.skills || [];
        if (items.length === 0) return null;
        return (
          <section key="skills" className="mb-5" aria-label="Skills">
            <h2
              className="text-xs font-bold uppercase tracking-wider border-b pb-1 mb-2"
              style={{ color: accentColor, borderColor: `${accentColor}40` }}
            >
              Skills
            </h2>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {items.map((item) => (
                <span
                  key={item.id}
                  className="inline-flex items-center rounded bg-stone-100 text-stone-800 px-2 py-0.5 text-[11px] font-medium border border-stone-200"
                >
                  {item.name}
                  {item.level && <span className="text-stone-400 ml-1">({item.level})</span>}
                </span>
              ))}
            </div>
          </section>
        );
      }

      case "languages": {
        const items = content.languages || [];
        if (items.length === 0) return null;
        return (
          <section key="languages" className="mb-5" aria-label="Languages">
            <h2
              className="text-xs font-bold uppercase tracking-wider border-b pb-1 mb-2"
              style={{ color: accentColor, borderColor: `${accentColor}40` }}
            >
              Languages
            </h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {items.map((item) => (
                <div key={item.id} className="text-stone-800">
                  <span className="font-medium">{item.language}</span>
                  {item.proficiency && (
                    <span className="text-stone-500 text-[11px]"> ({item.proficiency})</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      }

      case "projects": {
        const items = content.projects || [];
        if (items.length === 0) return null;
        return (
          <section key="projects" className="mb-5" aria-label="Projects">
            <h2
              className="text-xs font-bold uppercase tracking-wider border-b pb-1 mb-2"
              style={{ color: accentColor, borderColor: `${accentColor}40` }}
            >
              Projects
            </h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-stone-900">
                      {item.name}
                      {item.url && (
                        <span className="font-normal text-[11px] text-stone-500 ml-2">
                          {item.url}
                        </span>
                      )}
                    </span>
                    {item.date && (item.date.start || item.date.end) && (
                      <span className="text-[11px] text-stone-500 font-mono">
                        {item.date.start} {item.date.end && `– ${item.date.end}`}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-stone-700 mt-0.5 leading-relaxed">{item.description}</p>
                  )}
                  {item.bullets && item.bullets.length > 0 && (
                    <ul className="list-disc list-outside ml-4 space-y-0.5 text-stone-700 mt-1">
                      {item.bullets.map((b, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      }

      case "certifications": {
        const items = content.certifications || [];
        if (items.length === 0) return null;
        return (
          <section key="certifications" className="mb-5" aria-label="Certifications">
            <h2
              className="text-xs font-bold uppercase tracking-wider border-b pb-1 mb-2"
              style={{ color: accentColor, borderColor: `${accentColor}40` }}
            >
              Certifications
            </h2>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="text-xs flex justify-between items-baseline">
                  <div>
                    <span className="font-semibold text-stone-900">{item.name}</span>
                    {item.issuer && <span className="text-stone-600"> &bull; {item.issuer}</span>}
                  </div>
                  {item.date && <span className="text-[11px] text-stone-500 font-mono">{item.date}</span>}
                </div>
              ))}
            </div>
          </section>
        );
      }

      case "awards": {
        const items = content.awards || [];
        if (items.length === 0) return null;
        return (
          <section key="awards" className="mb-5" aria-label="Awards & Honors">
            <h2
              className="text-xs font-bold uppercase tracking-wider border-b pb-1 mb-2"
              style={{ color: accentColor, borderColor: `${accentColor}40` }}
            >
              Awards & Honors
            </h2>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-stone-900">
                      {item.title} {item.issuer && <span className="font-normal text-stone-600">&bull; {item.issuer}</span>}
                    </span>
                    {item.date && <span className="text-[11px] text-stone-500 font-mono">{item.date}</span>}
                  </div>
                  {item.summary && <p className="text-stone-700 mt-0.5">{item.summary}</p>}
                </div>
              ))}
            </div>
          </section>
        );
      }

      case "publications": {
        const items = content.publications || [];
        if (items.length === 0) return null;
        return (
          <section key="publications" className="mb-5" aria-label="Publications">
            <h2
              className="text-xs font-bold uppercase tracking-wider border-b pb-1 mb-2"
              style={{ color: accentColor, borderColor: `${accentColor}40` }}
            >
              Publications
            </h2>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-stone-900">
                      {item.title} {item.publisher && <span className="font-normal text-stone-600">&bull; {item.publisher}</span>}
                    </span>
                    {item.date && <span className="text-[11px] text-stone-500 font-mono">{item.date}</span>}
                  </div>
                  {item.summary && <p className="text-stone-700 mt-0.5">{item.summary}</p>}
                </div>
              ))}
            </div>
          </section>
        );
      }

      case "volunteering": {
        const items = content.volunteering || [];
        if (items.length === 0) return null;
        return (
          <section key="volunteering" className="mb-5" aria-label="Volunteering">
            <h2
              className="text-xs font-bold uppercase tracking-wider border-b pb-1 mb-2"
              style={{ color: accentColor, borderColor: `${accentColor}40` }}
            >
              Volunteering
            </h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-stone-900">
                      {item.role} &bull; {item.organization}
                    </span>
                    <span className="text-[11px] text-stone-500 font-mono">
                      {formatDateRange(item.date)}
                    </span>
                  </div>
                  {item.summary && <p className="text-stone-700 mt-0.5">{item.summary}</p>}
                  {item.bullets && item.bullets.length > 0 && (
                    <ul className="list-disc list-outside ml-4 space-y-0.5 text-stone-700 mt-1">
                      {item.bullets.map((b, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      }

      case "interests": {
        const items = content.interests || [];
        if (items.length === 0) return null;
        return (
          <section key="interests" className="mb-5" aria-label="Interests">
            <h2
              className="text-xs font-bold uppercase tracking-wider border-b pb-1 mb-2"
              style={{ color: accentColor, borderColor: `${accentColor}40` }}
            >
              Interests
            </h2>
            <p className="text-xs text-stone-700">
              {items.map((item) => item.name).filter(Boolean).join(" &bull; ")}
            </p>
          </section>
        );
      }

      case "references": {
        const items = content.references || [];
        if (items.length === 0) return null;
        return (
          <section key="references" className="mb-5" aria-label="References">
            <h2
              className="text-xs font-bold uppercase tracking-wider border-b pb-1 mb-2"
              style={{ color: accentColor, borderColor: `${accentColor}40` }}
            >
              References
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {items.map((item) => (
                <div key={item.id} className="border-l-2 pl-2 border-stone-200">
                  <div className="font-semibold text-stone-900">{item.name}</div>
                  <div className="text-stone-600">{item.reference}</div>
                  {item.contact && <div className="text-[11px] text-stone-500">{item.contact}</div>}
                </div>
              ))}
            </div>
          </section>
        );
      }

      default: {
        // Custom sections
        const customSec = (customSections || []).find((s) => s.id === sectionId);
        if (!customSec || !customSec.items || customSec.items.length === 0) return null;

        return (
          <section key={customSec.id} className="mb-5" aria-label={customSec.title}>
            <h2
              className="text-xs font-bold uppercase tracking-wider border-b pb-1 mb-2"
              style={{ color: accentColor, borderColor: `${accentColor}40` }}
            >
              {customSec.title}
            </h2>
            <div className="space-y-3">
              {customSec.items.map((item) => (
                <div key={item.id} className="text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-stone-900">
                      {item.title}{" "}
                      {item.subtitle && (
                        <span className="font-normal text-stone-600">&bull; {item.subtitle}</span>
                      )}
                    </span>
                    {item.date && (
                      <span className="text-[11px] text-stone-500 font-mono">{item.date}</span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-stone-700 mt-0.5 leading-relaxed">{item.description}</p>
                  )}
                  {item.bullets && item.bullets.length > 0 && (
                    <ul className="list-disc list-outside ml-4 space-y-0.5 text-stone-700 mt-1">
                      {item.bullets.map((b, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      }
    }
  };

  return (
    <div
      className={`bg-white text-stone-900 shadow-xl mx-auto rounded border border-stone-200 p-8 sm:p-12 w-full max-w-[210mm] min-h-[297mm] transition-all font-sans ${className}`}
      style={{ aspectRatio: "210 / 297" }}
      data-testid="resume-preview-document"
    >
      {/* Header: Personal Info */}
      <header className="border-b pb-4 mb-6 border-stone-200">
        <h1 className="text-2xl font-bold tracking-tight text-stone-950">
          {personal?.name || "Your Name"}
        </h1>
        {personal?.title && (
          <p className="text-sm font-medium mt-0.5" style={{ color: accentColor }}>
            {personal.title}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600 mt-2">
          {personal?.email && <span>{personal.email}</span>}
          {personal?.phone && (
            <>
              {personal.email && <span>&bull;</span>}
              <span>{personal.phone}</span>
            </>
          )}
          {personal?.location && (
            <>
              {(personal.email || personal.phone) && <span>&bull;</span>}
              <span>{personal.location}</span>
            </>
          )}
          {personal?.links &&
            personal.links.map((link) => (
              <React.Fragment key={link.id}>
                <span>&bull;</span>
                <span className="font-medium text-stone-700">{link.label || link.url}</span>
              </React.Fragment>
            ))}
        </div>
      </header>

      {/* Sections in dynamic sectionOrder */}
      <main>{activeSections.map((secId) => renderSection(secId))}</main>
    </div>
  );
}
