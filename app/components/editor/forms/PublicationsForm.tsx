import { Plus, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { createDefaultPublicationItem } from "~/lib/resume/section-registry";
import { useEditor } from "../EditorContext";

export function PublicationsForm() {
  const { content, dispatch } = useEditor();
  const items = content.publications || [];

  const handleUpdate = (id: string, field: string, value: string) => {
    dispatch({
      type: "UPDATE_FIELD",
      section: "publications",
      itemId: id,
      field,
      value,
    });
  };

  const handleAdd = () => {
    if (items.length >= 20) return;
    const newItem = createDefaultPublicationItem();
    dispatch({
      type: "ADD_ITEM",
      section: "publications",
      item: newItem as any,
    });
  };

  const handleRemove = (id: string) => {
    dispatch({
      type: "REMOVE_ITEM",
      section: "publications",
      itemId: id,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Publications</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add academic research papers, technical articles, or whitepapers.
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
            <span>Add Publication</span>
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={item.id} className="border rounded-lg p-4 bg-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                Publication #{idx + 1}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                aria-label={`Delete publication ${item.title || idx + 1}`}
                className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor={`pub-title-${item.id}`} className="text-xs font-medium">
                  Publication Title *
                </Label>
                <Input
                  id={`pub-title-${item.id}`}
                  value={item.title}
                  onChange={(e) => handleUpdate(item.id, "title", e.target.value)}
                  placeholder="Scalable Consensus in Serverless Architectures"
                  maxLength={200}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor={`pub-publisher-${item.id}`} className="text-xs font-medium">
                  Publisher / Journal *
                </Label>
                <Input
                  id={`pub-publisher-${item.id}`}
                  value={item.publisher}
                  onChange={(e) => handleUpdate(item.id, "publisher", e.target.value)}
                  placeholder="IEEE / ACM / Medium"
                  maxLength={150}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor={`pub-date-${item.id}`} className="text-xs font-medium">
                  Date
                </Label>
                <Input
                  id={`pub-date-${item.id}`}
                  value={item.date || ""}
                  onChange={(e) => handleUpdate(item.id, "date", e.target.value)}
                  placeholder="2023-01"
                  maxLength={50}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor={`pub-url-${item.id}`} className="text-xs font-medium">
                  URL / DOI
                </Label>
                <Input
                  id={`pub-url-${item.id}`}
                  value={item.url || ""}
                  onChange={(e) => handleUpdate(item.id, "url", e.target.value)}
                  placeholder="https://doi.org/..."
                  maxLength={500}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor={`pub-sum-${item.id}`} className="text-xs font-medium">
                  Abstract / Summary
                </Label>
                <textarea
                  id={`pub-sum-${item.id}`}
                  value={item.summary || ""}
                  maxLength={1000}
                  onChange={(e) => handleUpdate(item.id, "summary", e.target.value)}
                  placeholder="Brief 2-line summary of key findings..."
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
