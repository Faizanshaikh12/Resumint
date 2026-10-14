import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { FilePlus, SearchX, Plus } from "lucide-react";

interface DashboardEmptyStateProps {
  isSearchActive: boolean;
  searchQuery?: string;
  onClearSearch?: () => void;
  atLimit: boolean;
}

export function DashboardEmptyState({
  isSearchActive,
  searchQuery,
  onClearSearch,
  atLimit,
}: DashboardEmptyStateProps) {
  if (isSearchActive) {
    return (
      <div
        data-testid="no-search-results"
        className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
          <SearchX className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">No documents found</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          No resumes matching &ldquo;{searchQuery}&rdquo; were found. Try another search query or
          reset your filters.
        </p>
        <div className="mt-6">
          <Button variant="outline" onClick={onClearSearch}>
            Clear Search Filter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="dashboard-empty-state"
      className="flex flex-col items-center justify-center rounded-xl border border-dashed p-16 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
        <FilePlus className="h-7 w-7" />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-foreground">
        No documents yet
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        You haven&rsquo;t created any resumes yet. Start with a fresh blank canvas or choose
        from a pre-populated industry sample.
      </p>
      <div className="mt-6">
        <Link to="/resumes/new">
          <Button disabled={atLimit} className="gap-2" data-testid="create-first-resume-button">
            <Plus className="h-4 w-4" />
            Create Your First Resume
          </Button>
        </Link>
      </div>
    </div>
  );
}
