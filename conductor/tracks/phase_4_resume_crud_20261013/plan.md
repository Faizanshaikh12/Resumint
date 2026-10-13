# Track Implementation Plan: Phase 4 - Resume CRUD + Dashboard

## Phase 1: Shared Building Blocks & Schemas
- [x] Task: Create `app/lib/schemas/resume-actions.ts` (Zod schemas for `create`, `rename`, `duplicate`, `delete` intents, and typed action results)
- [x] Task: Create `app/lib/resume/samples.ts` (3 code samples: developer, student, designer passing `resumeContentSchema`, `listSamples`, `getSample`)
- [x] Task: Create `app/lib/utils/format.ts` (relative time formatting and safe title truncation)
- [x] Task: Create `app/lib/resume/limits.ts` (`MAX_RESUMES_PER_USER = 20`)
- [x] Task: Verify and update `countResumes(db, userId)` in `app/db/queries/resumes.ts`
- [x] Task: Unit tests for action schemas, format utils, and sample schemas
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2: Routes & Server Actions
- [x] Task: Implement `/dashboard` route loader with `?q=`, `?sort=`, `?cursor=` pagination and lightweight summary projection
- [x] Task: Implement `/dashboard` route action handling intents (`create`, `rename`, `duplicate`, `delete`) with CSRF check and 404 security policy
- [x] Task: Implement `/resumes/new` route (choose blank vs sample, limit check)
- [x] Task: Implement `/resumes/:id/edit` placeholder route with `requireUser` and ownership 404 check + ErrorBoundary
- [x] Task: Register routes in `app/routes.ts`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3: Dashboard UI Components & State
- [x] Task: Implement `app/components/dashboard/ResumeCard.tsx` (thumbnail, title, badges, relative time, action dropdown)
- [x] Task: Implement Delete Confirmation Dialog with accessible name focus
- [x] Task: Implement Rename Dialog / inline edit using `useFetcher` with optimistic state
- [x] Task: Implement Toolbar with debounced search and sort select synced to URL
- [x] Task: Implement pagination ("Load more" via `nextCursor`)
- [x] Task: Implement loading skeletons, empty state, and no-results state
- [x] Task: Component RTL tests for `ResumeCard` and dashboard states
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4: Worker Integration Testing
- [x] Task: Write `tests/worker/dashboard.test.ts`:
  - [x] Unauthenticated requests redirect to `/login?redirectTo=...`
  - [x] Create blank & sample resumes and verify redirect target
  - [x] Enforce limit on create and duplicate (21st rejected)
  - [x] Rename with trimming, empty rejected, no-op unchanged
  - [x] Duplicate copies content/design, resets version to 1, does not copy share link
  - [x] Delete cascades snapshots and share link
  - [x] Authorization isolation at route level: User B gets 404 for User A's resume
  - [x] Search, sort, cursor pagination with wildcard escaping (`%`, `_`)
  - [x] CSRF origin rejection on cross-origin POST
  - [x] List loader returns no `content` or `design` JSON blobs
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 5: Playwright E2E & Accessibility Testing
- [x] Task: Write `tests/e2e/dashboard.spec.ts`:
  - [x] Full user lifecycle: signup -> empty dashboard -> create blank -> edit placeholder -> back to dashboard
  - [x] Sample creation, rename, duplicate, delete with confirmation dialog, search, and sort
  - [x] Authorization isolation: User B cannot access User A's edit URL (renders 404 page)
  - [x] Automated Axe accessibility audits on `/dashboard`, `/resumes/new`, and open delete dialog (0 violations)
- [x] Task: Verify test coverage >= 80% on touched modules (Achieved 98.9%)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 6: Documentation & Production Deploy
- [x] Task: Update `docs/DECISIONS.md` (ADR-013 for 404-not-403 policy, resume cap, URL-as-state, cursor pagination)
- [x] Task: Update `docs/PLAN.md` with route map updates and dashboard behavior notes
- [x] Task: Update `docs/TASKS.md` (tick Phase 4, refine Phase 5 outline) and `README.md`
- [x] Task: Run full verification suite (`lint`, `typecheck`, `test:unit`, `test:worker`, `test:e2e`, `build`)
- [x] Task: Deploy to Cloudflare Workers and execute live manual verification
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)
