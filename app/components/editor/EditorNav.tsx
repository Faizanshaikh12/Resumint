import * as React from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Trash2,
  FileText,
  Briefcase,
  GraduationCap,
  Sparkles,
  Languages,
  FolderGit2,
  Award,
  BookOpen,
  HeartHandshake,
  Heart,
  Users,
  Compass,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { getSectionMeta } from "~/lib/resume/section-registry";
import { useEditor } from "./EditorContext";

const SECTION_ICONS: Record<string, React.ElementType> = {
  personal: FileText,
  summary: Sparkles,
  experience: Briefcase,
  education: GraduationCap,
  skills: Sparkles,
  languages: Languages,
  projects: FolderGit2,
  certifications: Award,
  awards: Award,
  publications: BookOpen,
  volunteering: HeartHandshake,
  interests: Heart,
  references: Users,
};

interface SortableSectionItemProps {
  id: string;
  label: string;
  isActive: boolean;
  isHidden: boolean;
  isCustom: boolean;
  onSelect: () => void;
  onToggleHidden: () => void;
  onDeleteCustom?: () => void;
}

function SortableSectionItem({
  id,
  label,
  isActive,
  isHidden,
  isCustom,
  onSelect,
  onToggleHidden,
  onDeleteCustom,
}: SortableSectionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  const IconComponent = SECTION_ICONS[id] || Compass;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between rounded-lg px-2 py-1.5 text-xs transition-colors ${
        isActive
          ? "bg-primary/10 text-primary font-semibold"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${label} section`}
          className="cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-foreground p-0.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        {/* Section Select / Jump */}
        <button
          type="button"
          onClick={onSelect}
          className="flex items-center gap-2 min-w-0 text-left flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1"
        >
          <IconComponent className="h-3.5 w-3.5 shrink-0" />
          <span className={`truncate ${isHidden ? "line-through opacity-60" : ""}`}>
            {label}
          </span>
        </button>
      </div>

      <div className="flex items-center gap-1 shrink-0 ml-1">
        {/* Toggle Hidden */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleHidden();
          }}
          aria-label={isHidden ? `Show ${label} section` : `Hide ${label} section`}
          title={isHidden ? "Hidden from resume (click to show)" : "Visible (click to hide)"}
          className={`p-1 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            isHidden
              ? "text-amber-500 hover:text-amber-600"
              : "text-muted-foreground/60 hover:text-foreground"
          }`}
        >
          {isHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>

        {/* Delete Custom Section */}
        {isCustom && onDeleteCustom && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteCustom();
            }}
            aria-label={`Delete custom section ${label}`}
            className="p-1 rounded text-muted-foreground/60 hover:text-destructive transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </li>
  );
}

export function EditorNav() {
  const { content, dispatch, activeSection, setActiveSection } = useEditor();
  const { sectionOrder = [], hiddenSections = [], customSections = [] } = content;

  const hiddenSet = React.useMemo(() => new Set(hiddenSections), [hiddenSections]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const fromIndex = sectionOrder.indexOf(String(active.id));
    const toIndex = sectionOrder.indexOf(String(over.id));

    if (fromIndex !== -1 && toIndex !== -1) {
      dispatch({
        type: "REORDER_SECTIONS",
        fromIndex,
        toIndex,
      });
    }
  };

  const handleAddCustomSection = () => {
    dispatch({
      type: "ADD_SECTION",
      title: "Custom Section",
    });
  };

  const handleDeleteCustomSection = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete the "${title}" section?`)) {
      dispatch({
        type: "REMOVE_SECTION",
        sectionId: id,
      });
      if (activeSection === id) {
        setActiveSection("personal");
      }
    }
  };

  return (
    <nav
      aria-label="Resume sections navigation"
      className="w-full sm:w-60 shrink-0 border-r bg-card p-3 space-y-4 h-full overflow-y-auto"
    >
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2 mb-2">
          Fixed Header
        </div>
        <button
          type="button"
          onClick={() => setActiveSection("personal")}
          className={`w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-left transition-colors ${
            activeSection === "personal"
              ? "bg-primary/10 text-primary font-semibold"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Personal Info</span>
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground px-2 mb-2">
          <span>Sections ({sectionOrder.length})</span>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sectionOrder}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-0.5">
              {sectionOrder.map((secId) => {
                const customSec = customSections.find((s) => s.id === secId);
                const meta = getSectionMeta(secId, customSec?.title);
                const isCustom = Boolean(customSec);

                return (
                  <SortableSectionItem
                    key={secId}
                    id={secId}
                    label={meta.label}
                    isActive={activeSection === secId}
                    isHidden={hiddenSet.has(secId)}
                    isCustom={isCustom}
                    onSelect={() => setActiveSection(secId)}
                    onToggleHidden={() =>
                      dispatch({
                        type: "TOGGLE_SECTION_HIDDEN",
                        sectionId: secId,
                      })
                    }
                    onDeleteCustom={
                      isCustom
                        ? () => handleDeleteCustomSection(secId, meta.label)
                        : undefined
                    }
                  />
                );
              })}
            </ul>
          </SortableContext>
        </DndContext>
      </div>

      <div className="pt-2 border-t">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddCustomSection}
          className="w-full text-xs h-8 gap-1.5 justify-center"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Custom Section</span>
        </Button>
      </div>
    </nav>
  );
}
