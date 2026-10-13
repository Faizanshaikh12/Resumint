import * as React from "react";
import { Link, type FetcherWithComponents } from "react-router";
import type { ResumeSummary } from "~/db/queries/resumes";
import { formatRelativeTime } from "~/lib/utils/format";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { RenameDialog } from "./RenameDialog";
import { DeleteDialog } from "./DeleteDialog";
import {
  MoreVertical,
  ExternalLink,
  Edit2,
  Copy,
  Trash2,
  Globe,
  Clock,
} from "lucide-react";
import type { ActionResult } from "~/lib/schemas/resume-actions";

interface ResumeCardProps {
  resume: ResumeSummary;
  fetcher: FetcherWithComponents<ActionResult>;
  atLimit: boolean;
}

const PALETTES = [
  "from-blue-500/20 to-indigo-500/20 text-blue-800 dark:text-blue-300 border-blue-500/30",
  "from-emerald-500/20 to-teal-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
  "from-violet-500/20 to-purple-500/20 text-violet-800 dark:text-violet-300 border-violet-500/30",
  "from-amber-500/20 to-orange-500/20 text-amber-900 dark:text-amber-300 border-amber-500/30",
  "from-rose-500/20 to-pink-500/20 text-rose-800 dark:text-rose-300 border-rose-500/30",
];

function getPaletteClass(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % PALETTES.length;
  return PALETTES[index]!;
}

function getInitials(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "RE";
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return (words[0]![0]! + words[1]![0]!).toUpperCase();
}

export function ResumeCard({ resume, fetcher, atLimit }: ResumeCardProps) {
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  // Optimistic UI for Rename
  const isRenamingThis =
    fetcher.formData?.get("intent") === "rename" &&
    fetcher.formData?.get("id") === resume.id;
  const optimisticTitle = isRenamingThis
    ? String(fetcher.formData?.get("title"))
    : null;
  const currentTitle = optimisticTitle || resume.title;

  // Optimistic UI for Delete
  const isDeletingThis =
    fetcher.formData?.get("intent") === "delete" &&
    fetcher.formData?.get("id") === resume.id;

  if (isDeletingThis) {
    return null; // Optimistically remove from grid
  }

  const palette = getPaletteClass(resume.id + resume.title);
  const initials = getInitials(currentTitle);

  const handleDuplicate = () => {
    if (atLimit) return;
    fetcher.submit(
      { intent: "duplicate", id: resume.id },
      { method: "post", action: "/dashboard" }
    );
  };

  return (
    <>
      <article
        data-testid="resume-card"
        className="group relative flex flex-col rounded-xl border bg-card p-4 shadow-xs transition-all hover:border-primary/40 hover:shadow-md focus-within:ring-2 focus-within:ring-ring"
      >
        {/* Placeholder Thumbnail: Colored Initials Document Miniature */}
        <Link
          to={`/resumes/${resume.id}/edit`}
          tabIndex={-1}
          aria-hidden="true"
          className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border bg-gradient-to-br p-4 transition-transform group-hover:scale-[1.01]"
        >
          <div
            className={`flex h-full w-full flex-col justify-between rounded border p-3 ${palette}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-lg font-black tracking-wider">
                {initials}
              </span>
              <div className="flex gap-1.5">
                {resume.hasShareLink && (
                  <span
                    title="Active Share Link"
                    className="inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 shadow-xs dark:text-emerald-400"
                  >
                    <Globe className="h-2.5 w-2.5" />
                    Shared
                  </span>
                )}
                <span className="inline-flex items-center rounded-md bg-background/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/80 shadow-xs">
                  {resume.templateId}
                </span>
              </div>
            </div>

            {/* Stylized miniature document lines */}
            <div className="space-y-1.5 opacity-60">
              <div className="h-1.5 w-1/3 rounded-full bg-current" />
              <div className="h-1 w-full rounded-full bg-current opacity-40" />
              <div className="h-1 w-4/5 rounded-full bg-current opacity-40" />
              <div className="h-1 w-2/3 rounded-full bg-current opacity-40" />
            </div>
          </div>
        </Link>

        {/* Card Content & Metadata */}
        <div className="mt-3 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Link
              to={`/resumes/${resume.id}/edit`}
              className="block truncate font-semibold text-foreground transition-colors hover:text-primary focus:outline-none focus:underline"
            >
              {currentTitle}
            </Link>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3 shrink-0" />
              <span>Updated {formatRelativeTime(resume.updatedAt)}</span>
            </div>
          </div>

          {/* Action Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={`Actions for ${currentTitle}`}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => {}}>
                <Link
                  to={`/resumes/${resume.id}/edit`}
                  className="flex w-full items-center gap-2 text-xs"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  Open Editor
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setRenameOpen(true)}
                className="flex items-center gap-2 text-xs"
              >
                <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDuplicate}
                disabled={atLimit || fetcher.state === "submitting"}
                className={`flex items-center gap-2 text-xs ${
                  atLimit ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                Duplicate {atLimit && "(Limit reached)"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="flex items-center gap-2 text-xs text-destructive hover:bg-destructive/10 focus:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </article>

      {/* Rename Dialog */}
      <RenameDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        resumeId={resume.id}
        currentTitle={currentTitle}
        fetcher={fetcher}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        resumeId={resume.id}
        resumeTitle={currentTitle}
        fetcher={fetcher}
      />
    </>
  );
}
