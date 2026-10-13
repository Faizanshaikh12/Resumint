import * as React from "react";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { createDefaultCustomSectionItem } from "~/lib/resume/section-registry";
import { BulletEditor } from "../BulletEditor";
import { useEditor } from "../EditorContext";

export interface CustomSectionFormProps {
  sectionId: string;
}

export function CustomSectionForm({ sectionId }: CustomSectionFormProps) {
  const { content, dispatch, setActiveSection } = useEditor();
  const section = (content.customSections || []).find((s) => s.id === sectionId);

  const [collapsedMap, setCollapsedMap] = React.useState<Record<string, boolean>>({});

  if (!section) {
    return (
      <div className="text-sm text-muted-foreground">
        Custom section not found.
      </div>
    );
  }

  const items = section.items || [];

  const toggleCollapse = (id: string) => {
    setCollapsedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTitleChange = (newTitle: string) => {
    dispatch({
      type: "RENAME_SECTION",
      sectionId,
      title: newTitle,
    });
  };

  const handleUpdateItem = (itemId: string, field: string, value: unknown) => {
    dispatch({
      type: "UPDATE_FIELD",
      section: sectionId,
      itemId,
      field,
      value,
    });
  };

  const handleAddItem = () => {
    if (items.length >= 20) return;
    const newItem = createDefaultCustomSectionItem();
    dispatch({
      type: "ADD_ITEM",
      section: sectionId,
      item: newItem as any,
    });
  };

  const handleRemoveItem = (itemId: string) => {
    dispatch({
      type: "REMOVE_ITEM",
      section: sectionId,
      itemId,
    });
  };

  const handleMoveItem = (index: number, direction: "up" | "down") => {
    const toIndex = direction === "up" ? index - 1 : index + 1;
    if (toIndex < 0 || toIndex >= items.length) return;
    dispatch({
      type: "MOVE_ITEM",
      section: sectionId,
      fromIndex: index,
      toIndex,
    });
  };

  const handleDeleteSection = () => {
    if (window.confirm(`Are you sure you want to delete the "${section.title}" section?`)) {
      dispatch({
        type: "REMOVE_SECTION",
        sectionId,
      });
      setActiveSection("personal");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1 flex-1 max-w-sm">
          <Label htmlFor={`custom-title-${sectionId}`} className="text-xs font-semibold">
            Section Title
          </Label>
          <Input
            id={`custom-title-${sectionId}`}
            value={section.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            maxLength={100}
            className="h-9 text-sm font-semibold"
          />
        </div>

        <div className="flex items-center gap-2 pt-5">
          {items.length < 20 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              className="text-xs h-8 gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Entry</span>
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDeleteSection}
            className="text-xs h-8 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item, idx) => {
          const isCollapsed = Boolean(collapsedMap[item.id]);
          const headerSummary = item.title || `Entry #${idx + 1}`;

          return (
            <div
              key={item.id}
              className="border rounded-lg bg-card shadow-xs overflow-hidden transition-all"
            >
              <div className="flex items-center justify-between bg-muted/40 px-4 py-2.5 border-b text-xs">
                <button
                  type="button"
                  onClick={() => toggleCollapse(item.id)}
                  className="flex items-center gap-2 font-semibold text-foreground text-left flex-1 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  aria-expanded={!isCollapsed}
                >
                  {isCollapsed ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="truncate">{headerSummary}</span>
                </button>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveItem(idx, "up")}
                    aria-label={`Move ${headerSummary} up`}
                    className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === items.length - 1}
                    onClick={() => handleMoveItem(idx, "down")}
                    aria-label={`Move ${headerSummary} down`}
                    className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    aria-label={`Delete ${headerSummary}`}
                    className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors ml-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {!isCollapsed && (
                <div className="p-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor={`cust-title-${item.id}`} className="text-xs font-semibold">
                        Entry Title *
                      </Label>
                      <Input
                        id={`cust-title-${item.id}`}
                        value={item.title}
                        onChange={(e) => handleUpdateItem(item.id, "title", e.target.value)}
                        placeholder="Project / Role / Invention"
                        maxLength={150}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor={`cust-sub-${item.id}`} className="text-xs font-semibold">
                        Subtitle / Organization
                      </Label>
                      <Input
                        id={`cust-sub-${item.id}`}
                        value={item.subtitle || ""}
                        onChange={(e) => handleUpdateItem(item.id, "subtitle", e.target.value)}
                        placeholder="Company or Affiliation"
                        maxLength={150}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor={`cust-date-${item.id}`} className="text-xs font-semibold">
                        Date / Period
                      </Label>
                      <Input
                        id={`cust-date-${item.id}`}
                        value={item.date || ""}
                        onChange={(e) => handleUpdateItem(item.id, "date", e.target.value)}
                        placeholder="2022 – 2023"
                        maxLength={50}
                        className="h-8 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor={`cust-desc-${item.id}`} className="text-xs font-semibold">
                        Description
                      </Label>
                      <textarea
                        id={`cust-desc-${item.id}`}
                        value={item.description || ""}
                        maxLength={2000}
                        onChange={(e) => handleUpdateItem(item.id, "description", e.target.value)}
                        placeholder="Brief overview..."
                        rows={2}
                        className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-xs shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                  </div>

                  <BulletEditor
                    bullets={item.bullets || []}
                    maxBullets={15}
                    maxChars={500}
                    onAddBullet={(text, index) =>
                      dispatch({
                        type: "ADD_BULLET",
                        section: sectionId,
                        itemId: item.id,
                        text,
                        index,
                      })
                    }
                    onRemoveBullet={(bulletIndex) =>
                      dispatch({
                        type: "REMOVE_BULLET",
                        section: sectionId,
                        itemId: item.id,
                        bulletIndex,
                      })
                    }
                    onMoveBullet={(fromIndex, toIndex) =>
                      dispatch({
                        type: "MOVE_BULLET",
                        section: sectionId,
                        itemId: item.id,
                        fromIndex,
                        toIndex,
                      })
                    }
                    onUpdateBullet={(bulletIndex, text) => {
                      const updated = [...(item.bullets || [])];
                      updated[bulletIndex] = text;
                      handleUpdateItem(item.id, "bullets", updated);
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
