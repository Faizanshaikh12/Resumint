import React from "react";
import type { SkillItem, ResumeDesign } from "~/lib/schemas/resume";

export interface SkillsVariantRendererProps {
  skills?: SkillItem[];
  design: ResumeDesign;
  className?: string;
}

export function SkillsVariantRenderer({ skills, design, className = "" }: SkillsVariantRendererProps) {
  if (!skills || skills.length === 0) return null;

  const validSkills = skills.filter((s) => s && s.name && s.name.trim().length > 0);
  if (validSkills.length === 0) return null;

  const variant = design.skillsVariant ?? "tags";

  if (variant === "categorical-list") {
    const categories = new Map<string, SkillItem[]>();
    const uncategorized: SkillItem[] = [];

    for (const skill of validSkills) {
      const cat = skill.category?.trim();
      if (cat) {
        if (!categories.has(cat)) categories.set(cat, []);
        categories.get(cat)!.push(skill);
      } else {
        uncategorized.push(skill);
      }
    }

    return (
      <div className={`space-y-1.5 ${className}`}>
        {Array.from(categories.entries()).map(([category, items]) => (
          <div key={category} className="text-xs">
            <span className="font-semibold text-neutral-900">{category}: </span>
            <span className="text-neutral-700">
              {items.map((item, idx) => (
                <span key={item.id}>
                  {item.name}
                  {item.level ? ` (${item.level})` : ""}
                  {idx < items.length - 1 ? ", " : ""}
                </span>
              ))}
            </span>
          </div>
        ))}
        {uncategorized.length > 0 && (
          <div className="text-xs">
            {categories.size > 0 && <span className="font-semibold text-neutral-900">Other: </span>}
            <span className="text-neutral-700">
              {uncategorized.map((item, idx) => (
                <span key={item.id}>
                  {item.name}
                  {item.level ? ` (${item.level})` : ""}
                  {idx < uncategorized.length - 1 ? ", " : ""}
                </span>
              ))}
            </span>
          </div>
        )}
      </div>
    );
  }

  if (variant === "inline-comma") {
    return (
      <p className={`text-xs text-neutral-700 leading-relaxed ${className}`}>
        {validSkills.map((s, idx) => (
          <span key={s.id}>
            {s.name}
            {s.level ? ` (${s.level})` : ""}
            {idx < validSkills.length - 1 ? ", " : ""}
          </span>
        ))}
      </p>
    );
  }

  if (variant === "pills") {
    return (
      <div className={`flex flex-wrap gap-1.5 ${className}`}>
        {validSkills.map((s) => (
          <span
            key={s.id}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-neutral-200 bg-neutral-50 text-neutral-800"
          >
            {s.name}
            {s.level && <span className="ml-1 text-neutral-400 font-normal">· {s.level}</span>}
          </span>
        ))}
      </div>
    );
  }

  // "tags" default
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {validSkills.map((s) => (
        <span
          key={s.id}
          className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-neutral-100 text-neutral-800 font-medium"
        >
          {s.name}
          {s.level && <span className="ml-1 text-neutral-400 font-normal">· {s.level}</span>}
        </span>
      ))}
    </div>
  );
}
