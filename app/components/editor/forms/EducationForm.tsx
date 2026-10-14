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
import { createDefaultEducationItem } from "~/lib/resume/section-registry";
import { BulletEditor } from "../BulletEditor";
import { useEditor } from "../EditorContext";

export function EducationForm() {
  const { content, dispatch } = useEditor();
  const items = content.education || [];
  const [collapsedMap, setCollapsedMap] = React.useState<Record<string, boolean>>({});

  const toggleCollapse = (id: string) => {
    setCollapsedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUpdate = (id: string, field: string, value: unknown) => {
    dispatch({
      type: "UPDATE_FIELD",
      section: "education",
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
    if (items.length >= 20) return;
    const newItem = createDefaultEducationItem();
    dispatch({
      type: "ADD_ITEM",
      section: "education",
      item: newItem as any,
    });
  };

  const handleRemoveItem = (id: string) => {
    dispatch({
      type: "REMOVE_ITEM",
      section: "education",
      itemId: id,
    });
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const toIndex = direction === "up" ? index - 1 : index + 1;
    if (toIndex < 0 || toIndex >= items.length) return;
    dispatch({
      type: "MOVE_ITEM",
      section: "education",
      fromIndex: index,
      toIndex,
    });
  };

  return (
    <div className="space-y-6" data-section-id="education">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Education</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            List your academic degrees, certifications, universities, and notable honors.
          </p>
        </div>
        {items.length < 20 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddItem}
            className="text-xs h-8 gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Education</span>
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {items.map((item, idx) => {
          const isCollapsed = Boolean(collapsedMap[item.id]);
          const headerSummary = item.degree
            ? `${item.degree}${item.institution ? ` &bull; ${item.institution}` : ""}`
            : item.institution || "Untitled Degree";

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
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor={`edu-inst-${item.id}`} className="text-xs font-semibold">
                        Institution / University <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`edu-inst-${item.id}`}
                        data-field-path="education.institution"
                        value={item.institution || ""}
                        onChange={(e) => handleUpdate(item.id, "institution", e.target.value)}
                        placeholder="University of California, Berkeley"
                        maxLength={150}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor={`edu-deg-${item.id}`} className="text-xs font-semibold">
                        Degree <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`edu-deg-${item.id}`}
                        data-field-path="education.degree"
                        value={item.degree || ""}
                        onChange={(e) => handleUpdate(item.id, "degree", e.target.value)}
                        placeholder="Bachelor of Science"
                        maxLength={150}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor={`edu-field-${item.id}`} className="text-xs font-semibold">
                        Field of Study / Major
                      </Label>
                      <Input
                        id={`edu-field-${item.id}`}
                        value={item.fieldOfStudy || ""}
                        onChange={(e) => handleUpdate(item.id, "fieldOfStudy", e.target.value)}
                        placeholder="Computer Science"
                        maxLength={150}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor={`edu-loc-${item.id}`} className="text-xs font-semibold">
                        Location
                      </Label>
                      <Input
                        id={`edu-loc-${item.id}`}
                        value={item.location || ""}
                        onChange={(e) => handleUpdate(item.id, "location", e.target.value)}
                        placeholder="Berkeley, CA"
                        maxLength={150}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor={`edu-score-${item.id}`} className="text-xs font-semibold">
                        GPA / Honors (Optional)
                      </Label>
                      <Input
                        id={`edu-score-${item.id}`}
                        value={item.score || ""}
                        onChange={(e) => handleUpdate(item.id, "score", e.target.value)}
                        placeholder="3.85 GPA / Magna Cum Laude"
                        maxLength={50}
                        className="h-9 text-xs"
                      />
                    </div>

                    {/* Date Range */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor={`edu-start-${item.id}`} className="text-xs font-medium">
                            Start Date
                          </Label>
                          <Input
                            id={`edu-start-${item.id}`}
                            value={item.date?.start || ""}
                            onChange={(e) => handleDateUpdate(item.id, "start", e.target.value)}
                            placeholder="2015-08"
                            maxLength={50}
                            className="h-8 text-xs font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor={`edu-end-${item.id}`} className="text-xs font-medium">
                            Graduation / End Date
                          </Label>
                          <Input
                            id={`edu-end-${item.id}`}
                            disabled={item.date?.current}
                            value={item.date?.current ? "Present" : item.date?.end || ""}
                            onChange={(e) => handleDateUpdate(item.id, "end", e.target.value)}
                            placeholder={item.date?.current ? "Present" : "2019-05"}
                            maxLength={50}
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <input
                          id={`edu-curr-${item.id}`}
                          type="checkbox"
                          checked={Boolean(item.date?.current)}
                          onChange={(e) => handleDateUpdate(item.id, "current", e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-input text-primary focus:ring-primary"
                        />
                        <Label htmlFor={`edu-curr-${item.id}`} className="text-xs font-normal cursor-pointer">
                          Currently enrolled
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Bullet Points */}
                  <BulletEditor
                    bullets={item.bullets || []}
                    maxBullets={15}
                    maxChars={500}
                    onAddBullet={(text, index) =>
                      dispatch({
                        type: "ADD_BULLET",
                        section: "education",
                        itemId: item.id,
                        text,
                        index,
                      })
                    }
                    onRemoveBullet={(bulletIndex) =>
                      dispatch({
                        type: "REMOVE_BULLET",
                        section: "education",
                        itemId: item.id,
                        bulletIndex,
                      })
                    }
                    onMoveBullet={(fromIndex, toIndex) =>
                      dispatch({
                        type: "MOVE_BULLET",
                        section: "education",
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
