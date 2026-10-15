import React, { useState, useEffect, useMemo } from "react";
import type { Route } from "./+types/build";
import { ResumeEditor } from "~/components/editor/ResumeEditor";
import { createLocalPersistence } from "~/lib/resume/persistence";
import { getSample } from "~/lib/resume/samples";
import { DEFAULT_DESIGN } from "~/lib/resume/design-tokens";
import type { ResumeContent, ResumeDesign, TemplateId } from "~/lib/schemas/resume";
import type { ExportEnvelope } from "~/lib/export/json";
import { loader as apiTemplatesLoader } from "~/routes/api.templates";
import type { TemplateMasterRow } from "~/lib/schemas/template";

export function meta() {
  return [
    { title: "Build Your Resume | Free ATS Resume Builder | Resumint" },
    {
      name: "description",
      content:
        "Build, format, and customize an ATS-safe resume in your browser. No sign up required to start or export.",
    },
  ];
}

export async function loader({ context }: { context?: { cloudflare?: { env?: Env } } }) {
  const response = await apiTemplatesLoader({ context });
  const data = (await response.json()) as { templates: TemplateMasterRow[] };
  return { templates: data.templates };
}

const GUEST_DRAFT_KEY = "resumint_guest_draft";

export default function GuestBuildRoute() {
  const defaultInitial = useMemo(() => {
    const sample = getSample("developer");
    return {
      title: "Untitled Resume",
      content: sample ? sample.content : ({} as ResumeContent),
      design: DEFAULT_DESIGN,
      templateId: "modern" as TemplateId,
      version: 1,
    };
  }, []);

  const [initialData, setInitialData] = useState<{
    title: string;
    content: ResumeContent;
    design: ResumeDesign;
    templateId: TemplateId;
    version: number;
  }>(defaultInitial);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(GUEST_DRAFT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.content) {
          setInitialData({
            title: parsed.title || "My Resume",
            content: parsed.content,
            design: parsed.design || DEFAULT_DESIGN,
            templateId: parsed.templateId || "modern",
            version: parsed.version || 1,
          });
          return;
        }
      }
    } catch (e) {
      console.warn("Failed reading guest draft from storage:", e);
    }
  }, []);

  const persistence = useMemo(() => createLocalPersistence(GUEST_DRAFT_KEY), []);

  const handleGuestImport = (envelope: any) => {
    try {
      const title = envelope.resume?.title || envelope.title || "My Resume";
      const content = envelope.resume?.content || envelope.content;
      const design = envelope.resume?.design || envelope.design || DEFAULT_DESIGN;
      const templateId = envelope.resume?.templateId || envelope.templateId || "modern";

      if (content) {
        const draft = {
          title,
          content,
          design,
          templateId,
          version: 1,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(GUEST_DRAFT_KEY, JSON.stringify(draft));
      }
    } catch (e) {
      console.warn("Failed storing imported draft in localStorage:", e);
    }
  };

  return (
    <ResumeEditor
      initial={{
        title: initialData.title,
        content: initialData.content,
        design: initialData.design,
        templateId: initialData.templateId,
        version: initialData.version,
      }}
      persistence={persistence}
      onImport={handleGuestImport}
    />
  );
}
