import * as React from "react";
import type { EditorAction } from "~/lib/resume/editor-state";
import type { ResumePersistence, SaveResult } from "~/lib/resume/persistence";
import type { ResumeContent, ResumeDesign, TemplateId } from "~/lib/schemas/resume";

export type SaveStatus = "idle" | "saving" | "saved" | "conflict" | "error";

export type EditorTab = "content" | "design" | "check";

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
  touchedFields: Set<string>;
  editorTab: EditorTab;
  setEditorTab: (tab: EditorTab) => void;
  pageCount?: number;
  atsReport?: any;
  atsContext?: any;
  isAtsUpdating?: boolean;
  setTemplate: (id: TemplateId) => void;
  updateDesign: (patch: Partial<ResumeDesign>, fieldName?: string) => void;
  resetDesign: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  activeSection: string;
  setActiveSection: (secId: string) => void;
  id?: string;
  save: () => Promise<SaveResult>;
  rename: (newTitle: string) => Promise<boolean>;
  persistence: ResumePersistence;
  onImport?: (envelope: any) => void;
}

export const EditorContext = React.createContext<EditorContextValue | null>(null);

export function useEditor(): EditorContextValue {
  const context = React.useContext(EditorContext);
  if (!context) {
    throw new Error("useEditor must be used within an EditorProvider");
  }
  return context;
}
