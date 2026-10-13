import * as React from "react";
import { useSearchParams, useSubmit } from "react-router";
import { Input } from "~/components/ui/input";
import { Search, X, ArrowUpDown } from "lucide-react";

interface DashboardToolbarProps {
  initialSearch: string;
  initialSort: "updated" | "created" | "title";
}

export function DashboardToolbar({
  initialSearch,
  initialSort,
}: DashboardToolbarProps) {
  const [searchParams] = useSearchParams();
  const submit = useSubmit();

  const [searchTerm, setSearchTerm] = React.useState(initialSearch);
  const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync internal state if URL changes externally
  React.useEffect(() => {
    setSearchTerm(initialSearch);
  }, [initialSearch]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const newParams = new URLSearchParams(searchParams);
      if (value.trim()) {
        newParams.set("q", value.trim());
      } else {
        newParams.delete("q");
      }
      // Reset cursor pagination when search query changes
      newParams.delete("cursor");

      submit(newParams, { method: "get", replace: true });
    }, 300);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("q");
    newParams.delete("cursor");
    submit(newParams, { method: "get", replace: true });
  };

  const handleSortChange = (newSort: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (newSort === "updated") {
      newParams.delete("sort");
    } else {
      newParams.set("sort", newSort);
    }
    // Reset cursor pagination when sort changes
    newParams.delete("cursor");

    submit(newParams, { method: "get", replace: true });
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <label htmlFor="dashboard-search-input" className="sr-only">
          Search resumes by title
        </label>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          id="dashboard-search-input"
          type="search"
          placeholder="Search documents by title..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 pr-8"
        />
        {searchTerm && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={handleClearSearch}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Sort Select */}
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <ArrowUpDown className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
        <label htmlFor="dashboard-sort-select" className="text-xs text-muted-foreground whitespace-nowrap">
          Sort by:
        </label>
        <select
          id="dashboard-sort-select"
          aria-label="Sort resumes"
          value={initialSort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="updated">Recently Updated</option>
          <option value="created">Recently Created</option>
          <option value="title">Title (A-Z)</option>
        </select>
      </div>
    </div>
  );
}
