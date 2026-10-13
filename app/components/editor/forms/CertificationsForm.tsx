import { Plus, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { createDefaultCertificationItem } from "~/lib/resume/section-registry";
import { useEditor } from "../EditorContext";

export function CertificationsForm() {
  const { content, dispatch } = useEditor();
  const items = content.certifications || [];

  const handleUpdate = (id: string, field: string, value: string) => {
    dispatch({
      type: "UPDATE_FIELD",
      section: "certifications",
      itemId: id,
      field,
      value,
    });
  };

  const handleAdd = () => {
    if (items.length >= 25) return;
    const newItem = createDefaultCertificationItem();
    dispatch({
      type: "ADD_ITEM",
      section: "certifications",
      item: newItem as any,
    });
  };

  const handleRemove = (id: string) => {
    dispatch({
      type: "REMOVE_ITEM",
      section: "certifications",
      itemId: id,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Certifications</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add industry licenses, cloud credentials, or professional certifications.
          </p>
        </div>
        {items.length < 25 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            className="text-xs h-8 gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Certification</span>
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={item.id} className="border rounded-lg p-4 bg-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                Certification #{idx + 1}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                aria-label={`Delete certification ${item.name || idx + 1}`}
                className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor={`cert-name-${item.id}`} className="text-xs font-medium">
                  Certification Name *
                </Label>
                <Input
                  id={`cert-name-${item.id}`}
                  value={item.name}
                  onChange={(e) => handleUpdate(item.id, "name", e.target.value)}
                  placeholder="AWS Certified Solutions Architect"
                  maxLength={150}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor={`cert-issuer-${item.id}`} className="text-xs font-medium">
                  Issuer *
                </Label>
                <Input
                  id={`cert-issuer-${item.id}`}
                  value={item.issuer}
                  onChange={(e) => handleUpdate(item.id, "issuer", e.target.value)}
                  placeholder="Amazon Web Services"
                  maxLength={150}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor={`cert-date-${item.id}`} className="text-xs font-medium">
                  Date
                </Label>
                <Input
                  id={`cert-date-${item.id}`}
                  value={item.date || ""}
                  onChange={(e) => handleUpdate(item.id, "date", e.target.value)}
                  placeholder="2023-04"
                  maxLength={50}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor={`cert-url-${item.id}`} className="text-xs font-medium">
                  Credential URL (Optional)
                </Label>
                <Input
                  id={`cert-url-${item.id}`}
                  value={item.url || ""}
                  onChange={(e) => handleUpdate(item.id, "url", e.target.value)}
                  placeholder="https://..."
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
