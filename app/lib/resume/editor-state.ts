import { nanoid } from "nanoid";
import type {
  CustomSection,
  CustomSectionItem,
  PersonalInfo,
  ResumeContent,
  ResumeLink,
} from "../schemas/resume";
import { arrayMove, normalizeSectionOrder } from "./reorder";
import { STANDARD_SECTION_IDS } from "./section-registry";

export type EditorAction =
  | {
      type: "UPDATE_FIELD";
      section: string;
      field?: string;
      itemId?: string;
      value: unknown;
    }
  | {
      type: "UPDATE_FIELD_PATH";
      path: (string | number)[];
      value: unknown;
    }
  | {
      type: "ADD_ITEM";
      section: string;
      item: Record<string, unknown>;
    }
  | {
      type: "REMOVE_ITEM";
      section: string;
      itemId: string;
    }
  | {
      type: "MOVE_ITEM";
      section: string;
      fromIndex: number;
      toIndex: number;
    }
  | {
      type: "ADD_SECTION";
      title?: string;
      sectionId?: string;
    }
  | {
      type: "REMOVE_SECTION";
      sectionId: string;
    }
  | {
      type: "RENAME_SECTION";
      sectionId: string;
      title: string;
    }
  | {
      type: "REORDER_SECTIONS";
      newOrder?: string[];
      fromIndex?: number;
      toIndex?: number;
    }
  | {
      type: "TOGGLE_SECTION_HIDDEN";
      sectionId: string;
    }
  | {
      type: "ADD_BULLET";
      section: string;
      itemId: string;
      text?: string;
      index?: number;
    }
  | {
      type: "REMOVE_BULLET";
      section: string;
      itemId: string;
      bulletIndex: number;
    }
  | {
      type: "MOVE_BULLET";
      section: string;
      itemId: string;
      fromIndex: number;
      toIndex: number;
    }
  | {
      type: "REPLACE_CONTENT";
      content: ResumeContent;
    };

/**
 * Gets the list of all known section IDs (standard + custom sections).
 */
export function getAllSectionIds(content: ResumeContent): string[] {
  const customIds = (content.customSections || []).map((cs) => cs.id);
  return [...STANDARD_SECTION_IDS, ...customIds];
}

/**
 * Helper to update a nested property along a path immutably.
 */
function updateNestedPath(obj: any, path: (string | number)[], value: unknown): any {
  if (path.length === 0) return value;
  const [head, ...tail] = path;
  if (head === undefined) return obj;

  if (Array.isArray(obj)) {
    const idx = typeof head === "number" ? head : parseInt(head, 10);
    const newArr = [...obj];
    newArr[idx] = updateNestedPath(newArr[idx], tail, value);
    return newArr;
  }

  const record = (obj && typeof obj === "object" ? { ...obj } : {}) as Record<string, unknown>;
  record[head] = updateNestedPath(record[head], tail, value);
  return record;
}

/**
 * Pure, immutable reducer for resume content state.
 */
