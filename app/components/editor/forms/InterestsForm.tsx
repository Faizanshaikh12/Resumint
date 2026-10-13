import * as React from "react";
import { Plus, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { createDefaultInterestItem } from "~/lib/resume/section-registry";
import { useEditor } from "../EditorContext";

export function InterestsForm() {
  const { content, dispatch } = useEditor();
  const items = content.interests || [];
  const [inputValue, setInputValue] = React.useState("");

  const handleAdd = (rawName: string) => {
    const trimmed = rawName.trim();
    if (!trimmed || items.length >= 30) return;

    const names = trimmed
      .split(",")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    for (const name of names) {
      if (items.length >= 30) break;
      const newItem = createDefaultInterestItem(name);
      dispatch({
        type: "ADD_ITEM",
        section: "interests",
        item: newItem as any,
      });
    }

    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAdd(inputValue);
    }
  };

  const handleRemove = (id: string) => {
    dispatch({
      type: "REMOVE_ITEM",
      section: "interests",
      itemId: id,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Interests & Hobbies</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add personal passions, sports, or creative activities that showcase well-roundedness.
          </p>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {items.length} / 30
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type an interest and press Enter (e.g. Open Source, Marathons)..."
          maxLength={100}
          className="h-9 text-xs"
          disabled={items.length >= 30}
        />
        <Button
          type="button"
          onClick={() => handleAdd(inputValue)}
          disabled={!inputValue.trim() || items.length >= 30}
          size="sm"
          className="h-9 text-xs gap-1.5 shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add</span>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1 text-xs border border-border"
          >
            <span className="font-medium text-secondary-foreground">{item.name}</span>
            <button
              type="button"
              onClick={() => handleRemove(item.id)}
              aria-label={`Remove interest ${item.name}`}
              className="text-muted-foreground hover:text-destructive rounded-full p-0.5 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
