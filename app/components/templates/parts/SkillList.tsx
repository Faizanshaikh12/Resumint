import type { SkillItem } from "~/lib/schemas/resume";

export interface SkillListProps {
  skills?: SkillItem[];
  variant?: "tags" | "inline" | "grouped";
  className?: string;
  tagClassName?: string;
}

export function SkillList({
  skills,
  variant = "tags",
  className = "",
  tagClassName = "",
}: SkillListProps) {
  if (!skills || skills.length === 0) return null;

  const validSkills = skills.filter((s) => s && s.name && s.name.trim().length > 0);
  if (validSkills.length === 0) return null;

  // Group by category if available
  const hasCategories = validSkills.some((s) => s.category && s.category.trim().length > 0);

  if (variant === "grouped" || hasCategories) {
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
      <div className={`space-y-2 ${className}`}>
        {Array.from(categories.entries()).map(([category, items]) => (
          <div key={category} className="text-sm">
            <span className="font-semibold text-neutral-800">{category}: </span>
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
          <div className="text-sm">
            {categories.size > 0 && <span className="font-semibold text-neutral-800">Other: </span>}
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

  if (variant === "inline") {
    return (
      <p className={`text-sm text-neutral-700 leading-relaxed ${className}`}>
        {validSkills.map((s, idx) => (
          <span key={s.id}>
            <span className="font-medium text-neutral-800">{s.name}</span>
            {s.level ? ` (${s.level})` : ""}
            {idx < validSkills.length - 1 ? " • " : ""}
          </span>
        ))}
      </p>
    );
  }

  // Default: semantic tags
  return (
    <ul className={`flex flex-wrap gap-1.5 list-none p-0 m-0 ${className}`}>
      {validSkills.map((skill) => (
        <li
          key={skill.id}
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-800 border border-neutral-200 ${tagClassName}`}
        >
          <span>{skill.name}</span>
          {skill.level && (
            <span className="ml-1 text-[10px] text-neutral-500 font-normal">({skill.level})</span>
          )}
        </li>
      ))}
    </ul>
  );
}
