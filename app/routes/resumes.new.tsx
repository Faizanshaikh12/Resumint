import React, { useState } from "react";
import { Form, Link, redirect, useSubmit, useNavigation } from "react-router";
import type { Route } from "./+types/resumes.new";
import { requireUser } from "~/auth/helpers.server";
import { getDatabase } from "~/db/helpers.server";
import { countResumes, createResume } from "~/db/queries/resumes";
import { listSamples, getSample } from "~/lib/resume/samples";
import { MAX_RESUMES_PER_USER } from "~/lib/resume/limits";
import { verifyCsrf } from "~/lib/security/csrf.server";
import { createResumeActionSchema } from "~/lib/schemas/resume-actions";
import { Button } from "~/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "~/components/ui/card";
import { ArrowLeft, FilePlus, Code2, GraduationCap, Palette, AlertCircle, Sparkles, FileJson } from "lucide-react";
import { ImportDialog } from "~/components/export/ImportDialog";
import { parseResumeJson, MAX_EXPORT_JSON_BYTES, type ExportEnvelope } from "~/lib/export/json";

export function meta() {
  return [
    { title: "Create New Resume | Resumint" },
    { name: "description", content: "Choose how to start your new resume." },
  ];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const env = (context as { cloudflare?: { env?: Env } })?.cloudflare?.env;
  const user = await requireUser(request, env);
  const db = await getDatabase(env);

  const totalCount = await countResumes(db, user.id);
  const atLimit = totalCount >= MAX_RESUMES_PER_USER;

  const samples = listSamples().map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
  }));

  return {
    user,
    totalCount,
    atLimit,
    maxLimit: MAX_RESUMES_PER_USER,
    samples,
  };
}

