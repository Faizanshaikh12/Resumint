import { Label } from "~/components/ui/label";
import { useEditor } from "../EditorContext";

export function SummaryForm() {
  const { content, dispatch } = useEditor();
  const summary = content.summary || "";
  const maxLength = 4000;

  const handleChange = (val: string) => {
    dispatch({
      type: "UPDATE_FIELD",
      section: "summary",
      value: val,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Professional Summary</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Summarize your core background, strengths, and career highlights in 2–4 sentences.
          </p>
        </div>
        <span
          className={`text-xs font-mono ${
            summary.length >= maxLength ? "text-destructive font-semibold" : "text-muted-foreground"
          }`}
        >
          {summary.length} / {maxLength}
        </span>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="summary-textarea" className="sr-only">
          Professional Summary
        </Label>
        <textarea
          id="summary-textarea"
          value={summary}
          maxLength={maxLength}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Passionate Software Engineer with 6+ years of experience building scalable systems..."
          rows={6}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
    </div>
  );
}
