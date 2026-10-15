import * as React from "react";
import { useBlocker, useSearchParams } from "react-router";
import { Eye, Edit3 } from "lucide-react";
import { toast } from "~/components/ui/sonner";
import { editorReducer, type EditorAction } from "~/lib/resume/editor-state";
import type { ResumePersistence, SaveResult } from "~/lib/resume/persistence";
import type { ResumeContent, ResumeDesign, TemplateId } from "~/lib/schemas/resume";
import { getTemplate } from "~/components/templates/registry";
import { applyTemplateToResume } from "~/lib/resume/template-apply";
import { mergeTouchedDesign } from "~/lib/resume/touched-merge";
import { normalizeDesign } from "~/lib/resume/normalize-design";
import { ResumePreview } from "../preview/ResumePreview";
import { PrintRoot } from "~/components/export/PrintRoot";
import { EditorContext, type EditorContextValue, type SaveStatus } from "./EditorContext";
import { EditorHeader } from "./EditorHeader";
import { EditorNav } from "./EditorNav";
import { DesignPanel } from "./DesignPanel";
import { TemplateGalleryModal } from "./TemplateGalleryModal";
import { AtsCheckerPanel } from "~/components/ats/AtsCheckerPanel";
import { buildAtsContext } from "~/lib/ats/context";
import { analyze } from "~/lib/ats/analyze";
import { focusField } from "~/lib/ats/field-focus";
import type { FieldTarget } from "~/lib/ats/types";
import type { EditorTab } from "./EditorContext";
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
  onImport?: (envelope: any) => void;
}

interface HistorySnapshot {
  content: ResumeContent;
  design: ResumeDesign;
  templateId: TemplateId;
  touchedFields: string[];
}

