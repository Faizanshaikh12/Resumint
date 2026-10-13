import * as React from "react";
import type { EditorAction } from "~/lib/resume/editor-state";
import type { ResumePersistence, SaveResult } from "~/lib/resume/persistence";
import type { ResumeContent, ResumeDesign, TemplateId } from "~/lib/schemas/resume";

export type SaveStatus = "idle" | "saving" | "saved" | "conflict" | "error";

export interface EditorContextValue {
  content: ResumeContent;
  dispatch: React.Dispatch<EditorAction>;
  isDirty: boolean;
  saveStatus: SaveStatus;
  saveError: string | null;
  lastSavedAt: Date | null;
  version: number;
  title: string;
  templateId: TemplateId;
  design: ResumeDesign;
  activeSection: string;
  setActiveSection: (secId: string) => void;
  save: () => Promise<SaveResult>;
  rename: (newTitle: string) => Promise<boolean>;
  persistence: ResumePersistence;
}

export const EditorContext = React.createContext<EditorContextValue | null>(null);

export function useEditor(): EditorContextValue {
  const context = React.useContext(EditorContext);
  if (!context) {
    throw new Error("useEditor must be used within an EditorProvider");
  }
  return context;
}
