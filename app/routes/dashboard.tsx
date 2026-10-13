import * as React from "react";
import {
  Link,
  useFetcher,
  redirect,
  useNavigation,
  useSearchParams,
  isRouteErrorResponse,
  useRouteError,
} from "react-router";
import type { Route } from "./+types/dashboard";
import { requireUser } from "~/auth/helpers.server";
import { getDatabase } from "~/db/helpers.server";
import {
  listResumes,
  countResumes,
  createResume,
  renameResume,
  duplicateResume,
  deleteResume,
  type ResumeSummary,
} from "~/db/queries/resumes";
import { MAX_RESUMES_PER_USER } from "~/lib/resume/limits";
import {
  dashboardActionSchema,
  dashboardQuerySchema,
  type ActionResult,
} from "~/lib/schemas/resume-actions";
import { getSample } from "~/lib/resume/samples";
import { verifyCsrf } from "~/lib/security/csrf.server";
import { toast } from "~/components/ui/sonner";
import { Button } from "~/components/ui/button";
import { ResumeCard } from "~/components/dashboard/ResumeCard";
import { DashboardToolbar } from "~/components/dashboard/DashboardToolbar";
import { DashboardEmptyState } from "~/components/dashboard/DashboardEmptyState";
import { DashboardSkeleton } from "~/components/dashboard/DashboardSkeleton";
import { Plus, AlertCircle, RefreshCw } from "lucide-react";

export function meta() {
  return [
    { title: "My Documents | Resumint" },
    { name: "description", content: "Manage and organize your Resumint resumes." },
  ];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const env = (context as { cloudflare?: { env?: Env } })?.cloudflare?.env;
  const user = await requireUser(request, env);
  const db = await getDatabase(env);

  const url = new URL(request.url);
  const rawQuery = {
    q: url.searchParams.get("q") ?? undefined,
    sort: url.searchParams.get("sort") ?? undefined,
    cursor: url.searchParams.get("cursor") ?? undefined,
  };

  const { q, sort, cursor } = dashboardQuerySchema.parse(rawQuery);

  const [resumesList, totalCount] = await Promise.all([
    listResumes(db, user.id, {
      search: q || undefined,
      sort,
      cursor,
      limit: 12,
    }),
    countResumes(db, user.id),
  ]);

  const atLimit = totalCount >= MAX_RESUMES_PER_USER;

  return {
    user,
    items: resumesList.items,
    nextCursor: resumesList.nextCursor,
    totalCount,
    atLimit,
    maxLimit: MAX_RESUMES_PER_USER,
    q,
    sort,
  };
}

