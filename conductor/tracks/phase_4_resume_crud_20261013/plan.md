# Track Implementation Plan: Phase 4 - Resume CRUD + Dashboard

## Phase 1: Shared Building Blocks & Schemas
- [ ] Task: Create `app/lib/schemas/resume-actions.ts` (Zod schemas for `create`, `rename`, `duplicate`, `delete` intents, and typed action results)
- [ ] Task: Create `app/lib/resume/samples.ts` (3 code samples: developer, student, designer passing `resumeContentSchema`, `listSamples`, `getSample`)
- [ ] Task: Create `app/lib/utils/format.ts` (relative time formatting and safe title truncation)
- [ ] Task: Create `app/lib/resume/limits.ts` (`MAX_RESUMES_PER_USER = 20`)
- [ ] Task: Verify and update `countResumes(db, userId)` in `app/db/queries/resumes.ts`
- [ ] Task: Unit tests for action schemas, format utils, and sample schemas
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2: Routes & Server Actions
- [ ] Task: Implement `/dashboard` route loader with `?q=`, `?sort=`, `?cursor=` pagination and lightweight summary projection
- [ ] Task: Implement `/dashboard` route action handling intents (`create`, `rename`, `duplicate`, `delete`) with CSRF check and 404 security policy
- [ ] Task: Implement `/resumes/new` route (choose blank vs sample, limit check)
- [ ] Task: Implement `/resumes/:id/edit` placeholder route with `requireUser` and ownership 404 check + ErrorBoundary
- [ ] Task: Register routes in `app/routes.ts`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3: Dashboard UI Components & State
- [ ] Task: Implement `app/components/dashboard/ResumeCard.tsx` (thumbnail, title, badges, relative time, action dropdown)
- [ ] Task: Implement Delete Confirmation Dialog with accessible name focus
- [ ] Task: Implement Rename Dialog / inline edit using `useFetcher` with optimistic state
- [ ] Task: Implement Toolbar with debounced search and sort select synced to URL
- [ ] Task: Implement pagination ("Load more" via `nextCursor`)
- [ ] Task: Implement loading skeletons, empty state, and no-results state
- [ ] Task: Component RTL tests for `ResumeCard` and dashboard states
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4: Worker Integration Testing
- [ ] Task: Write `tests/worker/dashboard.test.ts`:
  - [ ] Unauthenticated requests redirect to `/login?redirectTo=...`
  - [ ] Create blank & sample resumes and verify redirect target
  - [ ] Enforce limit on create and duplicate (21st rejected)
  - [ ] Rename with trimming, empty rejected, no-op unchanged
  - [ ] Duplicate copies content/design, resets version to 1, does not copy share link
  - [ ] Delete cascades snapshots and share link
  - [ ] Authorization isolation at route level: User B gets 404 for User A's resume
  - [ ] Search, sort, cursor pagination with wildcard escaping (`%`, `_`)
  - [ ] CSRF origin rejection on cross-origin POST
  - [ ] List loader returns no `content` or `design` JSON blobs
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 5: Playwright E2E & Accessibility Testing
- [ ] Task: Write `tests/e2e/dashboard.spec.ts`:
  - [ ] Full user lifecycle: signup -> empty dashboard -> create blank -> edit placeholder -> back to dashboard
  - [ ] Sample creation, rename, duplicate, delete with confirmation dialog, search, and sort
  - [ ] Authorization isolation: User B cannot access User A's edit URL (renders 404 page)
  - [ ] Automated Axe accessibility audits on `/dashboard`, `/resumes/new`, and open delete dialog (0 violations)
- [ ] Task: Verify test coverage >= 80% on touched modules
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 6: Documentation & Production Deploy
- [ ] Task: Update `docs/DECISIONS.md` (ADR for 404-not-403 policy, resume cap, URL-as-state, cursor pagination)
- [ ] Task: Update `docs/PLAN.md` with route map updates and dashboard behavior notes
- [ ] Task: Update `docs/TASKS.md` (tick Phase 4, refine Phase 5 outline) and `README.md`
- [ ] Task: Run full verification suite (`lint`, `typecheck`, `test:unit`, `test:worker`, `test:e2e`, `build`)
- [ ] Task: Deploy to Cloudflare Workers and execute live manual verification
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
