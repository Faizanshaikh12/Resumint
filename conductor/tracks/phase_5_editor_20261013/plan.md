# Track Implementation Plan: Phase 5 - Resume Editor, Autosave, Versions, Guest-First Save

========================================================================
## STAGE 5A: EDITOR CORE
========================================================================

### Phase 1: Pure Logic Foundation (`app/lib/resume/`)
- [ ] Task: Create `app/lib/resume/editor-state.ts` with immutable pure reducer and actions (`updateField`, `addItem`, `removeItem`, `moveItem`, `addSection`, `removeSection`, `renameSection`, `reorderSections`, `toggleSectionHidden`, `addBullet`, `removeBullet`, `moveBullet`, `replaceContent`)
- [ ] Task: Create `app/lib/resume/section-registry.ts` defining metadata, item shapes, default factories, and customizability for all sections
- [ ] Task: Create `app/lib/resume/reorder.ts` with safe array move helpers and `sectionOrder` normalization
- [ ] Task: Create `app/lib/resume/dates.ts` with date range validation (`start <= end`), "Present" toggle, and display formatting
- [ ] Task: Write comprehensive unit tests for `editor-state`, `section-registry`, `reorder`, and `dates` in `tests/unit/editor-state.test.ts`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 2: Route & Server Logic (`/resumes/:id/edit`)
- [ ] Task: Implement `/resumes/:id/edit` loader requiring ownership, returning title, content, design, templateId, and version; 404 for unowned resumes
- [ ] Task: Implement `/resumes/:id/edit` action with `save` intent (optimistic concurrency version bump, size cap validation, 409 conflict, 404 isolation) and `rename` intent
- [ ] Task: Write worker integration tests in `tests/worker/editor.test.ts` covering save success, concurrent conflict (409), payload size limit, 404 authorization isolation, and CSRF origin checks
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 3: Editor UI Components & Forms
- [ ] Task: Implement layout container `<ResumeEditor />` with header, title inline edit, save status area, desktop two-pane view, and mobile tab switcher ("Edit" | "Preview")
- [ ] Task: Implement left section navigation list with scroll-to-section jumping and hidden badges
- [ ] Task: Implement Personal Info form (name, job title, email, phone, location, links list) and Summary form with character counter
- [ ] Task: Implement generic collapsible item cards and forms for all multi-item sections (Experience, Education, Projects, Certifications, Awards, Publications, Volunteering, Languages, Interests, References, Custom)
- [ ] Task: Implement tag-style Skills input (Enter/comma to add, remove badge, level selector)
- [ ] Task: Implement `<BulletEditor />` with dnd-kit sortable handles, Enter to add, Backspace to remove, and keyboard accessibility
- [ ] Task: Implement section visibility toggles, dnd-kit section reordering, and custom section add/delete controls
- [ ] Task: Component RTL tests for item forms, skills tags, bullet points, and section controls in `tests/components/Editor.test.tsx`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 4: Live Preview & Navigation Guardrails
- [ ] Task: Implement `<BasicPreview />` semantic HTML A4 preview reacting instantaneously to editor state
- [ ] Task: Implement `<ResumePreview />` abstract wrapper interface
- [ ] Task: Implement unsaved changes protection using React Router `useBlocker` and browser `beforeunload`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 5: Stage 5A Verification & Quality
- [ ] Task: Write Playwright E2E test in `tests/e2e/editor.spec.ts` (login -> open resume -> edit personal info -> add experience with bullets -> reorder section -> hide section -> save -> reload and verify persistence)
- [ ] Task: Run automated Axe accessibility scans on the editor view (0 violations)
- [ ] Task: Verify test coverage >= 80% on `app/lib/resume` and editor routes
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 6: Stage 5A Checkpoint Review & Handoff
- [ ] Task: Update `docs/DECISIONS.md` with ADRs for editor state architecture, persistence adapter, and plain-text bullets
- [ ] Task: Execute full validation suite (`npm run lint`, `npm run typecheck`, `npm test`, `npm run test:worker`, `npm run test:e2e`, `npm run build`)
- [ ] Task: **CRITICAL CHECKPOINT**: Halt execution, present comprehensive Stage 5A report, and await user approval before proceeding to Stage 5B

========================================================================
## STAGE 5B: AUTOSAVE, UNDO/REDO, VERSIONS, GUEST-FIRST SAVE
(Executes only after user approval of Stage 5A)
========================================================================

### Phase 7: Autosave & Conflict Engine
- [ ] Task: Implement `app/lib/resume/autosave.ts` with debounce (~1.5s), flush on blur/visibilitychange, change-hash skip, and single in-flight coalescing
- [ ] Task: Implement status state machine (`idle | dirty | saving | saved | error | conflict | offline`) and offline recovery banner
- [ ] Task: Implement 409 conflict resolution dialog ("Reload latest" vs "Keep mine")
- [ ] Task: Unit tests with fake timers in `tests/unit/autosave.test.ts`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 8: Undo/Redo & Version Snapshots
- [ ] Task: Implement client history stack (~100 steps) with keystroke coalescing and shortcuts (Ctrl/Cmd+Z, Shift+Ctrl/Cmd+Z)
- [ ] Task: Implement `/resumes/:id/versions` route and drawer UI (snapshot list, auto/manual badge, preview with `ResumePreview`, restore with pre-restore backup, manual version creation)
- [ ] Task: Enforce auto-snapshot throttling policy (max 1 per 30 minutes) and 20-snapshot pruning
- [ ] Task: Worker integration tests for snapshot creation, restore, and 404 isolation
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 9: Guest-First Editing & Draft Claim
- [ ] Task: Implement client-only `/build` route reading/writing versioned `localStorage` key `resumint:guest-draft:v1`
- [ ] Task: Implement in-place `AuthDialog` triggered on Save/Share, reusing `AuthForm` compact mode
- [ ] Task: Implement `claim` action on server validating draft, enforcing 20-resume cap, creating resume in D1, and returning redirect to `/resumes/:id/edit`
- [ ] Task: Implement dashboard banner prompting logged-in users with uncommitted local guest drafts to import or discard
- [ ] Task: Worker integration and Playwright E2E tests for guest building and claim flow
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 10: Final Verification, Production Deploy & Audit
- [ ] Task: Run full verification suite (`lint`, `typecheck`, `test:unit`, `test:worker`, `test:e2e`, `build`)
- [ ] Task: Deploy to Cloudflare Workers edge (`npm run deploy`)
- [ ] Task: Perform manual 5-minute editing session on live edge and record D1 write counts in `docs/DECISIONS.md`
- [ ] Task: Update `docs/PLAN.md`, `docs/DECISIONS.md`, `docs/TASKS.md`, and `README.md`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
