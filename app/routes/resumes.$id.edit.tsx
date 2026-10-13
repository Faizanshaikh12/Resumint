import { Link, isRouteErrorResponse, useRouteError } from "react-router";
import type { Route } from "./+types/resumes.$id.edit";
import { requireUser } from "~/auth/helpers.server";
import { getDatabase } from "~/db/helpers.server";
import { getResume } from "~/db/queries/resumes";
import { Button } from "~/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "~/components/ui/card";
import { ArrowLeft, Clock, FileCode, Sparkles, AlertTriangle } from "lucide-react";
import { formatRelativeTime } from "~/lib/utils/format";

export function meta({ data }: Route.MetaArgs) {
  const title = data?.resume ? `${data.resume.title} | Resumint Editor` : "Resume Editor | Resumint";
  return [
    { title },
    { name: "description", content: "Resumint resume builder and editor." },
  ];
}

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const env = (context as { cloudflare?: { env?: Env } })?.cloudflare?.env;
  const user = await requireUser(request, env);

  const { id } = params;
  if (!id) {
    throw new Response("Resume Not Found", { status: 404 });
  }

  const db = await getDatabase(env);
  const resume = await getResume(db, user.id, id);

  if (!resume) {
    // Non-owned or missing resume responds 404 (never 403), so existence is not leaked
    throw new Response("Resume Not Found", { status: 404 });
  }

  return {
    user,
    resume: {
      id: resume.id,
      title: resume.title,
      templateId: resume.templateId,
      version: resume.version,
      updatedAt: resume.updatedAt,
      createdAt: resume.createdAt,
    },
  };
}

export default function ResumeEditPlaceholderPage({ loaderData }: Route.ComponentProps) {
  const { resume } = loaderData;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
              {resume.title}
              <span className="inline-flex items-center rounded-full bg-secondary/80 px-2.5 py-0.5 text-xs font-medium text-secondary-foreground border border-border">
                {resume.templateId}
              </span>
            </h1>
            <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
              <Clock className="h-3 w-3" />
              Updated {formatRelativeTime(resume.updatedAt)} &bull; Version {resume.version}
            </p>
          </div>
        </div>
      </div>

      <Card className="border-dashed border-2 bg-card/50">
        <CardHeader className="text-center py-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <Sparkles className="h-7 w-7" />
          </div>
          <CardTitle className="text-xl">Editor arrives in Phase 5</CardTitle>
          <CardDescription className="max-w-md mx-auto mt-2 text-sm">
            You own this document (ID: <code className="font-mono text-xs">{resume.id}</code>).
            Interactive two-pane resume editing, live preview, and autosave arrive in Phase 5.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-10">
          <Link to="/dashboard">
            <Button className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Return to My Documents
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
          <FileCode className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Resume Not Found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The document you requested does not exist or you do not have permission to access it.
        </p>
        <div className="mt-6">
          <Link to="/dashboard">
            <Button className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to My Documents
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-md text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Unexpected Error</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Something went wrong while loading this resume.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link to="/dashboard">
          <Button variant="outline">Back to My Documents</Button>
        </Link>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    </div>
  );
}
