import { requireUser } from "~/auth/helpers.server";
import { getDatabase } from "~/db/helpers.server";
import { getResume } from "~/db/queries/resumes";
import type { ResumeContent, ResumeDesign, TemplateId } from "~/lib/schemas/resume";

export interface ResumePreviewData {
  content: ResumeContent;
  design: ResumeDesign;
  templateId: TemplateId;
}

export async function loader({
  request,
  params,
  context,
}: {
  request: Request;
  params: { id?: string };
  context: { cloudflare?: { env?: Env } };
}) {
  const env = context?.cloudflare?.env;
  const user = await requireUser(request, env);

  const { id } = params;
  if (!id) {
    throw new Response("Resume Not Found", { status: 404 });
  }

  const db = await getDatabase(env);
  const resume = await getResume(db, user.id, id);

  if (!resume) {
    // Non-owned or missing resume responds 404 (never 403)
    throw new Response("Resume Not Found", { status: 404 });
  }

  const previewData: ResumePreviewData = {
    content: resume.content as ResumeContent,
    design: resume.design as ResumeDesign,
    templateId: (resume.templateId as TemplateId) || "modern",
  };

  return Response.json(previewData, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "private, max-age=60",
    },
  });
}