export function ResumeEditor({ initial, persistence, onImport }: ResumeEditorProps) {
  const [content, setContent] = React.useState<ResumeContent>(initial.content);
  const [design, setDesign] = React.useState<ResumeDesign>(initial.design);
  const [templateId, setTemplateId] = React.useState<TemplateId>(initial.templateId || "modern");
  const [touchedFields, setTouchedFields] = React.useState<Set<string>>(new Set<string>());
  const [editorTab, setEditorTab] = React.useState<EditorTab>("content");
  const [pageCount, setPageCount] = React.useState<number | undefined>(undefined);

  // Debounced ATS analysis using React 19 / 18 useDeferredValue
  const deferredContent = React.useDeferredValue(content);
  const deferredDesign = React.useDeferredValue(design);

  const atsContext = React.useMemo(
    () => buildAtsContext(deferredContent, deferredDesign, { pageCount }),
    [deferredContent, deferredDesign, pageCount]
  );

  const atsReport = React.useMemo(
    () => analyze(deferredContent, deferredDesign, { pageCount }),
    [deferredContent, deferredDesign, pageCount]
  );

  const isAtsUpdating = content !== deferredContent;

  const handleNavigateToField = React.useCallback(
    (targets?: FieldTarget[]) => {
      if (!targets || targets.length === 0) return;
      const target = targets[0]!;
      focusField(target, { setActiveSection, setEditorTab });
    },
    []
  );

  const [past, setPast] = React.useState<HistorySnapshot[]>([]);
  const [future, setFuture] = React.useState<HistorySnapshot[]>([]);
  const lastDesignChangeRef = React.useRef<{ time: number; field?: string }>({ time: 0 });

  const [searchParams] = useSearchParams();
  const [galleryOpen, setGalleryOpen] = React.useState(() => {
    return (
      searchParams.get("openGallery") === "true" ||
      searchParams.get("action") === "templates"
    );
  });

  const [title, setTitle] = React.useState(initial.title);
  const [version, setVersion] = React.useState(initial.version ?? 1);
  const [isDirty, setIsDirty] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("idle");
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null);
  const [activeSection, setActiveSection] = React.useState<string>("personal");

  // Mobile tab state
  const [mobileTab, setMobileTab] = React.useState<"edit" | "preview">("edit");

  // Undo
  const undo = React.useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    if (!previous) return;

    setFuture((prev) => [
      {
        content,
        design,
        templateId,
        touchedFields: Array.from(touchedFields),
      },
      ...prev,
    ]);
    setPast((prev) => prev.slice(0, -1));

    setContent(previous.content);
    setDesign(previous.design);
    setTemplateId(previous.templateId);
    setTouchedFields(new Set(previous.touchedFields));
    setIsDirty(true);
    if (saveStatus === "saved") {
      setSaveStatus("idle");
    }
  }, [past, content, design, templateId, touchedFields, saveStatus]);

  // Redo
  const redo = React.useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    if (!next) return;

    setPast((prev) => [
      ...prev.slice(-49),
      {
        content,
        design,
        templateId,
        touchedFields: Array.from(touchedFields),
      },
    ]);
    setFuture((prev) => prev.slice(1));

    setContent(next.content);
    setDesign(next.design);
    setTemplateId(next.templateId);
    setTouchedFields(new Set(next.touchedFields));
    setIsDirty(true);
    if (saveStatus === "saved") {
      setSaveStatus("idle");
    }
  }, [future, content, design, templateId, touchedFields, saveStatus]);

  // Content dispatch with undo history
  const dispatch: React.Dispatch<EditorAction> = React.useCallback(
    (action) => {
      setContent((prevContent) => {
        const nextContent = editorReducer(prevContent, action);
        setPast((prevPast) => [
          ...prevPast.slice(-49),
          {
            content: prevContent,
            design,
            templateId,
            touchedFields: Array.from(touchedFields),
          },
        ]);
        setFuture([]);
        return nextContent;
      });

      setIsDirty(true);
      if (saveStatus === "saved") {
        setSaveStatus("idle");
      }
    },
    [design, templateId, touchedFields, saveStatus]
  );

  // Template switching with copy-on-apply architecture
  const setTemplate = React.useCallback(
    (newTemplateId: TemplateId, options?: { keepColorAndPageSize?: boolean }) => {
      if (newTemplateId === templateId && !options) return;

      setPast((prev) => [
        ...prev.slice(-49),
        {
          content,
          design,
          templateId,
          touchedFields: Array.from(touchedFields),
        },
      ]);
      setFuture([]);

      const result = applyTemplateToResume(design, newTemplateId, options);

      setTemplateId(result.newTemplateId);
      setDesign(result.newDesign);
      setIsDirty(true);
      if (saveStatus === "saved") {
        setSaveStatus("idle");
      }

      const targetTemplate = getTemplate(newTemplateId);
      toast.success(`Applied ${targetTemplate.name} template`, {
        action: {
          label: "Undo",
          onClick: () => undo(),
        },
      });
    },
    [content, design, templateId, touchedFields, saveStatus, undo]
  );

  // Design update with slider coalescing and touched tracking
  const updateDesign = React.useCallback(
    (patch: Partial<ResumeDesign>, fieldName?: string) => {
      const now = Date.now();
      const isCoalescing =
        fieldName &&
        lastDesignChangeRef.current.field === fieldName &&
        now - lastDesignChangeRef.current.time < 400;

      lastDesignChangeRef.current = { time: now, field: fieldName };

      if (!isCoalescing) {
        setPast((prev) => [
          ...prev.slice(-49),
          {
            content,
            design,
            templateId,
            touchedFields: Array.from(touchedFields),
          },
        ]);
        setFuture([]);
      }

      if (fieldName) {
        setTouchedFields((prev) => {
          const next = new Set(prev);
          next.add(fieldName);
          return next;
        });
      }

      setDesign((prevDesign) => ({
        ...prevDesign,
        ...patch,
      }));
      setIsDirty(true);
      if (saveStatus === "saved") {
        setSaveStatus("idle");
      }
    },
    [content, design, templateId, touchedFields, saveStatus]
  );

  // Reset design back to template defaults
  const resetDesign = React.useCallback(() => {
    setPast((prev) => [
      ...prev.slice(-49),
      {
        content,
        design,
        templateId,
        touchedFields: Array.from(touchedFields),
      },
    ]);
    setFuture([]);

    const targetTemplate = getTemplate(templateId);
    setDesign(targetTemplate.defaultDesign);
    setTouchedFields(new Set<string>());
    setIsDirty(true);
    if (saveStatus === "saved") {
      setSaveStatus("idle");
    }
  }, [content, design, templateId, touchedFields, saveStatus]);

  // Keyboard shortcut listener for Undo/Redo
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const isMac =
        typeof navigator !== "undefined" &&
        /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (!mod) return;

      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

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
  const handleSave = React.useCallback(async (): Promise<SaveResult> => {
    setSaveStatus("saving");
    setSaveError(null);

    const result = await persistence.save(content, version, design, templateId);

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
  }, [persistence, content, version, design, templateId]);

  // Debounced autosave (2500ms inactivity when dirty)
  React.useEffect(() => {
    if (!isDirty || saveStatus === "saving") return;

    const timer = setTimeout(() => {
      void handleSave();
    }, 2500);

    return () => clearTimeout(timer);
  }, [isDirty, content, design, templateId, saveStatus, handleSave]);

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

  // Apply imported JSON envelope to editor state
  const handleApplyImport = React.useCallback(
    (envelope: any) => {
      setPast((prev) => [
        ...prev.slice(-49),
        {
          content,
          design,
          templateId,
          touchedFields: Array.from(touchedFields),
        },
      ]);
      setFuture([]);

      const nextContent = envelope.resume?.content || envelope.content;
      const nextDesign = envelope.resume?.design || envelope.design;
      const nextTemplateId = envelope.resume?.templateId || envelope.templateId;
      const nextTitle = envelope.resume?.title || envelope.title;

      if (nextContent) {
        setContent(nextContent);
      }
      if (nextDesign) {
        setDesign(nextDesign);
      }
      if (nextTemplateId) {
        setTemplateId(nextTemplateId);
      }
      if (nextTitle) {
        setTitle(nextTitle);
      }
      setIsDirty(true);
      onImport?.(envelope);
    },
    [content, design, templateId, touchedFields, onImport]
  );

  const contextValue = React.useMemo<EditorContextValue>(
    () => ({
      id: initial.id,
      content,
      dispatch,
      isDirty,
      saveStatus,
      saveError,
      lastSavedAt,
      version,
      title,
      templateId,
      design,
      touchedFields,
      editorTab,
      setEditorTab,
      pageCount,
      atsReport,
      atsContext,
      isAtsUpdating,
      setTemplate,
      openTemplateGallery: () => setGalleryOpen(true),
      updateDesign,
      resetDesign,
      undo,
      redo,
      canUndo: past.length > 0,
      canRedo: future.length > 0,
      activeSection,
      setActiveSection,
      save: handleSave,
      rename: handleRename,
      persistence,
      onImport: handleApplyImport,
    }),
    [
      initial.id,
      content,
      dispatch,
      isDirty,
      saveStatus,
      saveError,
      lastSavedAt,
      version,
      title,
      templateId,
      design,
      touchedFields,
      editorTab,
      pageCount,
      atsReport,
      atsContext,
      isAtsUpdating,
      setTemplate,
      updateDesign,
      resetDesign,
      undo,
      redo,
      past.length,
      future.length,
      activeSection,
      handleSave,
      handleRename,
      persistence,
      handleApplyImport,
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
            className={`flex flex-1 md:w-1/2 md:border-r overflow-hidden no-print editor-edit-pane ${
              mobileTab === "preview" ? "hidden md:flex" : "flex"
            }`}
          >
            {editorTab === "check" ? (
              <main
                tabIndex={-1}
                className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto focus:outline-none"
                data-testid="editor-check-pane"
              >
                <AtsCheckerPanel
                  report={atsReport}
                  context={atsContext}
                  resumeId={initial.id}
                  onNavigate={handleNavigateToField}
                  isUpdating={isAtsUpdating}
                />
              </main>
            ) : editorTab === "design" ? (
              <main
                tabIndex={-1}
                className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto focus:outline-none"
                data-testid="editor-design-pane"
              >
                <DesignPanel
                  templateId={templateId}
                  design={design}
                  onSelectTemplate={setTemplate}
                  onUpdateDesign={updateDesign}
                  onResetDesign={resetDesign}
                />
              </main>
            ) : (
              <>
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
              </>
            )}
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
              <PrintRoot design={design}>
                <ResumePreview
                  content={content}
                  design={design}
                  templateId={templateId}
                  onPageCountChange={setPageCount}
                />
              </PrintRoot>
            </div>
          </div>
        </div>

        <TemplateGalleryModal
          open={galleryOpen}
          onOpenChange={setGalleryOpen}
          currentTemplateId={templateId}
          currentDesign={design}
          onApplyTemplate={setTemplate}
          onUndo={undo}
          canUndo={past.length > 0}
        />
      </div>
    </EditorContext.Provider>
  );
}
