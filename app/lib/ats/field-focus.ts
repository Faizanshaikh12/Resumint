import type { FieldTarget } from "./types";

/**
 * Scrolls to and focuses the input or section matching the provided field target.
 * Works even after sections are reordered, collapsed, or loaded asynchronously.
 */
export function focusField(
  target: FieldTarget,
  options?: {
    setActiveSection?: (sectionId: string) => void;
    setEditorTab?: (tab: "content" | "design" | "check") => void;
  }
) {
  if (options?.setEditorTab) {
    options.setEditorTab("content");
  }

  if (target.sectionId && options?.setActiveSection) {
    options.setActiveSection(target.sectionId);
  }

  // Defer DOM focus slightly so React completes state rendering of the active form
  setTimeout(() => {
    // 1. Try exact data-field-path matching
    let element: HTMLElement | null = null;

    if (target.field) {
      element =
        document.querySelector<HTMLElement>(
          `[data-field-path="${target.sectionId}.${target.field}"]`
        ) ||
        document.querySelector<HTMLElement>(
          `[data-field-path="${target.field}"]`
        ) ||
        document.querySelector<HTMLElement>(
          `[name="${target.field}"]`
        ) ||
        document.querySelector<HTMLElement>(
          `#${target.field}`
        );
    }

    // 2. Try item and bullet matching
    if (!element && target.itemId) {
      if (typeof target.bulletIndex === "number") {
        element = document.querySelector<HTMLElement>(
          `[data-field-path="${target.sectionId}.${target.itemId}.bullet.${target.bulletIndex}"]`
        ) ||
        document.querySelector<HTMLElement>(
          `[data-bullet-index="${target.bulletIndex}"][data-item-id="${target.itemId}"]`
        );
      } else {
        element = document.querySelector<HTMLElement>(
          `[data-item-id="${target.itemId}"]`
        );
      }
    }

    // 3. Fallback: section container or active form container
    if (!element) {
      element =
        document.querySelector<HTMLElement>(
          `[data-section-id="${target.sectionId}"]`
        ) ||
        document.querySelector<HTMLElement>(
          `[data-testid="editor-active-form-container"]`
        );
    }

    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      if (typeof element.focus === "function") {
        element.focus({ preventScroll: true });
      }
    }
  }, 100);
}
