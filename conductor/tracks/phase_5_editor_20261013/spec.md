# Specification: Phase 5 - Resume Editor, Autosave, Versions, Guest-First Save

## Overview & Goals

Phase 5 builds the core editing engine of **Resumint**. It transitions the application from document catalog management into real-time, interactive resume drafting. The phase is structured into two sequential stages:
- **Stage 5A: Editor Core**: Pure immutable editor state reducer, section metadata registry, dynamic forms for all standard and custom sections, dnd-kit sortable reordering, bullet point editor, accessible A4 live `BasicPreview` behind an abstract `<ResumePreview />` interface, and manual server saving with optimistic concurrency.
- **Stage 5A Checkpoint**: Full quality and test suite execution with a pause for user approval before beginning Stage 5B.
- **Stage 5B: Advanced Systems**: Debounced autosave engine with coalesced in-flight saves, undo/redo client history stack, version snapshots UI with pre-restore backup, and guest-first editing on `/build` with seamless in-place `AuthDialog` draft claim.

## Architecture & Decisions

### 1. State Management & Single Source of Truth
- State is managed via `useReducer + React Context` with a pure, immutable reducer in `app/lib/resume/editor-state.ts`.
- Content and design JSON structures remain strictly decoupled: the editor mutates `content` only; `design` is preserved unchanged.
- Every section and item maintains a stable `nanoid` identifier as its React key and drag-and-drop ID.

### 2. Shared Persistence Adapter Pattern
```typescript
export interface PersistenceAdapter {
  save: (content: ResumeContent, expectedVersion?: number) => Promise<SaveResult>;
  type: "server" | "guest";
}
```
The `<ResumeEditor initial persistence />` component remains agnostic to the underlying persistence layer, allowing identical UI and validation behavior in both logged-in server mode (`ServerPersistence`) and guest mode (`GuestPersistence`).

### 3. Preview Architecture
- Temporary `BasicPreview` component rendering semantic HTML (`<h1>`, `<h2>`, `<ul>`, `<li>`), styled to A4 aspect ratio using default design tokens.
- Wrapped by an abstract `<ResumePreview content={content} design={design} templateId={templateId} />` interface so Phase 6 can swap in the full template registry without refactoring the editor.

### 4. Security & Sanitization
- Bullets are strictly plain-text strings. No rich-text editors or `dangerouslySetInnerHTML`.
- All client payloads are validated server-side against `resumeContentSchema` and enforced against maximum byte size caps before database writes.
- 404-not-403 policy holds across all editor loaders and mutating actions. Cross-origin requests are rejected via CSRF validation.

## Functional Requirements

### Stage 5A: Editor Core
1. **Pure Logic & Registry**:
   - `editor-state.ts`: Reducer actions (`updateField`, `addItem`, `removeItem`, `moveItem`, `addSection`, `removeSection`, `renameSection`, `reorderSections`, `toggleSectionHidden`, `addBullet`, `removeBullet`, `moveBullet`, `replaceContent`).
   - `section-registry.ts`: Single source of truth defining section metadata, item shapes, default factories, and customizability.
   - `reorder.ts`: Safe array manipulation and `sectionOrder` normalization.
   - `dates.ts`: Date range validation (`start <= end`), "Present" toggle, and display formatting.
2. **Route Server Handlers (`/resumes/:id/edit`)**:
   - Loader: Verifies ownership, returns resume payload; responds 404 for missing or unowned documents.
   - Action: Handles `save` intent with SQL optimistic concurrency (`expectedVersion`), returns 409 on version conflict; handles `rename` intent.
3. **Editor UI Layout**:
   - Header with inline-editable title, back to dashboard link, save status indicator, and manual Save button.
   - Desktop two-pane independently scrollable view; mobile tab switcher ("Edit" | "Preview").
   - Section navigation menu for quick jumping and visibility status.
4. **Section Forms**:
   - Personal info: Name, job title, email, phone, location, links list.
   - Summary: Textarea with character counter.
   - Multi-item sections (Experience, Education, Projects, Certifications, Awards, Publications, Volunteering, Languages, Skills, Interests, References, Custom): Collapsible cards, one-line summary header, date ranges with "Present" checkbox.
   - Skills: Tag-style badge input (add on Enter/comma, remove, reorder) with optional level.
   - BulletEditor: Add, remove, reorder via dnd-kit, Enter adds new bullet, Backspace on empty bullet removes it.
   - Section controls: Toggle visibility, reorder sections with drag handles + keyboard arrows, add/delete custom sections.
5. **Live Preview (`BasicPreview`)**:
   - Semantic HTML A4 preview reacting instantaneously to reducer state. Empty/hidden sections omitted.
6. **Navigation Guard**:
   - `useBlocker` and `beforeunload` warning when unsaved changes exist.

### Stage 5B: Autosave, Versions & Guest Claim
1. **Autosave Engine**:
   - Debounced ~1.5s after last keystroke; flushed on blur, `visibilitychange` to hidden, and before navigation.
   - Single in-flight save per resume; coalesces concurrent edits.
   - Status machine: `idle | dirty | saving | saved | error | conflict | offline`.
   - Conflict resolution dialog (Reload latest vs Keep mine).
2. **Undo / Redo**:
   - History stack (~100 snapshots) with keystroke coalescing.
   - Standard shortcuts (Ctrl/Cmd+Z, Shift+Ctrl/Cmd+Z).
3. **Version Snapshots**:
   - Snapshot history panel (`/resumes/:id/versions`) with restore confirmation and pre-restore backup.
   - Auto-snapshot rate-limiting (max 1 per 30 minutes) to conserve D1 write budgets.
4. **Guest-First Flow**:
   - Client-only `/build` route reading/writing versioned `localStorage` key `resumint:guest-draft:v1`.
   - In-place `AuthDialog` on save triggering seamless account creation/login and claiming draft into D1.

## Non-Functional Requirements
- **Edge Efficiency**: Zero heavy Node dependencies; execution within Cloudflare Workers Free Tier limits.
- **Accessibility**: WCAG 2.1 AA compliance across all form controls, drag handles, live regions, and dialogs.
- **Test Coverage**: >=80% coverage on touched modules across unit, component, worker, and E2E suites.

## Out of Scope
- Multiple template styling and design panel (Phase 6).
- Server-side PDF export (Phase 7).
- Public share link creation UI (Phase 8).
- AI text generation or ATS keyword matching (Phase 9).