export function editorReducer(state: ResumeContent, action: EditorAction): ResumeContent {
  switch (action.type) {
    case "UPDATE_FIELD": {
      const { section, field, itemId, value } = action;

      // Updating personal info
      if (section === "personal") {
        if (!field) return state;
        return {
          ...state,
          personal: {
            ...state.personal,
            [field]: value,
          },
        };
      }

      // Updating summary
      if (section === "summary") {
        return {
          ...state,
          summary: typeof value === "string" ? value : String(value ?? ""),
        };
      }

      // Updating personal links
      if (section === "personal.links" && itemId && field) {
        return {
          ...state,
          personal: {
            ...state.personal,
            links: (state.personal.links || []).map((l) =>
              l.id === itemId ? { ...l, [field]: value } : l
            ),
          },
        };
      }

      // Updating an item in a standard multi-item section
      if (section in state && Array.isArray((state as any)[section]) && itemId && field) {
        const list = (state as any)[section] as Array<{ id: string } & Record<string, unknown>>;
        return {
          ...state,
          [section]: list.map((item) =>
            item.id === itemId ? { ...item, [field]: value } : item
          ),
        };
      }

      // Updating an item in a custom section
      const customSectionIndex = (state.customSections || []).findIndex((s) => s.id === section);
      if (customSectionIndex !== -1 && itemId && field) {
        const customSec = state.customSections[customSectionIndex]!;
        const updatedCustomSections = [...state.customSections];
        updatedCustomSections[customSectionIndex] = {
          ...customSec,
          items: customSec.items.map((item) =>
            item.id === itemId ? { ...item, [field]: value } : item
          ),
        };
        return {
          ...state,
          customSections: updatedCustomSections,
        };
      }

      return state;
    }

    case "UPDATE_FIELD_PATH": {
      return updateNestedPath(state, action.path, action.value) as ResumeContent;
    }

    case "ADD_ITEM": {
      const { section, item } = action;

      // Personal link
      if (section === "personal.links") {
        return {
          ...state,
          personal: {
            ...state.personal,
            links: [...(state.personal.links || []), item as unknown as ResumeLink],
          },
        };
      }

      // Standard multi-item sections
      if (section in state && Array.isArray((state as any)[section])) {
        const currentList = (state as any)[section] as unknown[];
        return {
          ...state,
          [section]: [...currentList, item],
        };
      }

      // Custom section
      const customIndex = (state.customSections || []).findIndex((s) => s.id === section);
      if (customIndex !== -1) {
        const customSec = state.customSections[customIndex]!;
        const updated = [...state.customSections];
        updated[customIndex] = {
          ...customSec,
          items: [...customSec.items, item as unknown as CustomSectionItem],
        };
        return {
          ...state,
          customSections: updated,
        };
      }

      return state;
    }

    case "REMOVE_ITEM": {
      const { section, itemId } = action;

      // Personal links
      if (section === "personal.links") {
        return {
          ...state,
          personal: {
            ...state.personal,
            links: (state.personal.links || []).filter((l) => l.id !== itemId),
          },
        };
      }

      // Standard multi-item sections
      if (section in state && Array.isArray((state as any)[section])) {
        const list = (state as any)[section] as Array<{ id: string }>;
        return {
          ...state,
          [section]: list.filter((i) => i.id !== itemId),
        };
      }

      // Custom section
      const customIndex = (state.customSections || []).findIndex((s) => s.id === section);
      if (customIndex !== -1) {
        const customSec = state.customSections[customIndex]!;
        const updated = [...state.customSections];
        updated[customIndex] = {
          ...customSec,
          items: customSec.items.filter((i) => i.id !== itemId),
        };
        return {
          ...state,
          customSections: updated,
        };
      }

      return state;
    }

    case "MOVE_ITEM": {
      const { section, fromIndex, toIndex } = action;

      // Personal links
      if (section === "personal.links") {
        return {
          ...state,
          personal: {
            ...state.personal,
            links: arrayMove(state.personal.links || [], fromIndex, toIndex),
          },
        };
      }

      // Standard multi-item sections
      if (section in state && Array.isArray((state as any)[section])) {
        const list = (state as any)[section] as unknown[];
        return {
          ...state,
          [section]: arrayMove(list, fromIndex, toIndex),
        };
      }

      // Custom section
      const customIndex = (state.customSections || []).findIndex((s) => s.id === section);
      if (customIndex !== -1) {
        const customSec = state.customSections[customIndex]!;
        const updated = [...state.customSections];
        updated[customIndex] = {
          ...customSec,
          items: arrayMove(customSec.items, fromIndex, toIndex),
        };
        return {
          ...state,
          customSections: updated,
        };
      }

      return state;
    }

    case "ADD_SECTION": {
      const newId = action.sectionId || nanoid();
      const newTitle = action.title || "Custom Section";
      const newSection: CustomSection = {
        id: newId,
        title: newTitle,
        items: [],
      };

      const updatedCustomSections = [...(state.customSections || []), newSection];
      const updatedOrder = [...(state.sectionOrder || []), newId];

      return {
        ...state,
        customSections: updatedCustomSections,
        sectionOrder: updatedOrder,
      };
    }

    case "REMOVE_SECTION": {
      const { sectionId } = action;
      // Custom sections only - standard sections cannot be removed
      const exists = (state.customSections || []).some((s) => s.id === sectionId);
      if (!exists) return state;

      return {
        ...state,
        customSections: (state.customSections || []).filter((s) => s.id !== sectionId),
        sectionOrder: (state.sectionOrder || []).filter((id) => id !== sectionId),
        hiddenSections: (state.hiddenSections || []).filter((id) => id !== sectionId),
      };
    }

    case "RENAME_SECTION": {
      const { sectionId, title } = action;
      const customIndex = (state.customSections || []).findIndex((s) => s.id === sectionId);
      if (customIndex === -1) return state;

      const updated = [...state.customSections];
      updated[customIndex] = {
        ...updated[customIndex]!,
        title,
      };

      return {
        ...state,
        customSections: updated,
      };
    }

    case "REORDER_SECTIONS": {
      let nextOrder = [...(state.sectionOrder || [])];
      if (action.newOrder) {
        nextOrder = action.newOrder;
      } else if (
        action.fromIndex !== undefined &&
        action.toIndex !== undefined
      ) {
        nextOrder = arrayMove(nextOrder, action.fromIndex, action.toIndex);
      }

      const allIds = getAllSectionIds(state);
      return {
        ...state,
        sectionOrder: normalizeSectionOrder(nextOrder, allIds),
      };
    }

    case "TOGGLE_SECTION_HIDDEN": {
      const { sectionId } = action;
      const currentHidden = state.hiddenSections || [];
      const isCurrentlyHidden = currentHidden.includes(sectionId);

      const nextHidden = isCurrentlyHidden
        ? currentHidden.filter((id) => id !== sectionId)
        : [...currentHidden, sectionId];

      return {
        ...state,
        hiddenSections: nextHidden,
      };
    }

    case "ADD_BULLET": {
      const { section, itemId, text = "", index } = action;

      const insertBullet = (bullets: string[]): string[] => {
        const copy = [...bullets];
        if (index !== undefined && index >= 0 && index <= copy.length) {
          copy.splice(index, 0, text);
        } else {
          copy.push(text);
        }
        return copy;
      };

      // Standard section with bullets
      if (section in state && Array.isArray((state as any)[section])) {
        const list = (state as any)[section] as Array<{ id: string; bullets?: string[] }>;
        return {
          ...state,
          [section]: list.map((item) =>
            item.id === itemId
              ? { ...item, bullets: insertBullet(item.bullets || []) }
              : item
          ),
        };
      }

      // Custom section item
      const customIndex = (state.customSections || []).findIndex((s) => s.id === section);
      if (customIndex !== -1) {
        const customSec = state.customSections[customIndex]!;
        const updated = [...state.customSections];
        updated[customIndex] = {
          ...customSec,
          items: customSec.items.map((item) =>
            item.id === itemId
              ? { ...item, bullets: insertBullet(item.bullets || []) }
              : item
          ),
        };
        return {
          ...state,
          customSections: updated,
        };
      }

      return state;
    }

    case "REMOVE_BULLET": {
      const { section, itemId, bulletIndex } = action;

      const removeBullet = (bullets: string[]): string[] => {
        return bullets.filter((_, idx) => idx !== bulletIndex);
      };

      if (section in state && Array.isArray((state as any)[section])) {
        const list = (state as any)[section] as Array<{ id: string; bullets?: string[] }>;
        return {
          ...state,
          [section]: list.map((item) =>
            item.id === itemId
              ? { ...item, bullets: removeBullet(item.bullets || []) }
              : item
          ),
        };
      }

      const customIndex = (state.customSections || []).findIndex((s) => s.id === section);
      if (customIndex !== -1) {
        const customSec = state.customSections[customIndex]!;
        const updated = [...state.customSections];
        updated[customIndex] = {
          ...customSec,
          items: customSec.items.map((item) =>
            item.id === itemId
              ? { ...item, bullets: removeBullet(item.bullets || []) }
              : item
          ),
        };
        return {
          ...state,
          customSections: updated,
        };
      }

      return state;
    }

    case "MOVE_BULLET": {
      const { section, itemId, fromIndex, toIndex } = action;

      if (section in state && Array.isArray((state as any)[section])) {
        const list = (state as any)[section] as Array<{ id: string; bullets?: string[] }>;
        return {
          ...state,
          [section]: list.map((item) =>
            item.id === itemId
              ? { ...item, bullets: arrayMove(item.bullets || [], fromIndex, toIndex) }
              : item
          ),
        };
      }

      const customIndex = (state.customSections || []).findIndex((s) => s.id === section);
      if (customIndex !== -1) {
        const customSec = state.customSections[customIndex]!;
        const updated = [...state.customSections];
        updated[customIndex] = {
          ...customSec,
          items: customSec.items.map((item) =>
            item.id === itemId
              ? { ...item, bullets: arrayMove(item.bullets || [], fromIndex, toIndex) }
              : item
          ),
        };
        return {
          ...state,
          customSections: updated,
        };
      }

      return state;
    }

    case "REPLACE_CONTENT": {
      const allIds = getAllSectionIds(action.content);
      return {
        ...action.content,
        sectionOrder: normalizeSectionOrder(action.content.sectionOrder || [], allIds),
      };
    }

    default:
      return state;
  }
}
