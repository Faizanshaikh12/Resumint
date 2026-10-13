import { Plus, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { createDefaultAwardItem } from "~/lib/resume/section-registry";
import { useEditor } from "../EditorContext";

export function AwardsForm() {
  const { content, dispatch } = useEditor();
  const items = content.awards || [];

  const handleUpdate = (id: string, field: string, value: string) => {
    dispatch({
      type: "UPDATE_FIELD",
      section: "awards",
      itemId: id,
      field,
      value,
    });
  };

  const handleAdd = () => {
    if (items.length >= 20) return;
    const newItem = createDefaultAwardItem();
    dispatch({
      type: "ADD_ITEM",
      section: "awards",
      item: newItem as any,
    });
  };

  const handleRemove = (id: string) => {
    dispatch({
      type: "REMOVE_ITEM",
      section: "awards",
      itemId: id,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Awards & Honors</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add academic honors, hackathon victories, or corporate recognition.
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
            <span>Add Award</span>
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={item.id} className="border rounded-lg p-4 bg-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Award #{idx + 1}</span>
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                aria-label={`Delete award ${item.title || idx + 1}`}
                className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor={`award-title-${item.id}`} className="text-xs font-medium">
                  Award Title *
                </Label>
                <Input
                  id={`award-title-${item.id}`}
                  value={item.title}
                  onChange={(e) => handleUpdate(item.id, "title", e.target.value)}
                  placeholder="Hackathon 1st Place / Dean's Honor Roll"
                  maxLength={150}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor={`award-issuer-${item.id}`} className="text-xs font-medium">
                  Issuer / Organization *
                </Label>
                <Input
                  id={`award-issuer-${item.id}`}
                  value={item.issuer}
                  onChange={(e) => handleUpdate(item.id, "issuer", e.target.value)}
                  placeholder="MIT Hackathon / Apex Corp"
                  maxLength={150}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor={`award-date-${item.id}`} className="text-xs font-medium">
                  Date
                </Label>
                <Input
                  id={`award-date-${item.id}`}
                  value={item.date || ""}
                  onChange={(e) => handleUpdate(item.id, "date", e.target.value)}
                  placeholder="2022-10"
                  maxLength={50}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor={`award-sum-${item.id}`} className="text-xs font-medium">
                  Summary / Details
                </Label>
                <textarea
                  id={`award-sum-${item.id}`}
                  value={item.summary || ""}
                  maxLength={1000}
                  onChange={(e) => handleUpdate(item.id, "summary", e.target.value)}
                  placeholder="Selected among 500+ participants..."
                  rows={2}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-xs shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