export async function action({ request, context }: Route.ActionArgs) {
  verifyCsrf(request);
  const env = (context as { cloudflare?: { env?: Env } })?.cloudflare?.env;
  const user = await requireUser(request, env);
  const db = await getDatabase(env);

  const formData = await request.formData();
  const rawData = Object.fromEntries(formData.entries());

  const parsed = dashboardActionSchema.safeParse(rawData);
  if (!parsed.success) {
    return Response.json(
      {
        ok: false,
        error: "Invalid request payload",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const actionData = parsed.data;

  switch (actionData.intent) {
    case "create": {
      const currentCount = await countResumes(db, user.id);
      if (currentCount >= MAX_RESUMES_PER_USER) {
        return Response.json(
          {
            ok: false,
            error: `Resume limit reached (${MAX_RESUMES_PER_USER} maximum). Delete an existing resume first.`,
          },
          { status: 400 }
        );
      }

      let content = undefined;
      let title = actionData.title;

      if (actionData.source === "sample" && actionData.sampleId) {
        const sample = getSample(actionData.sampleId);
        if (sample) {
          content = sample.content;
          if (!title) title = sample.title;
        }
      }

      const created = await createResume(db, user.id, {
        title: title || "Untitled Resume",
        templateId: actionData.templateId || "modern",
        content,
      });

      // Redirect after create so the URL is correct on first paint
      throw redirect(`/resumes/${created.id}/edit`);
    }

    case "rename": {
      const success = await renameResume(db, user.id, actionData.id, actionData.title);
      if (!success) {
        // Non-owned or missing resume = 404 (never 403) so existence is not leaked
        return Response.json(
          { ok: false, error: "Resume not found" },
          { status: 404 }
        );
      }
      return Response.json({
        ok: true,
        intent: "rename",
        data: { id: actionData.id, title: actionData.title.trim() },
      });
    }

    case "duplicate": {
      const currentCount = await countResumes(db, user.id);
      if (currentCount >= MAX_RESUMES_PER_USER) {
        return Response.json(
          {
            ok: false,
            error: `Resume limit reached (${MAX_RESUMES_PER_USER} maximum). Delete an existing resume to duplicate.`,
          },
          { status: 400 }
        );
      }

      const duplicated = await duplicateResume(db, user.id, actionData.id);
      if (!duplicated) {
        // Non-owned or missing resume = 404
        return Response.json(
          { ok: false, error: "Resume not found" },
          { status: 404 }
        );
      }

      return Response.json({
        ok: true,
        intent: "duplicate",
        data: {
          id: duplicated.id,
          title: duplicated.title,
          templateId: duplicated.templateId,
          version: duplicated.version,
          createdAt: duplicated.createdAt,
          updatedAt: duplicated.updatedAt,
          hasShareLink: false,
        },
      });
    }

    case "delete": {
      const deleted = await deleteResume(db, user.id, actionData.id);
      if (!deleted) {
        // Non-owned or missing resume = 404
        return Response.json(
          { ok: false, error: "Resume not found" },
          { status: 404 }
        );
      }
      return Response.json({
        ok: true,
        intent: "delete",
        data: { id: actionData.id },
      });
    }
  }
}

export default function DashboardRoute({ loaderData }: Route.ComponentProps) {
  const {
    items: initialItems,
    nextCursor: initialNextCursor,
    totalCount,
    atLimit,
    maxLimit,
    q,
    sort,
  } = loaderData;

  const navigation = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Mutation fetcher for Rename, Duplicate, Delete
  const mutationFetcher = useFetcher<ActionResult>();

  // Pagination fetcher for Load More
  const paginationFetcher = useFetcher<typeof loaderData>();

  // Local state for accumulated items & cursor pagination
  const [items, setItems] = React.useState<ResumeSummary[]>(initialItems);
  const [nextCursor, setNextCursor] = React.useState<string | null>(initialNextCursor);

  // Sync state whenever loaderData changes (e.g. search or sort navigation)
  React.useEffect(() => {
    setItems(initialItems);
    setNextCursor(initialNextCursor);
  }, [initialItems, initialNextCursor]);

  // Handle toast notifications and item updates from mutation fetcher
  React.useEffect(() => {
    if (mutationFetcher.state === "idle" && mutationFetcher.data) {
      const res = mutationFetcher.data as ActionResult & { intent?: string };
      if (res.ok) {
        if (res.intent === "rename") {
          toast.success("Resume renamed");
          const renameData = res.data as { id: string; title: string };
          setItems((prev) =>
            prev.map((item) =>
              item.id === renameData.id
                ? { ...item, title: renameData.title, updatedAt: new Date() }
                : item
            )
          );
        } else if (res.intent === "duplicate") {
          toast.success("Resume duplicated");
          const newDoc = res.data as ResumeSummary;
          setItems((prev) => {
            if (prev.some((item) => item.id === newDoc.id)) return prev;
            return [newDoc, ...prev];
          });
        } else if (res.intent === "delete") {
          toast.success("Resume deleted");
          const deleteData = res.data as { id: string };
          setItems((prev) => prev.filter((item) => item.id !== deleteData.id));
        }
      } else if (!res.ok && res.error) {
        toast.error(res.error);
      }
    }
  }, [mutationFetcher.state, mutationFetcher.data]);

  // Handle appending items from paginationFetcher
  React.useEffect(() => {
    if (paginationFetcher.state === "idle" && paginationFetcher.data) {
      const newItems = paginationFetcher.data.items;
      const newCursor = paginationFetcher.data.nextCursor;
      setItems((prev) => {
        const existingIds = new Set(prev.map((i) => i.id));
        const filteredNew = newItems.filter((i) => !existingIds.has(i.id));
        return [...prev, ...filteredNew];
      });
      setNextCursor(newCursor);
    }
  }, [paginationFetcher.state, paginationFetcher.data]);

  const handleLoadMore = () => {
    if (!nextCursor || paginationFetcher.state !== "idle") return;
    const params = new URLSearchParams(searchParams);
    params.set("cursor", nextCursor);
    paginationFetcher.load(`/dashboard?${params.toString()}`);
  };

  const handleClearSearch = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("q");
    params.delete("cursor");
    setSearchParams(params);
  };

  const isSearchingOrSorting =
    navigation.state === "loading" &&
    navigation.location?.pathname === "/dashboard";

  const isSearchActive = Boolean(q.trim());
  const isEmpty = items.length === 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            My Documents
          </h1>
          <h2 className="sr-only">Hello, {loaderData.user.name}!</h2>
          <p className="mt-1 text-sm text-muted-foreground flex flex-wrap items-center gap-2">
            <span>
              Hello, <strong>{loaderData.user.name}</strong>!
            </span>
            <span>&bull;</span>
            <span className="font-mono text-xs">{loaderData.user.email}</span>
            <span>&bull;</span>
            <span>
              <strong>{totalCount}</strong> of <strong>{maxLimit}</strong> resumes used
            </span>
            {atLimit && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-3 w-3" />
                Plan limit reached
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <form method="post" action="/logout">
            <Button variant="outline" size="sm" type="submit" className="gap-2">
              Sign Out
            </Button>
          </form>

          {atLimit ? (
            <div title={`Maximum resume limit reached (${maxLimit} max). Delete a resume to create a new one.`}>
              <Button disabled className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                New resume
              </Button>
            </div>
          ) : (
            <Link to="/resumes/new">
              <Button className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                New resume
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Toolbar: Search & Sort */}
      <DashboardToolbar initialSearch={q} initialSort={sort} />

      {/* Main Content Area */}
      <main aria-label="Resume list">
        {isSearchingOrSorting ? (
          <DashboardSkeleton />
        ) : isEmpty ? (
          <DashboardEmptyState
            isSearchActive={isSearchActive}
            searchQuery={q}
            onClearSearch={handleClearSearch}
            atLimit={atLimit}
          />
        ) : (
          <div className="space-y-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((resume) => (
                <ResumeCard
                  key={resume.id}
                  resume={resume}
                  fetcher={mutationFetcher}
                  atLimit={atLimit}
                />
              ))}
            </div>

            {/* Load More Pagination */}
            {nextCursor && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={paginationFetcher.state !== "idle"}
                  className="gap-2 min-w-36"
                >
                  {paginationFetcher.state !== "idle" && (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  )}
                  Load more
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <div className="container mx-auto px-4 py-16 max-w-md text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
        <AlertCircle className="h-7 w-7" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Unable to load documents
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {isRouteErrorResponse(error)
          ? error.data?.message || "An unexpected error occurred while fetching your documents."
          : "Could not connect to the database. Please try again."}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button onClick={() => window.location.reload()}>Try Again</Button>
        <Link to="/">
          <Button variant="outline">Go to Home</Button>
        </Link>
      </div>
    </div>
  );
}
