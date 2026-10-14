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
import { createDefaultProjectItem } from "~/lib/resume/section-registry";
import { BulletEditor } from "../BulletEditor";
import { useEditor } from "../EditorContext";

export function ProjectsForm() {
  const { content, dispatch } = useEditor();
  const items = content.projects || [];
  const [collapsedMap, setCollapsedMap] = React.useState<Record<string, boolean>>({});

  const toggleCollapse = (id: string) => {
    setCollapsedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUpdate = (id: string, field: string, value: unknown) => {
    dispatch({
      type: "UPDATE_FIELD",
      section: "projects",
      itemId: id,
      field,
      value,
    });
  };

  const handleAddItem = () => {
    if (items.length >= 30) return;
    const newItem = createDefaultProjectItem();
    dispatch({
      type: "ADD_ITEM",
      section: "projects",
      item: newItem as any,
    });
  };

  const handleRemoveItem = (id: string) => {
    dispatch({
      type: "REMOVE_ITEM",
      section: "projects",
      itemId: id,
    });
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const toIndex = direction === "up" ? index - 1 : index + 1;
    if (toIndex < 0 || toIndex >= items.length) return;
    dispatch({
      type: "MOVE_ITEM",
      section: "projects",
      fromIndex: index,
      toIndex,
    });
  };

  return (
    <div className="space-y-6" data-section-id="projects">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Projects</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Highlight notable personal, open-source, or commercial projects.
          </p>
        </div>
        {items.length < 30 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddItem}
            className="text-xs h-8 gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Project</span>
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {items.map((item, idx) => {
          const isCollapsed = Boolean(collapsedMap[item.id]);
          const headerSummary = item.name || "Untitled Project";

          return (
            <div
              key={item.id}
              data-item-id={item.id}
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
                    onClick={() => handleMove(idx, "up")}
                    aria-label={`Move ${headerSummary} up`}
                    className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === items.length - 1}
                    onClick={() => handleMove(idx, "down")}
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
                      <Label htmlFor={`proj-name-${item.id}`} className="text-xs font-semibold">
                        Project Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`proj-name-${item.id}`}
                        data-field-path="projects.name"
                        value={item.name || ""}
                        onChange={(e) => handleUpdate(item.id, "name", e.target.value)}
                        placeholder="Resumint / Distributed Key-Value Store"
                        maxLength={150}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor={`proj-url-${item.id}`} className="text-xs font-semibold">
                        Project URL / Repository
                      </Label>
                      <Input
                        id={`proj-url-${item.id}`}
                        data-field-path="projects.url"
                        value={item.url || ""}
                        onChange={(e) => handleUpdate(item.id, "url", e.target.value)}
                        placeholder="https://github.com/..."
                        maxLength={500}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor={`proj-desc-${item.id}`} className="text-xs font-semibold">
                        Description
                      </Label>
                      <textarea
                        id={`proj-desc-${item.id}`}
                        data-field-path="projects.description"
                        value={item.description || ""}
                        maxLength={2000}
                        onChange={(e) => handleUpdate(item.id, "description", e.target.value)}
                        placeholder="Brief summary of architecture, stack, and impact..."
                        rows={2}
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                        section: "projects",
                        itemId: item.id,
                        text,
                        index,
                      })
                    }
                    onRemoveBullet={(bulletIndex) =>
                      dispatch({
                        type: "REMOVE_BULLET",
                        section: "projects",
                        itemId: item.id,
                        bulletIndex,
                      })
                    }
                    onMoveBullet={(fromIndex, toIndex) =>
                      dispatch({
                        type: "MOVE_BULLET",
                        section: "projects",
                        itemId: item.id,
                        fromIndex,
                        toIndex,
                      })
                    }
                    onUpdateBullet={(bulletIndex, text) => {
                      const updatedBullets = [...(item.bullets || [])];
                      updatedBullets[bulletIndex] = text;
                      handleUpdate(item.id, "bullets", updatedBullets);
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
