import React, { useState, useEffect, useMemo } from "react";
import type { Route } from "./+types/build";
import { ResumeEditor } from "~/components/editor/ResumeEditor";
import { createLocalPersistence } from "~/lib/resume/persistence";
import { getSample } from "~/lib/resume/samples";
import { DEFAULT_DESIGN } from "~/lib/resume/design-tokens";
import type { ResumeContent, ResumeDesign, TemplateId } from "~/lib/schemas/resume";
import type { ExportEnvelope } from "~/lib/export/json";

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

const GUEST_DRAFT_KEY = "resumint_guest_draft";

export default function GuestBuildRoute() {
  const [initialData, setInitialData] = useState<{
    title: string;
    content: ResumeContent;
    design: ResumeDesign;
    templateId: TemplateId;
    version: number;
  } | null>(null);

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

    // Default to developer sample for instant guest gratification
    const sample = getSample("developer");
    setInitialData({
      title: "Untitled Resume",
      content: sample ? sample.content : ({} as ResumeContent),
      design: DEFAULT_DESIGN,
      templateId: "modern",
      version: 1,
    });
  }, []);

  const persistence = useMemo(() => createLocalPersistence(GUEST_DRAFT_KEY), []);

  const handleGuestImport = (envelope: ExportEnvelope) => {
    try {
      const draft = {
        title: envelope.resume.title,
        content: envelope.resume.content,
        design: envelope.resume.design,
        templateId: envelope.resume.templateId,
        version: 1,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(GUEST_DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {
      console.warn("Failed storing imported draft in localStorage:", e);
    }
  };

  if (!initialData) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">Loading Resume Canvas...</p>
        </div>
      </div>
    );
  }

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
