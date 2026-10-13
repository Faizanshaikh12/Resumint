import * as React from "react";
import { Plus, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { createDefaultSkillItem } from "~/lib/resume/section-registry";
import { useEditor } from "../EditorContext";

export function SkillsForm() {
  const { content, dispatch } = useEditor();
  const items = content.skills || [];
  const [inputValue, setInputValue] = React.useState("");

  const handleAddSkill = (rawName: string) => {
    const trimmed = rawName.trim();
    if (!trimmed || items.length >= 50) return;

    // Split on commas if user pasted multiple skills
    const names = trimmed
      .split(",")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    for (const name of names) {
      if (items.length >= 50) break;
      const newSkill = createDefaultSkillItem(name);
      dispatch({
        type: "ADD_ITEM",
        section: "skills",
        item: newSkill as any,
      });
    }

    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddSkill(inputValue);
    }
  };

  const handleRemove = (id: string) => {
    dispatch({
      type: "REMOVE_ITEM",
      section: "skills",
      itemId: id,
    });
  };

  const handleLevelChange = (id: string, level: string) => {
    dispatch({
      type: "UPDATE_FIELD",
      section: "skills",
      itemId: id,
      field: "level",
      value: level,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Skills</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add key technical competencies, languages, frameworks, and methodologies.
          </p>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {items.length} / 50
        </span>
      </div>

      {/* Input box */}
      <div className="flex items-center gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a skill and press Enter or comma (e.g. React, TypeScript)..."
          maxLength={100}
          className="h-9 text-xs"
          disabled={items.length >= 50}
        />
        <Button
          type="button"
          onClick={() => handleAddSkill(inputValue)}
          disabled={!inputValue.trim() || items.length >= 50}
          size="sm"
          className="h-9 text-xs gap-1.5 shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add</span>
        </Button>
      </div>

      {/* Tag badges */}
      <div className="flex flex-wrap gap-2 pt-2">
        {items.map((skill) => (
          <div
            key={skill.id}
            className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1 text-xs border border-border group"
          >
            <span className="font-medium text-secondary-foreground">{skill.name}</span>

            {/* Level selector */}
            <select
              value={skill.level || ""}
              onChange={(e) => handleLevelChange(skill.id, e.target.value)}
              className="bg-transparent text-[11px] text-muted-foreground border-none focus:outline-none cursor-pointer"
              aria-label={`Proficiency level for ${skill.name}`}
            >
              <option value="">(Level)</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Expert">Expert</option>
            </select>

            <button
              type="button"
              onClick={() => handleRemove(skill.id)}
              aria-label={`Remove skill ${skill.name}`}
              className="text-muted-foreground hover:text-destructive rounded-full p-0.5 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-xs text-muted-foreground italic py-4">
            No skills added yet. Type a skill above and press Enter.
          </div>
        )}
      </div>
    </div>
  );
}
