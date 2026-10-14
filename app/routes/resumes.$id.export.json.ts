import type { Route } from "./+types/resumes.$id.export.json";
import { requireUser } from "~/auth/helpers.server";
import { getDatabase } from "~/db/helpers.server";
import { getResume } from "~/db/queries/resumes";
import { exportResumeJson } from "~/lib/export/json";
import { buildFilename } from "~/lib/export/filename";
import type { ResumeContent, ResumeDesign, TemplateId } from "~/lib/schemas/resume";

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
    // 404 ensures non-owned documents do not leak their existence
    throw new Response("Resume Not Found", { status: 404 });
  }

  const content = resume.content as ResumeContent;
  const design = resume.design as ResumeDesign;
  const templateId = resume.templateId as TemplateId;

  const filename = buildFilename({
    name: content?.personal?.fullName,
    title: resume.title,
    ext: "json",
  });

  const jsonString = exportResumeJson({
    title: resume.title,
    templateId: templateId || "modern",
    content,
    design,
  });

  return new Response(jsonString, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