export async function action({ request, context }: Route.ActionArgs) {
  verifyCsrf(request);
  const env = (context as { cloudflare?: { env?: Env } })?.cloudflare?.env;
  const user = await requireUser(request, env);
  const db = await getDatabase(env);

  const totalCount = await countResumes(db, user.id);
  if (totalCount >= MAX_RESUMES_PER_USER) {
    return Response.json(
      {
        ok: false,
        error: `Resume limit reached (${MAX_RESUMES_PER_USER} maximum). Delete an existing resume to create a new one.`,
      },
      { status: 400 }
    );
  }

  const contentType = request.headers.get("content-type") || "";

  // 1. Direct JSON body submission (e.g. API / headless / worker test)
  if (contentType.includes("application/json")) {
    const rawBody = await request.text();
    if (rawBody.length > MAX_EXPORT_JSON_BYTES) {
      return Response.json(
        { ok: false, error: "Resume file exceeds maximum allowed size of 220 KB" },
        { status: 413 }
      );
    }
    const parsed = parseResumeJson(rawBody);
    if (!parsed.ok) {
      return Response.json({ ok: false, error: parsed.error, issues: parsed.issues }, { status: 400 });
    }
    const created = await createResume(db, user.id, {
      title: parsed.data.resume.title || "Imported Resume",
      templateId: parsed.data.resume.templateId,
      content: parsed.data.resume.content,
      design: parsed.data.resume.design,
    });
    return Response.json({ ok: true, id: created.id, redirectUrl: `/resumes/${created.id}/edit` });
  }

  // 2. Standard Form submission
  const formData = await request.formData();
  const rawData = Object.fromEntries(formData.entries());

  // Handle JSON envelope import via form submission
  if (rawData.intent === "import") {
    const envelopeStr = typeof rawData.envelope === "string" ? rawData.envelope : "";
    if (envelopeStr.length > MAX_EXPORT_JSON_BYTES) {
      return Response.json(
        { ok: false, error: "Resume file exceeds maximum allowed size of 220 KB" },
        { status: 413 }
      );
    }
    const parsed = parseResumeJson(envelopeStr);
    if (!parsed.ok) {
      return Response.json({ ok: false, error: parsed.error, issues: parsed.issues }, { status: 400 });
    }
    const created = await createResume(db, user.id, {
      title: parsed.data.resume.title || "Imported Resume",
      templateId: parsed.data.resume.templateId,
      content: parsed.data.resume.content,
      design: parsed.data.resume.design,
    });
    throw redirect(`/resumes/${created.id}/edit`);
  }

  // Standard creation schema
  const parsed = createResumeActionSchema.safeParse(rawData);
  if (!parsed.success) {
    return Response.json(
      {
        ok: false,
        error: "Invalid resume creation options",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { source, sampleId, title, templateId } = parsed.data;

  let resumeContent = undefined;
  let resumeTitle = title;

  if (source === "sample" && sampleId) {
    const sample = getSample(sampleId);
    if (sample) {
      resumeContent = sample.content;
      if (!resumeTitle) {
        resumeTitle = sample.title;
      }
    }
  }

  const created = await createResume(db, user.id, {
    title: resumeTitle || "Untitled Resume",
    templateId: templateId || "modern",
    content: resumeContent,
  });

  // Redirect after create so the URL is correct on first paint
  throw redirect(`/resumes/${created.id}/edit`);
}

const SAMPLE_ICONS: Record<string, typeof Code2> = {
  developer: Code2,
  student: GraduationCap,
  designer: Palette,
};

export default function NewResumePage({ loaderData }: Route.ComponentProps) {
  const { atLimit, totalCount, maxLimit, samples } = loaderData;
  const submit = useSubmit();
  const navigation = useNavigation();
  const [importOpen, setImportOpen] = useState(false);

  const isPending = navigation.state === "submitting" || navigation.state === "loading";

  const handleImportConfirm = (envelope: ExportEnvelope) => {
    submit(
      {
        intent: "import",
        envelope: JSON.stringify(envelope),
      },
      { method: "post" }
    );
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl space-y-8">
      <div className="flex items-center justify-between border-b pb-6">
        <div>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2 mb-2 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to My Documents
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Create New Resume
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Start with a fresh blank canvas, restore from a backup, or pre-populate with proven industry content.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-medium text-muted-foreground">
            Account Usage: <strong className="text-foreground">{totalCount}</strong> of{" "}
            <strong>{maxLimit}</strong>
          </span>
        </div>
      </div>

      {atLimit && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive"
        >
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-semibold text-sm">Resume limit reached ({maxLimit} of {maxLimit})</h2>
            <p className="text-xs mt-1 text-destructive/90">
              Free plan storage allows up to {maxLimit} documents per user. To create or import a resume,
              please delete an unused resume from your dashboard.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        {/* Blank Resume Card */}
        <Card className="flex flex-col justify-between border-2 border-primary/20 hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
              <FilePlus className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg">Blank Resume</CardTitle>
            <CardDescription className="text-xs">
              Start completely clean with standard sections and your contact details.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Form method="post" className="w-full">
              <input type="hidden" name="intent" value="create" />
              <input type="hidden" name="source" value="blank" />
              <input type="hidden" name="title" value="Untitled Resume" />
              <Button
                type="submit"
                className="w-full gap-2"
                disabled={atLimit || isPending}
                aria-label="Create blank resume"
              >
                <Sparkles className="h-4 w-4" />
                Start Blank
              </Button>
            </Form>
          </CardFooter>
        </Card>

        {/* Import from JSON Card */}
        <Card className="flex flex-col justify-between border-2 border-emerald-500/20 hover:border-emerald-500/50 transition-colors">
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-3">
              <FileJson className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg">Import JSON</CardTitle>
            <CardDescription className="text-xs">
              Restore a complete resume backup exported previously from Resumint.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
              disabled={atLimit || isPending}
              onClick={() => setImportOpen(true)}
              aria-label="Import resume from JSON"
              data-testid="import-json-card-button"
            >
              <FileJson className="h-4 w-4" />
              Upload Backup
            </Button>
          </CardFooter>
        </Card>

        {/* 3 Sample Resume Cards */}
        {samples.map((sample) => {
          const IconComponent = SAMPLE_ICONS[sample.id] || Code2;
          return (
            <Card
              key={sample.id}
              className="flex flex-col justify-between hover:border-border transition-colors"
            >
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-secondary-foreground mb-3">
                  <IconComponent className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">{sample.title}</CardTitle>
                <CardDescription className="text-xs">
                  {sample.description}
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Form method="post" className="w-full">
                  <input type="hidden" name="intent" value="create" />
                  <input type="hidden" name="source" value="sample" />
                  <input type="hidden" name="sampleId" value={sample.id} />
                  <input type="hidden" name="title" value={sample.title} />
                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full gap-2"
                    disabled={atLimit || isPending}
                    aria-label={`Start with ${sample.title} sample`}
                  >
                    Use Sample
                  </Button>
                </Form>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* JSON Import Dialog */}
      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onConfirm={handleImportConfirm}
        isPending={isPending}
      />
    </div>
  );
}
