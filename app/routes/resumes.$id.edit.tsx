import * as React from "react";
import { Link, isRouteErrorResponse, useRouteError } from "react-router";
import type { Route } from "./+types/resumes.$id.edit";
import { requireUser } from "~/auth/helpers.server";
import { getDatabase } from "~/db/helpers.server";
import { getResume, renameResume, updateResume } from "~/db/queries/resumes";
import { Button } from "~/components/ui/button";
import { ArrowLeft, FileCode, AlertTriangle } from "lucide-react";
import { ResumeEditor } from "~/components/editor/ResumeEditor";
import { createServerPersistence } from "~/lib/resume/persistence";
import { resumeContentSchema, templateIdSchema, type ResumeContent, type ResumeDesign, type TemplateId } from "~/lib/schemas/resume";
import { normalizeDesign } from "~/lib/resume/normalize-design";
import { getTemplate } from "~/components/templates/registry";
import { editorRenameActionSchema, resumeTitleSchema } from "~/lib/schemas/resume-actions";
import { verifyCsrf } from "~/lib/security/csrf.server";

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
      content: resume.content as ResumeContent,
      design: resume.design as ResumeDesign,
      templateId: resume.templateId as TemplateId,
      version: resume.version,
      updatedAt: resume.updatedAt,
      createdAt: resume.createdAt,
    },
  };
}

export async function action({ request, params, context }: Route.ActionArgs) {
  verifyCsrf(request);
  const env = (context as { cloudflare?: { env?: Env } })?.cloudflare?.env;
  const user = await requireUser(request, env);
  const db = await getDatabase(env);

  const { id } = params;
  if (!id) {
    return Response.json({ ok: false, error: "Resume Not Found" }, { status: 404 });
  }

  const contentType = request.headers.get("content-type") || "";
  let payload: Record<string, unknown>;

  if (contentType.includes("application/json")) {
    const rawBody = await request.text();

    // Check payload size cap (200 KB)
    if (rawBody.length > 204800) {
      return Response.json(
        { ok: false, error: "Resume content exceeds maximum allowed size of 200 KB" },
        { status: 413 }
      );
    }

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return Response.json({ ok: false, error: "Invalid JSON payload" }, { status: 400 });
    }
  } else {
    const formData = await request.formData();
    payload = Object.fromEntries(formData.entries());
    if (typeof payload.content === "string") {
      try {
        payload.content = JSON.parse(payload.content);
      } catch {
        // Leave as is for zod validation to catch
      }
    }
  }

  const intent = payload.intent;

  if (intent === "rename") {
    const parsed = editorRenameActionSchema.safeParse(payload);
    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "Invalid title", fieldErrors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const success = await renameResume(db, user.id, id, parsed.data.title);
    if (!success) {
      return Response.json({ ok: false, error: "Resume not found" }, { status: 404 });
    }

    return Response.json({ ok: true, title: parsed.data.title.trim() });
  }

  if (intent === "save") {
    const expectedVersionNum = Number(payload.expectedVersion);
    if (!Number.isInteger(expectedVersionNum) || expectedVersionNum < 1) {
      return Response.json(
        { ok: false, error: "Invalid expectedVersion: must be positive integer" },
        { status: 400 }
      );
    }

    // Strictly validate content against resumeContentSchema
    const parsedContent = resumeContentSchema.safeParse(payload.content);
    if (!parsedContent.success) {
      console.error("Resume content validation failed:", JSON.stringify(parsedContent.error.flatten()));
      return Response.json(
        {
          ok: false,
          error: "Resume content failed validation",
          fieldErrors: parsedContent.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Validate and normalize design if present
    let validatedDesign: ResumeDesign | undefined = undefined;
    if (payload.design !== undefined) {
      const templateMeta = typeof payload.templateId === "string" ? getTemplate(payload.templateId) : undefined;
      validatedDesign = normalizeDesign(payload.design, templateMeta?.supports);
    }

    // Validate templateId if present
    let validatedTemplate: TemplateId | undefined = undefined;
    if (payload.templateId !== undefined) {
      const parsedTemplate = templateIdSchema.safeParse(payload.templateId);
      if (!parsedTemplate.success) {
        return Response.json({ ok: false, error: "Invalid templateId" }, { status: 400 });
      }
      validatedTemplate = parsedTemplate.data;
    }

    const result = await updateResume(db, user.id, id, {
      content: parsedContent.data,
      design: validatedDesign,
      templateId: validatedTemplate,
      expectedVersion: expectedVersionNum,
    });

    if (result.ok) {
      return Response.json({
        ok: true,
        version: result.resume.version,
        updatedAt: result.resume.updatedAt,
      });
    }

    if (result.reason === "conflict") {
      const current = await getResume(db, user.id, id);
      return Response.json(
        {
          ok: false,
          reason: "conflict",
          serverVersion: current?.version ?? expectedVersionNum + 1,
        },
        { status: 409 }
      );
    }

    return Response.json({ ok: false, error: "Resume not found" }, { status: 404 });
  }

  return Response.json({ ok: false, error: "Unknown action intent" }, { status: 400 });
}

export default function ResumeEditRoute({ loaderData }: Route.ComponentProps) {
  const { resume } = loaderData;

  const persistence = React.useMemo(() => {
    return createServerPersistence(resume.id);
  }, [resume.id]);

  return (
    <ResumeEditor
      initial={{
        id: resume.id,
        title: resume.title,
        content: resume.content,
        design: resume.design,
        templateId: resume.templateId,
        version: resume.version,
      }}
      persistence={persistence}
    />
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
