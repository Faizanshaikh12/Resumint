import { Plus, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { createDefaultReferenceItem } from "~/lib/resume/section-registry";
import { useEditor } from "../EditorContext";

export function ReferencesForm() {
  const { content, dispatch } = useEditor();
  const items = content.references || [];

  const handleUpdate = (id: string, field: string, value: string) => {
    dispatch({
      type: "UPDATE_FIELD",
      section: "references",
      itemId: id,
      field,
      value,
    });
  };

  const handleAdd = () => {
    if (items.length >= 15) return;
    const newItem = createDefaultReferenceItem();
    dispatch({
      type: "ADD_ITEM",
      section: "references",
      item: newItem as any,
    });
  };

  const handleRemove = (id: string) => {
    dispatch({
      type: "REMOVE_ITEM",
      section: "references",
      itemId: id,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">References</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add professional mentors, former managers, or collaborators who can vouch for you.
          </p>
        </div>
        {items.length < 15 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            className="text-xs h-8 gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Reference</span>
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={item.id} className="border rounded-lg p-4 bg-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                Reference #{idx + 1}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                aria-label={`Delete reference ${item.name || idx + 1}`}
                className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor={`ref-name-${item.id}`} className="text-xs font-medium">
                  Full Name *
                </Label>
                <Input
                  id={`ref-name-${item.id}`}
                  value={item.name}
                  onChange={(e) => handleUpdate(item.id, "name", e.target.value)}
                  placeholder="Sarah Connor"
                  maxLength={150}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor={`ref-contact-${item.id}`} className="text-xs font-medium">
                  Contact Information
                </Label>
                <Input
                  id={`ref-contact-${item.id}`}
                  value={item.contact || ""}
                  onChange={(e) => handleUpdate(item.id, "contact", e.target.value)}
                  placeholder="email@example.com or Available upon request"
                  maxLength={150}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor={`ref-rel-${item.id}`} className="text-xs font-medium">
                  Relationship / Role *
                </Label>
                <Input
                  id={`ref-rel-${item.id}`}
                  value={item.reference}
                  onChange={(e) => handleUpdate(item.id, "reference", e.target.value)}
                  placeholder="Engineering Director at Apex Corp"
                  maxLength={500}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
