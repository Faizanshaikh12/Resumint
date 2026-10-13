import { Plus, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { createDefaultLanguageItem } from "~/lib/resume/section-registry";
import { useEditor } from "../EditorContext";

export function LanguagesForm() {
  const { content, dispatch } = useEditor();
  const items = content.languages || [];

  const handleUpdate = (id: string, field: "language" | "proficiency", value: string) => {
    dispatch({
      type: "UPDATE_FIELD",
      section: "languages",
      itemId: id,
      field,
      value,
    });
  };

  const handleAdd = () => {
    if (items.length >= 20) return;
    const newItem = createDefaultLanguageItem();
    dispatch({
      type: "ADD_ITEM",
      section: "languages",
      item: newItem as any,
    });
  };

  const handleRemove = (id: string) => {
    dispatch({
      type: "REMOVE_ITEM",
      section: "languages",
      itemId: id,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Languages</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add languages you speak and your level of proficiency.
          </p>
        </div>
        {items.length < 20 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            className="text-xs h-8 gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Language</span>
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={item.id} className="flex items-center gap-2">
            <Input
              value={item.language}
              onChange={(e) => handleUpdate(item.id, "language", e.target.value)}
              placeholder="e.g. English / Spanish / Japanese"
              aria-label={`Language ${idx + 1}`}
              maxLength={100}
              className="h-9 text-xs flex-1"
            />
            <select
              value={item.proficiency || "Native / Fluent"}
              onChange={(e) => handleUpdate(item.id, "proficiency", e.target.value)}
              aria-label={`Proficiency for ${item.language || `Language ${idx + 1}`}`}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="Native / Bilingual">Native / Bilingual</option>
              <option value="Native / Fluent">Native / Fluent</option>
              <option value="Professional Working">Professional Working</option>
              <option value="Conversational">Conversational</option>
              <option value="Elementary">Elementary</option>
            </select>
            <button
              type="button"
              onClick={() => handleRemove(item.id)}
              aria-label={`Delete language ${item.language || idx + 1}`}
              className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
