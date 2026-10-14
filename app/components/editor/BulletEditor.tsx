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
import { nanoid } from "nanoid";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";

export interface BulletEditorProps {
  bullets: string[];
  maxBullets?: number;
  maxChars?: number;
  onAddBullet: (text?: string, index?: number) => void;
  onRemoveBullet: (bulletIndex: number) => void;
  onMoveBullet: (fromIndex: number, toIndex: number) => void;
  onUpdateBullet: (bulletIndex: number, text: string) => void;
}

interface SortableBulletItemProps {
  id: string;
  index: number;
  text: string;
  maxChars: number;
  inputRef: (el: HTMLInputElement | null) => void;
  onChange: (val: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}

function SortableBulletItem({
  id,
  index,
  text,
  maxChars,
  inputRef,
  onChange,
  onKeyDown,
  onRemove,
}: SortableBulletItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-1.5 group py-1"
    >
      {/* Accessible Drag Handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Drag to reorder bullet point ${index + 1}`}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Bullet Input */}
      <input
        ref={inputRef}
        type="text"
        data-bullet-index={index}
        data-field-path={`bullet.${index}`}
        value={text}
        maxLength={maxChars}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Add an achievement, metric, or responsibility..."
        className="flex-1 bg-transparent border rounded-md px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Bullet point ${index + 1}`}
      />

      {/* Delete Button */}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Delete bullet point ${index + 1}`}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-muted-foreground hover:text-destructive p-1 rounded transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function BulletEditor({
  bullets = [],
  maxBullets = 15,
  maxChars = 500,
  onAddBullet,
  onRemoveBullet,
  onMoveBullet,
  onUpdateBullet,
}: BulletEditorProps) {
  // Stable IDs for dnd-kit sortable
  const idsRef = React.useRef<string[]>([]);
  while (idsRef.current.length < bullets.length) {
    idsRef.current.push(nanoid());
  }
  if (idsRef.current.length > bullets.length) {
    idsRef.current = idsRef.current.slice(0, bullets.length);
  }

  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

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

    const fromIndex = idsRef.current.indexOf(String(active.id));
    const toIndex = idsRef.current.indexOf(String(over.id));

    if (fromIndex !== -1 && toIndex !== -1) {
      // Reorder IDs ref to match
      const [movedId] = idsRef.current.splice(fromIndex, 1);
      if (movedId) {
        idsRef.current.splice(toIndex, 0, movedId);
      }
      onMoveBullet(fromIndex, toIndex);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (bullets.length < maxBullets) {
        // Insert new bullet right below current
        idsRef.current.splice(index + 1, 0, nanoid());
        onAddBullet("", index + 1);
        setTimeout(() => {
          inputRefs.current[index + 1]?.focus();
        }, 10);
      }
    } else if (e.key === "Backspace") {
      const currentVal = bullets[index];
      if (currentVal === "" && bullets.length > 1) {
        e.preventDefault();
        idsRef.current.splice(index, 1);
        onRemoveBullet(index);
        setTimeout(() => {
          const focusIndex = Math.max(0, index - 1);
          inputRefs.current[focusIndex]?.focus();
        }, 10);
      }
    }
  };

  const handleManualAdd = () => {
    if (bullets.length >= maxBullets) return;
    idsRef.current.push(nanoid());
    onAddBullet("");
    setTimeout(() => {
      inputRefs.current[bullets.length]?.focus();
    }, 10);
  };

  const handleRemove = (index: number) => {
    idsRef.current.splice(index, 1);
    onRemoveBullet(index);
  };

  return (
    <div className="space-y-1 mt-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground font-medium mb-1">
        <span>Bullet Points ({bullets.length}/{maxBullets})</span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={idsRef.current}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1">
            {bullets.map((text, idx) => (
              <SortableBulletItem
                key={idsRef.current[idx] || `bullet-${idx}`}
                id={idsRef.current[idx] || `bullet-${idx}`}
                index={idx}
                text={text}
                maxChars={maxChars}
                inputRef={(el) => {
                  inputRefs.current[idx] = el;
                }}
                onChange={(val) => onUpdateBullet(idx, val)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onRemove={() => handleRemove(idx)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {bullets.length < maxBullets && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleManualAdd}
          className="text-xs h-7 gap-1.5 mt-2"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add bullet point</span>
        </Button>
      )}
    </div>
  );
}
