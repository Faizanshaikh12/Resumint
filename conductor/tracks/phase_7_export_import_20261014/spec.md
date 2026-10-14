# Specification: Phase 7 - Export and Import

## 1. Overview
Phase 7 adds client-side PDF export (via standard CSS `@page` print styles), JSON export and import with security boundaries (size caps, prototype pollution guards, id regeneration), and plain-text export. All export operations are client-generated and ungated (accessible to both authenticated users and guests without server-side compute).

## 2. Functional Requirements
1. **Pure Export Logic (`app/lib/export/`):**
   - `filename.ts`: `buildFilename({ name, title, ext })` -> sanitized characters (`[A-Za-z0-9_-]`), collapsed spaces, 100 char limit, fallback `resume`, no path separators (`/`, `\`), no reserved Windows names (`CON`, `PRN`, `AUX`, `NUL`, `COM1-9`, `LPT1-9`), no leading dots.
   - `json.ts`:
     - Envelope: `{ app: "resumint", schemaVersion: 1, exportedAt: string, resume: { title, templateId, content, design } }`.
     - `exportResumeJson(resume)`: deterministic JSON string with 2-space indent.
     - `parseResumeJson(text)`: size cap (<220 KB) pre-check, prototype pollution check (`__proto__`, `constructor`, `prototype`), app identifier verification, version verification, Zod content validation, lenient design fallback, template fallback to `modern`, title trim, and nanoid regeneration for all items.
   - `text.ts`:
     - `exportResumeText(content, { sectionOrder, hiddenSections })`: plain UTF-8 text with UPPERCASE section headers, bullet lists prefixed with `- `, dates as ranges, omitting hidden or empty sections.
2. **Download Helpers (`app/lib/export/download.ts`):**
   - `downloadText(filename, mime, text)` via Blob and object URL cleanup.
   - `copyToClipboard(text)` with fallback and toasts.
   - SSR safety guards.
3. **PDF Export Pipeline:**
   - Client-side browser print (`window.print()`) with filename assigned via `document.title` and restored on `afterprint`.
   - `usePrintResume()` hook and `print.css` rules ensuring only the resume document renders at 100% scale with background graphics (`print-color-adjust: exact`) and clean page breaks (`break-inside: avoid`, `break-after: avoid`).
   - Font loading check via `document.fonts.ready`.
   - "Download PDF" button in editor header with one-time instructions modal and "Don't show again" preference in `localStorage`.
4. **Export Menu UI:**
   - Dropdown menu in editor header: Download PDF, Download JSON (backup), Download plain text (.txt), Copy as text.
   - Dashboard card menu: "Download JSON" without opening the editor via resource route `GET /resumes/:id/export.json`.
5. **JSON Import Flow:**
   - Entry points: `/resumes/new` card, Dashboard "New resume" dropdown, and guest builder.
   - Client-side size check and summary modal.
   - Logged-in: POST `import` intent creating one resume row respecting the 20-resume cap, then redirecting to `/resumes/:id/edit`.
   - Guest: replaces `localStorage` draft with confirmation if non-empty.

## 3. Non-Functional Requirements & Security
- Cloudflare Workers Free Tier compliance: zero server-side headless browsers, zero node native PDF libraries.
- Prototype pollution immunity and 220 KB payload caps.
- Strict input sanitization; never trust client-supplied ids, versions, or userIds.
- ATS compatibility: PDFs retain 100% real, selectable, machine-parseable text.

## 4. Acceptance Criteria
- Unit tests: filename sanitization, JSON roundtrip, malformed/oversize/prototype pollution rejection, plain-text snapshots.
- Component tests: Export menu and Import dialog lifecycle.
- Worker integration tests: `GET /resumes/:id/export.json` and `POST /resumes/new` import intent.
- Playwright E2E tests: JSON export/import roundtrip, .txt export, Chromium PDF text extraction verification, axe a11y audit.
- Full verification suite passes: `lint`, `typecheck`, `test`, `test:worker`, `build`.
