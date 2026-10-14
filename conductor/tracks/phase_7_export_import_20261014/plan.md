# Track Implementation Plan: Phase 7 - Export and Import

### Phase 1: Pure Logic Foundation & Unit Tests
- [x] Task: Implement `app/lib/export/filename.ts` (`buildFilename` with character sanitization, length cap, reserved Windows names, fallback)
- [x] Task: Implement `app/lib/export/json.ts` (`exportResumeJson`, `parseResumeJson` with 220KB size cap, prototype pollution guard, envelope check, Zod validation, id regeneration)
- [x] Task: Implement `app/lib/export/text.ts` (`exportResumeText` with uppercase headings, bullet formatting, section ordering, hidden section filtering)
- [x] Task: Implement `app/lib/export/download.ts` (`downloadText`, `copyToClipboard` with SSR guards)
- [x] Task: Write comprehensive unit tests in `tests/unit/export-import.test.ts`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 2: PDF Export Pipeline & Print Styles
- [x] Task: Create `app/lib/export/print.ts` and `usePrintResume()` hook (font readiness, title swapping, `afterprint` restoration)
- [x] Task: Refine `app/styles/print.css` for `@page` sizes (A4 / Letter), margin tokens, page break rules, exact color adjustment, and chrome suppression
- [x] Task: Implement "Download PDF" dialog hint with "Don't show again" preference in `localStorage`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 3: Export Menu UI & Server Export Route
- [x] Task: Implement Export dropdown menu in `EditorHeader.tsx` (PDF, JSON, Plain text, Copy text)
- [x] Task: Implement resource route `app/routes/resumes.$id.export.json.ts` with `requireUser`, 404 isolation, `Content-Disposition: attachment`, `no-store`
- [x] Task: Add "Download JSON" action to dashboard `ResumeCard.tsx` menu
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 4: JSON Import Flow & Dialog
- [x] Task: Implement `app/components/export/ImportDialog.tsx` with drag-and-drop, client size check, validation preview summary, and error reporting
- [x] Task: Add "Import from JSON" card in `/resumes/new`
- [x] Task: Implement server-side `import` action in `app/routes/resumes.new.tsx` (per-user cap check, id regeneration, version 1 creation)
- [x] Task: Support guest draft import replacement with confirmation
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 5: Component & Worker Integration Tests
- [x] Task: Component tests for Export menu and Import dialog in `tests/components/ExportImport.test.tsx`
- [x] Task: Worker integration tests for `/resumes/:id/export.json` and import action in `tests/worker/export-import.test.ts`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 6: E2E Tests, Documentation & Verification
- [x] Task: Playwright E2E tests (`tests/e2e/export-import.spec.ts`) for JSON roundtrip, .txt export, Chromium PDF generation and text extraction, guest export, axe scan
- [x] Task: Update documentation (`docs/PLAN.md`, `docs/DECISIONS.md`, `docs/TASKS.md`, `README.md`)
- [x] Task: Run full verification suite (`npm run lint`, `npm run typecheck`, `npm test`, `npm run test:worker`, `npm run build`, `npm run test:e2e`)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)
