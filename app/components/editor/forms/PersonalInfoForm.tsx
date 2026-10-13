import { Plus, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { createDefaultLink } from "~/lib/resume/section-registry";
import { useEditor } from "../EditorContext";

export function PersonalInfoForm() {
  const { content, dispatch } = useEditor();
  const { personal } = content;

  const handleUpdate = (field: string, value: unknown) => {
    dispatch({
      type: "UPDATE_FIELD",
      section: "personal",
      field,
      value,
    });
  };

  const handleLinkUpdate = (linkId: string, field: "label" | "url", value: string) => {
    dispatch({
      type: "UPDATE_FIELD",
      section: "personal.links",
      itemId: linkId,
      field,
      value,
    });
  };

  const handleAddLink = () => {
    if ((personal.links || []).length >= 10) return;
    dispatch({
      type: "ADD_ITEM",
      section: "personal.links",
      item: createDefaultLink() as any,
    });
  };

  const handleRemoveLink = (linkId: string) => {
    dispatch({
      type: "REMOVE_ITEM",
      section: "personal.links",
      itemId: linkId,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Personal Information</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Enter your name, job title, and primary contact details.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="personal-name" className="text-xs font-semibold">
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="personal-name"
            value={personal.name || ""}
            onChange={(e) => handleUpdate("name", e.target.value)}
            placeholder="Alex Morgan"
            maxLength={100}
            className="h-9 text-sm"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="personal-title" className="text-xs font-semibold">
            Job Title / Headline
          </Label>
          <Input
            id="personal-title"
            value={personal.title || ""}
            onChange={(e) => handleUpdate("title", e.target.value)}
            placeholder="Senior Full-Stack Engineer"
            maxLength={150}
            className="h-9 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="personal-email" className="text-xs font-semibold">
            Email Address
          </Label>
          <Input
            id="personal-email"
            type="email"
            value={personal.email || ""}
            onChange={(e) => handleUpdate("email", e.target.value)}
            placeholder="alex.morgan@example.com"
            maxLength={150}
            className="h-9 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="personal-phone" className="text-xs font-semibold">
            Phone Number
          </Label>
          <Input
            id="personal-phone"
            type="tel"
            value={personal.phone || ""}
            onChange={(e) => handleUpdate("phone", e.target.value)}
            placeholder="+1 (555) 234-5678"
            maxLength={50}
            className="h-9 text-sm"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="personal-location" className="text-xs font-semibold">
            Location
          </Label>
          <Input
            id="personal-location"
            value={personal.location || ""}
            onChange={(e) => handleUpdate("location", e.target.value)}
            placeholder="San Francisco, CA (or Remote)"
            maxLength={150}
            className="h-9 text-sm"
          />
        </div>
      </div>

      {/* Social / Portfolio Links */}
      <div className="space-y-3 pt-4 border-t">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold">
            Websites & Profiles ({personal.links?.length || 0}/10)
          </Label>
          {(!personal.links || personal.links.length < 10) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddLink}
              className="text-xs h-7 gap-1"
            >
              <Plus className="h-3 w-3" />
              <span>Add Link</span>
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {(personal.links || []).map((link, idx) => (
            <div key={link.id} className="flex items-center gap-2">
              <Input
                value={link.label}
                onChange={(e) => handleLinkUpdate(link.id, "label", e.target.value)}
                placeholder="GitHub / LinkedIn / Website"
                aria-label={`Link ${idx + 1} Label`}
                maxLength={100}
                className="h-8 text-xs flex-1"
              />
              <Input
                value={link.url}
                onChange={(e) => handleLinkUpdate(link.id, "url", e.target.value)}
                placeholder="https://..."
                aria-label={`Link ${idx + 1} URL`}
                maxLength={500}
                className="h-8 text-xs flex-1"
              />
              <button
                type="button"
                onClick={() => handleRemoveLink(link.id)}
                aria-label={`Delete link ${link.label || idx + 1}`}
                className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
