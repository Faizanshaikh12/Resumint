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
import { formatDateRange } from "~/lib/resume/dates";
import { createDefaultExperienceItem } from "~/lib/resume/section-registry";
import { BulletEditor } from "../BulletEditor";
import { useEditor } from "../EditorContext";

export function ExperienceForm() {
  const { content, dispatch } = useEditor();
  const items = content.experience || [];
  const [collapsedMap, setCollapsedMap] = React.useState<Record<string, boolean>>({});

  const toggleCollapse = (id: string) => {
    setCollapsedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUpdate = (id: string, field: string, value: unknown) => {
    dispatch({
      type: "UPDATE_FIELD",
      section: "experience",
      itemId: id,
      field,
      value,
    });
  };

  const handleDateUpdate = (id: string, field: "start" | "end" | "current", value: unknown) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const nextDate = { ...item.date, [field]: value };
    if (field === "current" && value === true) {
      nextDate.end = "";
    }
    handleUpdate(id, "date", nextDate);
  };

  const handleAddItem = () => {
    if (items.length >= 30) return;
    const newItem = createDefaultExperienceItem();
    dispatch({
      type: "ADD_ITEM",
      section: "experience",
      item: newItem as any,
    });
  };

  const handleRemoveItem = (id: string) => {
    dispatch({
      type: "REMOVE_ITEM",
      section: "experience",
      itemId: id,
    });
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const toIndex = direction === "up" ? index - 1 : index + 1;
    if (toIndex < 0 || toIndex >= items.length) return;
    dispatch({
      type: "MOVE_ITEM",
      section: "experience",
      fromIndex: index,
      toIndex,
    });
  };

  return (
    <div className="space-y-6" data-section-id="experience">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Work Experience</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add your relevant work history, job responsibilities, and quantified achievements.
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
            <span>Add Position</span>
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {items.map((item, idx) => {
          const isCollapsed = Boolean(collapsedMap[item.id]);
          const headerSummary = item.position
            ? `${item.position}${item.company ? ` at ${item.company}` : ""}`
            : item.company || "Untitled Position";

          return (
            <div
              key={item.id}
              data-item-id={item.id}
              className="border rounded-lg bg-card shadow-xs overflow-hidden transition-all"
            >
              {/* Card Header */}
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
                  {item.date && (
                    <span className="text-[11px] text-muted-foreground font-normal ml-2 hidden sm:inline">
                      ({formatDateRange(item.date) || "No dates"})
                    </span>
                  )}
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

              {/* Card Body */}
              {!isCollapsed && (
                <div className="p-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor={`exp-pos-${item.id}`} className="text-xs font-semibold">
                        Job Title / Position <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`exp-pos-${item.id}`}
                        data-field-path="experience.position"
                        value={item.position || ""}
                        onChange={(e) => handleUpdate(item.id, "position", e.target.value)}
                        placeholder="Senior Software Engineer"
                        maxLength={150}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor={`exp-comp-${item.id}`} className="text-xs font-semibold">
                        Company / Organization <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`exp-comp-${item.id}`}
                        data-field-path="experience.company"
                        value={item.company || ""}
                        onChange={(e) => handleUpdate(item.id, "company", e.target.value)}
                        placeholder="Google / Acme Corp"
                        maxLength={150}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor={`exp-loc-${item.id}`} className="text-xs font-semibold">
                        Location
                      </Label>
                      <Input
                        id={`exp-loc-${item.id}`}
                        data-field-path="experience.location"
                        value={item.location || ""}
                        onChange={(e) => handleUpdate(item.id, "location", e.target.value)}
                        placeholder="New York, NY (or Remote)"
                        maxLength={150}
                        className="h-9 text-xs"
                      />
                    </div>

                    {/* Date Range */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor={`exp-start-${item.id}`} className="text-xs font-medium">
                            Start Date (YYYY-MM or YYYY)
                          </Label>
                          <Input
                            id={`exp-start-${item.id}`}
                            data-field-path="experience.startDate"
                            value={item.date?.start || ""}
                            onChange={(e) => handleDateUpdate(item.id, "start", e.target.value)}
                            placeholder="2021-03"
                            maxLength={50}
                            className="h-8 text-xs font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor={`exp-end-${item.id}`} className="text-xs font-medium">
                            End Date
                          </Label>
                          <Input
                            id={`exp-end-${item.id}`}
                            data-field-path="experience.endDate"
                            disabled={item.date?.current}
                            value={item.date?.current ? "Present" : item.date?.end || ""}
                            onChange={(e) => handleDateUpdate(item.id, "end", e.target.value)}
                            placeholder={item.date?.current ? "Present" : "2023-08"}
                            maxLength={50}
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <input
                          id={`exp-curr-${item.id}`}
                          type="checkbox"
                          checked={Boolean(item.date?.current)}
                          onChange={(e) => handleDateUpdate(item.id, "current", e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-input text-primary focus:ring-primary"
                        />
                        <Label htmlFor={`exp-curr-${item.id}`} className="text-xs font-normal cursor-pointer">
                          I currently work here
                        </Label>
                      </div>
                    </div>

                    {/* Optional Overview Description */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor={`exp-desc-${item.id}`} className="text-xs font-semibold">
                        Role Overview (Optional)
                      </Label>
                      <textarea
                        id={`exp-desc-${item.id}`}
                        data-field-path="experience.summary"
                        value={item.description || ""}
                        maxLength={2000}
                        onChange={(e) => handleUpdate(item.id, "description", e.target.value)}
                        placeholder="Brief 1-line overview of the team or core mandate..."
                        rows={2}
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                  </div>

                  {/* Bullet Points */}
                  <BulletEditor
                    bullets={item.bullets || []}
                    maxBullets={20}
                    maxChars={500}
                    onAddBullet={(text, index) =>
                      dispatch({
                        type: "ADD_BULLET",
                        section: "experience",
                        itemId: item.id,
                        text,
                        index,
                      })
                    }
                    onRemoveBullet={(bulletIndex) =>
                      dispatch({
                        type: "REMOVE_BULLET",
                        section: "experience",
                        itemId: item.id,
                        bulletIndex,
                      })
                    }
                    onMoveBullet={(fromIndex, toIndex) =>
                      dispatch({
                        type: "MOVE_BULLET",
                        section: "experience",
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
