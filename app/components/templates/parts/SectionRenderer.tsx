import React from "react";
import type { ResumeContent, ResumeDesign } from "~/lib/schemas/resume";
import { SECTION_REGISTRY, type StandardSectionId } from "~/lib/resume/section-registry";
import { ItemDate } from "./ItemDate";
import { BulletList } from "./BulletList";
import { SkillList } from "./SkillList";
import { sanitizeHref, formatLinkDisplay } from "~/lib/resume/sanitize-link";

export interface SectionRendererProps {
  sectionKey: string;
  content: ResumeContent;
  design: ResumeDesign;
  renderHeader: (title: string, sectionKey: string) => React.ReactNode;
  className?: string;
  itemSpacingClassName?: string;
}

export function SectionRenderer({
  sectionKey,
  content,
  design,
  renderHeader,
  className = "",
  itemSpacingClassName = "space-y-3",
}: SectionRendererProps) {
  // Check if section is explicitly hidden
  if (content.hiddenSections?.includes(sectionKey)) {
    return null;
  }

  // Handle Standard Sections
  switch (sectionKey) {
    case "summary": {
      const summaryText = content.summary?.trim();
      if (!summaryText) return null;
      return (
        <section
          key="summary"
          aria-label={SECTION_REGISTRY.summary.label}
          className={`resume-section break-inside-avoid ${className}`}
        >
          {renderHeader(SECTION_REGISTRY.summary.label, "summary")}
          <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
            {summaryText}
          </p>
        </section>
      );
    }

    case "experience": {
      const items = (content.experience || []).filter(
        (exp) => exp.company?.trim() || exp.position?.trim()
      );
      if (items.length === 0) return null;

      return (
        <section
          key="experience"
          aria-label={SECTION_REGISTRY.experience.label}
          className={`resume-section break-inside-avoid ${className}`}
        >
          {renderHeader(SECTION_REGISTRY.experience.label, "experience")}
          <div className={itemSpacingClassName}>
            {items.map((exp) => (
              <div key={exp.id} className="break-inside-avoid space-y-1">
                <div className="flex justify-between items-baseline gap-2">
                  <h3 className="text-sm font-semibold text-neutral-900">
                    {exp.position}
                    {exp.company && (
                      <span className="font-medium text-neutral-700">, {exp.company}</span>
                    )}
                  </h3>
                  <ItemDate date={exp.date} dateStyle={design.dateStyle} />
                </div>
                {exp.location && (
                  <p className="text-xs text-neutral-500">{exp.location}</p>
                )}
                {exp.description && (
                  <p className="text-sm text-neutral-700 whitespace-pre-line">{exp.description}</p>
                )}
                <BulletList bullets={exp.bullets} />
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "education": {
      const items = (content.education || []).filter(
        (edu) => edu.institution?.trim() || edu.degree?.trim()
      );
      if (items.length === 0) return null;

      return (
        <section
          key="education"
          aria-label={SECTION_REGISTRY.education.label}
          className={`resume-section break-inside-avoid ${className}`}
        >
          {renderHeader(SECTION_REGISTRY.education.label, "education")}
          <div className={itemSpacingClassName}>
            {items.map((edu) => (
              <div key={edu.id} className="break-inside-avoid space-y-1">
                <div className="flex justify-between items-baseline gap-2">
                  <h3 className="text-sm font-semibold text-neutral-900">
                    {edu.degree}
                    {edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ""}
                    {edu.institution && (
                      <span className="font-medium text-neutral-700">, {edu.institution}</span>
                    )}
                  </h3>
                  <ItemDate date={edu.date} dateStyle={design.dateStyle} />
                </div>
                <div className="flex justify-between text-xs text-neutral-500">
                  {edu.location && <span>{edu.location}</span>}
                  {edu.score && <span>GPA / Grade: {edu.score}</span>}
                </div>
                <BulletList bullets={edu.bullets} />
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "skills": {
      const skills = (content.skills || []).filter((s) => s.name?.trim());
      if (skills.length === 0) return null;

      return (
        <section
          key="skills"
          aria-label={SECTION_REGISTRY.skills.label}
          className={`resume-section break-inside-avoid ${className}`}
        >
          {renderHeader(SECTION_REGISTRY.skills.label, "skills")}
          <SkillList skills={skills} />
        </section>
      );
    }

    case "projects": {
      const items = (content.projects || []).filter((p) => p.name?.trim());
      if (items.length === 0) return null;

      return (
        <section
          key="projects"
          aria-label={SECTION_REGISTRY.projects.label}
          className={`resume-section break-inside-avoid ${className}`}
        >
          {renderHeader(SECTION_REGISTRY.projects.label, "projects")}
          <div className={itemSpacingClassName}>
            {items.map((proj) => {
              const href = sanitizeHref(proj.url);
              return (
                <div key={proj.id} className="break-inside-avoid space-y-1">
                  <div className="flex justify-between items-baseline gap-2">
                    <h3 className="text-sm font-semibold text-neutral-900 inline-flex items-center gap-2">
                      {proj.name}
                      {href && (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline font-normal"
                        >
                          ({formatLinkDisplay(proj.url || "")})
                        </a>
                      )}
                    </h3>
                    <ItemDate date={proj.date} dateStyle={design.dateStyle} />
                  </div>
                  {proj.description && (
                    <p className="text-sm text-neutral-700 whitespace-pre-line">{proj.description}</p>
                  )}
                  <BulletList bullets={proj.bullets} />
                </div>
              );
            })}
          </div>
        </section>
      );
    }

    case "certifications": {
      const items = (content.certifications || []).filter((c) => c.name?.trim());
      if (items.length === 0) return null;

      return (
        <section
          key="certifications"
          aria-label={SECTION_REGISTRY.certifications.label}
          className={`resume-section break-inside-avoid ${className}`}
        >
          {renderHeader(SECTION_REGISTRY.certifications.label, "certifications")}
          <div className={itemSpacingClassName}>
            {items.map((cert) => {
              const href = sanitizeHref(cert.url);
              return (
                <div key={cert.id} className="flex justify-between items-baseline gap-2 break-inside-avoid">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900 inline-flex items-center gap-2">
                      {cert.name}
                      {cert.issuer && <span className="font-normal text-neutral-600">— {cert.issuer}</span>}
                    </h3>
                    {href && (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs text-blue-600 hover:underline"
                      >
                        {formatLinkDisplay(cert.url || "")}
                      </a>
                    )}
                  </div>
                  <ItemDate date={cert.date} dateStyle={design.dateStyle} />
                </div>
              );
            })}
          </div>
        </section>
      );
    }

    case "awards": {
      const items = (content.awards || []).filter((a) => a.title?.trim());
      if (items.length === 0) return null;

      return (
        <section
          key="awards"
          aria-label={SECTION_REGISTRY.awards.label}
          className={`resume-section break-inside-avoid ${className}`}
        >
          {renderHeader(SECTION_REGISTRY.awards.label, "awards")}
          <div className={itemSpacingClassName}>
            {items.map((award) => (
              <div key={award.id} className="break-inside-avoid space-y-0.5">
                <div className="flex justify-between items-baseline gap-2">
                  <h3 className="text-sm font-semibold text-neutral-900">
                    {award.title}
                    {award.issuer && <span className="font-normal text-neutral-600">, {award.issuer}</span>}
                  </h3>
                  <ItemDate date={award.date} dateStyle={design.dateStyle} />
                </div>
                {award.summary && <p className="text-sm text-neutral-700">{award.summary}</p>}
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "publications": {
      const items = (content.publications || []).filter((p) => p.title?.trim());
      if (items.length === 0) return null;

      return (
        <section
          key="publications"
          aria-label={SECTION_REGISTRY.publications.label}
          className={`resume-section break-inside-avoid ${className}`}
        >
          {renderHeader(SECTION_REGISTRY.publications.label, "publications")}
          <div className={itemSpacingClassName}>
            {items.map((pub) => {
              const href = sanitizeHref(pub.url);
              return (
                <div key={pub.id} className="break-inside-avoid space-y-0.5">
                  <div className="flex justify-between items-baseline gap-2">
                    <h3 className="text-sm font-semibold text-neutral-900 inline-flex items-center gap-2">
                      {pub.title}
                      {pub.publisher && <span className="font-normal text-neutral-600">({pub.publisher})</span>}
                    </h3>
                    <ItemDate date={pub.date} dateStyle={design.dateStyle} />
                  </div>
                  {pub.summary && <p className="text-sm text-neutral-700">{pub.summary}</p>}
                  {href && (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline block"
                    >
                      {formatLinkDisplay(pub.url || "")}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      );
    }

    case "volunteering": {
      const items = (content.volunteering || []).filter((v) => v.organization?.trim() || v.role?.trim());
      if (items.length === 0) return null;

      return (
        <section
          key="volunteering"
          aria-label={SECTION_REGISTRY.volunteering.label}
          className={`resume-section break-inside-avoid ${className}`}
        >
          {renderHeader(SECTION_REGISTRY.volunteering.label, "volunteering")}
          <div className={itemSpacingClassName}>
            {items.map((vol) => (
              <div key={vol.id} className="break-inside-avoid space-y-1">
                <div className="flex justify-between items-baseline gap-2">
                  <h3 className="text-sm font-semibold text-neutral-900">
                    {vol.role}
                    {vol.organization && <span className="font-normal text-neutral-700">, {vol.organization}</span>}
                  </h3>
                  <ItemDate date={vol.date} dateStyle={design.dateStyle} />
                </div>
                {vol.summary && <p className="text-sm text-neutral-700">{vol.summary}</p>}
                <BulletList bullets={vol.bullets} />
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "languages": {
      const items = (content.languages || []).filter((l) => l.language?.trim());
      if (items.length === 0) return null;

      return (
        <section
          key="languages"
          aria-label={SECTION_REGISTRY.languages.label}
          className={`resume-section break-inside-avoid ${className}`}
        >
          {renderHeader(SECTION_REGISTRY.languages.label, "languages")}
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1 list-none p-0 m-0">
            {items.map((lang) => (
              <li key={lang.id} className="text-sm flex justify-between">
                <span className="font-medium text-neutral-800">{lang.language}</span>
                <span className="text-neutral-500 text-xs">{lang.proficiency}</span>
              </li>
            ))}
          </ul>
        </section>
      );
    }

    case "interests": {
      const items = (content.interests || []).filter((i) => i.name?.trim());
      if (items.length === 0) return null;

      return (
        <section
          key="interests"
          aria-label={SECTION_REGISTRY.interests.label}
          className={`resume-section break-inside-avoid ${className}`}
        >
          {renderHeader(SECTION_REGISTRY.interests.label, "interests")}
          <p className="text-sm text-neutral-700">
            {items.map((item, idx) => (
              <span key={item.id}>
                {item.name}
                {idx < items.length - 1 ? " • " : ""}
              </span>
            ))}
          </p>
        </section>
      );
    }

    case "references": {
      const items = (content.references || []).filter((r) => r.name?.trim() || r.reference?.trim());
      if (items.length === 0) return null;

      return (
        <section
          key="references"
          aria-label={SECTION_REGISTRY.references.label}
          className={`resume-section break-inside-avoid ${className}`}
        >
          {renderHeader(SECTION_REGISTRY.references.label, "references")}
          <div className={itemSpacingClassName}>
            {items.map((ref) => (
              <div key={ref.id} className="break-inside-avoid space-y-0.5">
                <h3 className="text-sm font-semibold text-neutral-900">{ref.name}</h3>
                <p className="text-sm text-neutral-700 italic">{ref.reference}</p>
                {ref.contact && <p className="text-xs text-neutral-500">{ref.contact}</p>}
              </div>
            ))}
          </div>
        </section>
      );
    }

    default: {
      // Custom section lookup
      const customSection = (content.customSections || []).find((c) => c.id === sectionKey);
      if (!customSection) return null;

      const items = (customSection.items || []).filter((i) => i.title?.trim());
      if (items.length === 0) return null;

      return (
        <section
          key={customSection.id}
          aria-label={customSection.title}
          className={`resume-section break-inside-avoid ${className}`}
        >
          {renderHeader(customSection.title, customSection.id)}
          <div className={itemSpacingClassName}>
            {items.map((item) => (
              <div key={item.id} className="break-inside-avoid space-y-1">
                <div className="flex justify-between items-baseline gap-2">
                  <h3 className="text-sm font-semibold text-neutral-900">
                    {item.title}
                    {item.subtitle && <span className="font-normal text-neutral-600">, {item.subtitle}</span>}
                  </h3>
                  <ItemDate date={item.date} dateStyle={design.dateStyle} />
                </div>
                {item.description && (
                  <p className="text-sm text-neutral-700 whitespace-pre-line">{item.description}</p>
                )}
                <BulletList bullets={item.bullets} />
              </div>
            ))}
          </div>
        </section>
      );
    }
  }
}
