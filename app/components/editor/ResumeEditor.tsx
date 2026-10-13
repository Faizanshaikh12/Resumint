import * as React from "react";
import { useBlocker } from "react-router";
import { Eye, Edit3 } from "lucide-react";
import { editorReducer, type EditorAction } from "~/lib/resume/editor-state";
import type { ResumePersistence, SaveResult } from "~/lib/resume/persistence";
import type { ResumeContent, ResumeDesign, TemplateId } from "~/lib/schemas/resume";
import { ResumePreview } from "../preview/ResumePreview";
import { EditorContext, type SaveStatus } from "./EditorContext";
import { EditorHeader } from "./EditorHeader";
import { EditorNav } from "./EditorNav";
import { AwardsForm } from "./forms/AwardsForm";
import { CertificationsForm } from "./forms/CertificationsForm";
import { CustomSectionForm } from "./forms/CustomSectionForm";
import { EducationForm } from "./forms/EducationForm";
import { ExperienceForm } from "./forms/ExperienceForm";
import { InterestsForm } from "./forms/InterestsForm";
import { LanguagesForm } from "./forms/LanguagesForm";
import { PersonalInfoForm } from "./forms/PersonalInfoForm";
import { ProjectsForm } from "./forms/ProjectsForm";
import { PublicationsForm } from "./forms/PublicationsForm";
import { ReferencesForm } from "./forms/ReferencesForm";
import { SkillsForm } from "./forms/SkillsForm";
import { SummaryForm } from "./forms/SummaryForm";
import { VolunteeringForm } from "./forms/VolunteeringForm";

export interface ResumeEditorProps {
  initial: {
    id?: string;
    title: string;
    content: ResumeContent;
    design: ResumeDesign;
    templateId: TemplateId;
    version?: number;
  };
  persistence: ResumePersistence;
}

export function ResumeEditor({ initial, persistence }: ResumeEditorProps) {
  const [content, dispatchBase] = React.useReducer(editorReducer, initial.content);
  const [title, setTitle] = React.useState(initial.title);
  const [version, setVersion] = React.useState(initial.version ?? 1);
  const [isDirty, setIsDirty] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("idle");
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null);
  const [activeSection, setActiveSection] = React.useState<string>("personal");

  // Mobile tab state
  const [mobileTab, setMobileTab] = React.useState<"edit" | "preview">("edit");

  // Wrap dispatch to mark dirty on content changes
  const dispatch: React.Dispatch<EditorAction> = React.useCallback(
    (action) => {
      dispatchBase(action);
      setIsDirty(true);
      if (saveStatus === "saved") {
        setSaveStatus("idle");
      }
    },
    [saveStatus]
  );

  // Unsaved changes protection: React Router useBlocker
  const blocker = useBlocker(
    React.useCallback(
      ({ currentLocation, nextLocation }: any) =>
        isDirty && currentLocation.pathname !== nextLocation.pathname,
      [isDirty]
    )
  );

  React.useEffect(() => {
    if (blocker.state === "blocked") {
      const proceed = window.confirm(
        "You have unsaved changes. Are you sure you want to leave this page?"
      );
      if (proceed) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);

  // Unsaved changes protection: beforeunload browser event
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Manual save handler
  const handleSave = async (): Promise<SaveResult> => {
    setSaveStatus("saving");
    setSaveError(null);

    const result = await persistence.save(content, version);

    if (result.ok) {
      setVersion(result.version);
      setIsDirty(false);
      setSaveStatus("saved");
      setLastSavedAt(result.updatedAt ? new Date(result.updatedAt) : new Date());
    } else if (result.reason === "conflict") {
      setSaveStatus("conflict");
      setSaveError(
        `Version conflict detected. Server has version ${result.serverVersion}, your expected version is ${version}.`
      );
    } else {
      setSaveStatus("error");
      setSaveError(result.error);
    }

    return result;
  };

  // Title rename handler
  const handleRename = async (newTitle: string): Promise<boolean> => {
    if (!persistence.rename) {
      setTitle(newTitle);
      return true;
    }

    const res = await persistence.rename(newTitle);
    if (res.ok) {
      setTitle(res.title);
      return true;
    } else {
      setSaveError(res.error);
      return false;
    }
  };

  const renderActiveSectionForm = () => {
    switch (activeSection) {
      case "personal":
        return <PersonalInfoForm />;
      case "summary":
        return <SummaryForm />;
      case "experience":
        return <ExperienceForm />;
      case "education":
        return <EducationForm />;
      case "skills":
        return <SkillsForm />;
      case "languages":
        return <LanguagesForm />;
      case "projects":
        return <ProjectsForm />;
      case "certifications":
        return <CertificationsForm />;
      case "awards":
        return <AwardsForm />;
      case "publications":
        return <PublicationsForm />;
      case "volunteering":
        return <VolunteeringForm />;
      case "interests":
        return <InterestsForm />;
      case "references":
        return <ReferencesForm />;
      default:
        return <CustomSectionForm sectionId={activeSection} />;
    }
  };

  const contextValue = React.useMemo(
    () => ({
      content,
      dispatch,
      isDirty,
      saveStatus,
      saveError,
      lastSavedAt,
      version,
      title,
      templateId: initial.templateId,
      design: initial.design,
      activeSection,
      setActiveSection,
      save: handleSave,
      rename: handleRename,
      persistence,
    }),
    [
      content,
      dispatch,
      isDirty,
      saveStatus,
      saveError,
      lastSavedAt,
      version,
      title,
      initial.templateId,
      initial.design,
      activeSection,
      persistence,
    ]
  );

  return (
    <EditorContext.Provider value={contextValue}>
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        <EditorHeader />

        {/* Mobile Tab Switcher */}
        <div className="flex md:hidden border-b bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setMobileTab("edit")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors ${
              mobileTab === "edit"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors ${
              mobileTab === "preview"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Preview</span>
          </button>
        </div>

        {/* Main Work Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Edit Pane */}
          <div
            className={`flex flex-1 md:w-1/2 md:border-r overflow-hidden ${
              mobileTab === "preview" ? "hidden md:flex" : "flex"
            }`}
          >
            {/* Left Nav */}
            <div className="hidden sm:block">
              <EditorNav />
            </div>

            {/* Active Form */}
            <main
              tabIndex={-1}
              className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto focus:outline-none"
              data-testid="editor-active-form-container"
            >
              <div className="sm:hidden mb-4 pb-3 border-b">
                <EditorNav />
              </div>
              {renderActiveSectionForm()}
            </main>
          </div>

          {/* Live Preview Pane */}
          <div
            tabIndex={0}
            role="region"
            aria-label="Resume document preview"
            className={`flex-1 md:w-1/2 overflow-y-auto bg-stone-100 dark:bg-stone-900 p-4 sm:p-8 items-start justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              mobileTab === "edit" ? "hidden md:flex" : "flex"
            }`}
            data-testid="editor-preview-pane"
          >
            <div className="w-full flex justify-center">
              <ResumePreview
                content={content}
                design={initial.design}
                templateId={initial.templateId}
              />
            </div>
          </div>
        </div>
      </div>
    </EditorContext.Provider>
  );
}
