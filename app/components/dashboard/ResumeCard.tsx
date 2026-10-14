import * as React from "react";
import { Link, useNavigate, type FetcherWithComponents } from "react-router";
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
import { ResumeThumbnail } from "./ResumeThumbnail";
import {
  MoreVertical,
  ExternalLink,
  Edit2,
  Copy,
  Trash2,
  Globe,
  Clock,
  FileJson,
  Lock,
  Share2,
  Link2,
} from "lucide-react";
import { toast } from "~/components/ui/sonner";
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
  const navigate = useNavigate();
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

  const handleCopyShareLink = async () => {
    if (!resume.shareSlug) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    try {
      await navigator.clipboard.writeText(`${origin}/r/${resume.shareSlug}`);
      toast.success("Share link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <>
      <article
        data-testid="resume-card"
        className="group relative flex flex-col rounded-xl border bg-card p-4 shadow-xs transition-all hover:border-primary/40 hover:shadow-md focus-within:ring-2 focus-within:ring-ring"
      >
        {/* Thumbnail: Lazy Document Miniature with Initials Fallback */}
        <div
          onClick={() => navigate(`/resumes/${resume.id}/edit`)}
          className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border transition-transform group-hover:scale-[1.01] cursor-pointer"
        >
          <ResumeThumbnail
            resumeId={resume.id}
            initials={initials}
            paletteClass={palette}
            templateId={resume.templateId}
          />

          <div className="absolute top-2 right-2 flex gap-1.5 z-10">
            {resume.shareStatus === "not_shared" && (
              <span
                title="Not Shared"
                className="inline-flex items-center gap-1 rounded-full bg-background/95 border border-border/80 backdrop-blur-xs px-2 py-0.5 text-[10px] font-semibold text-foreground/80 shadow-xs"
                data-testid="share-badge-not_shared"
              >
                Not shared
              </span>
            )}
            {(resume.shareStatus === "shared" || (!resume.shareStatus && (resume as any).hasShareLink)) && (
              <span
                title="Active Share Link"
                className="inline-flex items-center gap-1 rounded-full bg-background/95 border border-emerald-300 dark:border-emerald-800 backdrop-blur-xs px-2 py-0.5 text-[10px] font-semibold text-emerald-700 shadow-xs dark:text-emerald-400"
                data-testid="share-badge-shared"
              >
                <Globe className="h-2.5 w-2.5" />
                Shared
              </span>
            )}
            {resume.shareStatus === "protected" && (
              <span
                title="Password Protected Share Link"
                className="inline-flex items-center gap-1 rounded-full bg-background/95 border border-amber-300 dark:border-amber-800 backdrop-blur-xs px-2 py-0.5 text-[10px] font-semibold text-amber-800 shadow-xs dark:text-amber-300"
                data-testid="share-badge-protected"
              >
                <Lock className="h-2.5 w-2.5" />
                Protected
              </span>
            )}
            {resume.shareStatus === "expired" && (
              <span
                title="Expired Share Link"
                className="inline-flex items-center gap-1 rounded-full bg-background/95 border border-rose-300 dark:border-rose-800 backdrop-blur-xs px-2 py-0.5 text-[10px] font-semibold text-rose-700 shadow-xs dark:text-rose-400"
                data-testid="share-badge-expired"
              >
                <Clock className="h-2.5 w-2.5" />
                Expired
              </span>
            )}
            {resume.shareStatus === "disabled" && (
              <span
                title="Disabled Share Link"
                className="inline-flex items-center gap-1 rounded-full bg-background/95 border border-border/80 backdrop-blur-xs px-2 py-0.5 text-[10px] font-semibold text-foreground/80 shadow-xs"
                data-testid="share-badge-disabled"
              >
                <Globe className="h-2.5 w-2.5" />
                Disabled
              </span>
            )}
            <span className="inline-flex items-center rounded-md bg-background/95 border border-border/80 backdrop-blur-xs px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/80 shadow-xs">
              {resume.templateId}
            </span>
          </div>
        </div>

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
              <DropdownMenuItem onClick={() => {}}>
                <Link
                  to={`/resumes/${resume.id}/share`}
                  className="flex w-full items-center gap-2 text-xs"
                  data-testid="card-share-settings-item"
                >
                  <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Share settings
                </Link>
              </DropdownMenuItem>
              {resume.shareSlug && (resume.shareStatus === "shared" || resume.shareStatus === "protected") && (
                <DropdownMenuItem
                  onClick={() => void handleCopyShareLink()}
                  className="flex items-center gap-2 text-xs"
                  data-testid="card-copy-share-link-item"
                >
                  <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Copy link
                </DropdownMenuItem>
              )}
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
              <DropdownMenuItem onClick={() => {}}>
                <a
                  href={`/resumes/${resume.id}/export.json`}
                  download
                  className="flex w-full items-center gap-2 text-xs"
                >
                  <FileJson className="h-3.5 w-3.5 text-muted-foreground" />
                  Download JSON
                </a>
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
