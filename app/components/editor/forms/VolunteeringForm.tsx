import { Plus, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { createDefaultVolunteeringItem } from "~/lib/resume/section-registry";
import { BulletEditor } from "../BulletEditor";
import { useEditor } from "../EditorContext";

export function VolunteeringForm() {
  const { content, dispatch } = useEditor();
  const items = content.volunteering || [];

  const handleUpdate = (id: string, field: string, value: unknown) => {
    dispatch({
      type: "UPDATE_FIELD",
      section: "volunteering",
      itemId: id,
      field,
      value,
    });
  };

  const handleDateUpdate = (id: string, field: "start" | "end" | "current", value: unknown) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const nextDate = { ...(item.date || { start: "", end: "", current: false }), [field]: value };
    if (field === "current" && value === true) {
      nextDate.end = "";
    }
    handleUpdate(id, "date", nextDate);
  };

  const handleAdd = () => {
    if (items.length >= 20) return;
    const newItem = createDefaultVolunteeringItem();
    dispatch({
      type: "ADD_ITEM",
      section: "volunteering",
      item: newItem as any,
    });
  };

  const handleRemove = (id: string) => {
    dispatch({
      type: "REMOVE_ITEM",
      section: "volunteering",
      itemId: id,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Volunteering & Leadership</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add community contributions, non-profit work, or leadership roles.
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
            <span>Add Volunteering</span>
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={item.id} className="border rounded-lg p-4 bg-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                Volunteering #{idx + 1}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                aria-label={`Delete volunteering role ${item.role || idx + 1}`}
                className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor={`vol-org-${item.id}`} className="text-xs font-medium">
                  Organization *
                </Label>
                <Input
                  id={`vol-org-${item.id}`}
                  value={item.organization}
                  onChange={(e) => handleUpdate(item.id, "organization", e.target.value)}
                  placeholder="Red Cross / Code for America"
                  maxLength={150}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor={`vol-role-${item.id}`} className="text-xs font-medium">
                  Role / Title *
                </Label>
                <Input
                  id={`vol-role-${item.id}`}
                  value={item.role}
                  onChange={(e) => handleUpdate(item.id, "role", e.target.value)}
                  placeholder="Volunteer Tech Lead"
                  maxLength={150}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor={`vol-start-${item.id}`} className="text-xs font-medium">
                  Start Date
                </Label>
                <Input
                  id={`vol-start-${item.id}`}
                  value={item.date?.start || ""}
                  onChange={(e) => handleDateUpdate(item.id, "start", e.target.value)}
                  placeholder="2020-01"
                  maxLength={50}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor={`vol-end-${item.id}`} className="text-xs font-medium">
                  End Date
                </Label>
                <Input
                  id={`vol-end-${item.id}`}
                  disabled={item.date?.current}
                  value={item.date?.current ? "Present" : item.date?.end || ""}
                  onChange={(e) => handleDateUpdate(item.id, "end", e.target.value)}
                  placeholder={item.date?.current ? "Present" : "2022-12"}
                  maxLength={50}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor={`vol-sum-${item.id}`} className="text-xs font-medium">
                  Summary
                </Label>
                <textarea
                  id={`vol-sum-${item.id}`}
                  value={item.summary || ""}
                  maxLength={1000}
                  onChange={(e) => handleUpdate(item.id, "summary", e.target.value)}
                  placeholder="Brief description of responsibilities..."
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
                  section: "volunteering",
                  itemId: item.id,
                  text,
                  index,
                })
              }
              onRemoveBullet={(bulletIndex) =>
                dispatch({
                  type: "REMOVE_BULLET",
                  section: "volunteering",
                  itemId: item.id,
                  bulletIndex,
                })
              }
              onMoveBullet={(fromIndex, toIndex) =>
                dispatch({
                  type: "MOVE_BULLET",
                  section: "volunteering",
                  itemId: item.id,
                  fromIndex,
                  toIndex,
                })
              }
              onUpdateBullet={(bulletIndex, text) => {
                const updated = [...(item.bullets || [])];
                updated[bulletIndex] = text;
                handleUpdate(item.id, "bullets", updated);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
