# Resumint - Project Tasks & Checklist

## Phase 1: Project Scaffold and Architecture

- [x] Task 1.1: Project Documentation (PLAN.md, TASKS.md, DECISIONS.md, AGENTS.md, README.md skeleton)
- [x] Task 1.2: Template Bootstrap (`create-react-router` with cloudflare-d1 template)
- [x] Task 1.3: Dependency Upgrades (Upgrade all packages to latest stable releases, verify dev server)
- [x] Task 1.4: Core Configuration (`tsconfig.json` strict, `wrangler.jsonc`, D1 typed client, `drizzle.config.ts`)
- [x] Task 1.5: Directory Scaffolding & Canonical Structure (`app/`, `workers/`, `tests/`, `scripts/`)
- [x] Task 1.6: UI Foundation & Design System (Tailwind CSS v4, shadcn/ui components, base layout with Header/Footer)
- [x] Task 1.7: Resource & Error Routes (`/health` with D1 `SELECT 1` ping, root 404 & ErrorBoundary)
- [x] Task 1.8: Quality Tooling & Scripts (ESLint, Prettier, `typecheck`, `lint`, `format`)
- [x] Task 1.9: Testing Harness Setup (Vitest unit tests, RTL component test, `@cloudflare/vitest-plugin` D1 test, Playwright e2e with Axe)
- [x] Task 1.10: CI/CD Automation (`.github/workflows/ci.yml`)
- [x] Task 1.11: Verification & Smoke Test (Run all checks, document results)

---

## Phase 2: Database Layer (Resumint)

- [x] Task 2.1: Typed JSON contracts in `app/lib/schemas/resume.ts` (`resumeContentSchema`, `resumeDesignSchema`, `templateIdSchema`, size caps, default factories)
- [x] Task 2.2: Unit tests for schemas and bounds in `tests/unit/resume-schema.test.ts`
- [x] Task 2.3: Drizzle schema definition in `app/db/schema.ts` (Better Auth tables: `user`, `session`, `account`, `verification`; Domain tables: `resumes`, `resume_snapshots`, `share_links` with cascade deletes and indexed timestamps)
- [x] Task 2.4: Drizzle migration generation (`drizzle/0000_cool_lethal_legion.sql`) and execution (local & remote D1)
- [x] Task 2.5: Typed query modules in `app/db/queries/`:
  - [x] `resumes.ts`: `createResume`, `listResumes` (lightweight metadata only), `getResume`, `updateResume` (optimistic concurrency inside SQL), `renameResume`, `deleteResume`, `duplicateResume`
  - [x] `snapshots.ts`: `createSnapshot`, `listSnapshots`, `restoreSnapshot` (bumps version, pre-restore backup), auto-prune to newest 20
  - [x] `shares.ts`: `upsertShareLink`, `regenerateSlug`, `revokeShareLink`, `deleteShareLink`, `getPublicResumeBySlug` (sanitized projection), `recordView` (with bot filter)
  - [x] Barrel export `app/db/queries/index.ts`
- [x] Task 2.6: Idempotent seed script (`scripts/seed.ts` via `npm run db:seed`) creating demo user + 3 sample resumes (Developer, Student, Designer)
- [x] Task 2.7: Upgraded `/health` endpoint reporting D1 connection, table verification count, and schema status
- [x] Task 2.8: Vitest worker integration tests:
  - [x] `tests/worker/schema.test.ts`: FK cascade deletes, unique slug, unique resumeId
  - [x] `tests/worker/resumes.test.ts`: CRUD, projection, authorization isolation, optimistic concurrency, payload validation
  - [x] `tests/worker/snapshots.test.ts`: creation, restoration, pruning, auth isolation
  - [x] `tests/worker/shares.test.ts`: upsert, slug regen, public projection, bot filter, auth isolation
  - [x] `tests/worker/health.test.ts`: table verification and worker environment
- [x] Task 2.9: Production deployment to Cloudflare Workers with verified schema on live D1 database
- [x] Task 2.10: Updated documentation (`PLAN.md` with ASCII ER diagram, `DECISIONS.md` with ADRs 007-011, `README.md`)

---

## Phase 3: Authentication (Resumint)

- [x] Task 3.1: Research & Decision Record (ADR-012 in DECISIONS.md: WebCrypto PBKDF2 edge hashing, session storage, rate limiting, email verification deferred)
- [x] Task 3.2: Edge-compliant WebCrypto PBKDF2-SHA256 password hasher (`app/auth/crypto.server.ts`, 100k iterations, constant-time compare, <3ms CPU execution)
- [x] Task 3.3: Request-scoped Better Auth factory (`app/auth/auth.server.ts`) with Drizzle D1 adapter, rolling session lifecycle, rate limiting, dev email stub
- [x] Task 3.4: Server helpers & route guards (`app/auth/helpers.server.ts` & `app/auth/redirect.ts`: `getSession`, `requireUser`, `requireGuest`, `safeRedirect`, `AuthUser`)
- [x] Task 3.5: Critical Gate Benchmark on deployed free-plan Worker (20/20 live signups and signins succeeded, 100% success rate, 0 CPU errors, documented in ADR-012)
- [x] Task 3.6: Reusable accessible UI:
  - [x] `app/components/auth/AuthForm.tsx` (react-hook-form + Zod, show/hide password, compact mode, accessible labels & aria-live alerts)
  - [x] Routes: `/login`, `/signup`, `/forgot-password`, `/reset-password`
  - [x] Placeholder `/dashboard` protected by `requireUser`
  - [x] POST `/logout` route clearing session
  - [x] Header authentication state with user profile dropdown
- [x] Task 3.7: Comprehensive Test Suites:
  - [x] Unit/component tests (29 passing tests: Zod schemas, safeRedirect, AuthForm RTL, Header auth state)
  - [x] Worker integration tests (43 passing tests: signup, duplicate rejection, login, session cookies, logout, requireUser redirect, 429 rate limit, expired session, sensitive token leak prevention)
  - [x] Playwright E2E tests (6 passing tests: signup -> dashboard -> logout -> login, protected redirect flow, Axe accessibility audits on /login and /signup with 0 violations)
  - [x] Coverage: 100% statement and line coverage on `app/auth` and schemas
- [x] Task 3.8: Documentation updates (`DECISIONS.md`, `PLAN.md`, `TASKS.md`, `README.md`)

---

## Phase 4: Resume CRUD & Dashboard (Resumint)

- [x] Task 4.1: Shared Building Blocks:
  - [x] `app/lib/schemas/resume-actions.ts`: Zod schemas for intents (`create`, `rename`, `duplicate`, `delete`, unified `dashboardActionSchema`), `ActionResult<T>` type, `dashboardQuerySchema`
  - [x] `app/lib/resume/samples.ts`: 3 complete code samples (developer, student, designer) adhering to `resumeContentSchema`, `listSamples()`, `getSample(id)`
  - [x] `app/lib/utils/format.ts`: Web Standard `formatRelativeTime`, `truncateTitle`, `formatDuplicateTitle` (capped at 100 chars)
  - [x] `app/lib/resume/limits.ts`: `MAX_RESUMES_PER_USER = 20`
  - [x] `app/db/queries/resumes.ts`: added `countResumes`, keyset cursor pagination with stable primary-key tie-break, safe SQL LIKE wildcard escaping (`%` and `_`), no-op rename optimization
- [x] Task 4.2: Routes & Server Logic:
  - [x] `/dashboard`: loader with `?q=`, `?sort=`, `?cursor=`, lightweight metadata projection, limit check; action supporting typed create, rename, duplicate, delete intents
  - [x] `/resumes/new`: choose-start page (blank or 3 samples), respects limit, redirects to `/resumes/:id/edit`
  - [x] `/resumes/:id/edit`: protected placeholder loader requiring ownership, 404 isolation for non-owned documents, friendly 404 ErrorBoundary
  - [x] `app/lib/security/csrf.server.ts`: Origin validation rejecting cross-origin mutating requests with 403
  - [x] Updated `app/routes.ts`
- [x] Task 4.3: Accessible Dashboard UI:
  - [x] Header: "My Documents", usage counter ("X of 20"), "New resume" CTA with disabled limit state
  - [x] Toolbar: debounced search input (syncs to `?q=`), sort selector (syncs to `?sort=`), URL as source of truth
  - [x] `ResumeCard`: accessible thumbnail miniature with initials, template badge, relative timestamp, share status badge, action dropdown
  - [x] In-place `RenameDialog` with validation and autofocus
  - [x] Confirmation `DeleteDialog` explicitly naming document and warning of snapshot/share cascade
  - [x] Optimistic mutations via `useFetcher` with rollback and toasts ("Resume renamed", "Resume duplicated", "Resume deleted")
  - [x] Keyset pagination via "Load more" button
  - [x] Skeletons, empty states, and no-search-results states
- [x] Task 4.4: Comprehensive Verification:
  - [x] 11 new unit tests for schemas, samples, formatting, and limits
  - [x] 7 component tests for `ResumeCard` and `DashboardEmptyState`
  - [x] 13 worker integration tests: auth guards, limit enforcement (21st rejected), 404 route-level authorization isolation, LIKE wildcard escaping, CSRF rejection, lightweight projection verification
  - [x] 3 Playwright E2E suites: full CRUD lifecycle, User B 404 isolation, Axe WCAG 2.1 AA audits on dashboard, `/resumes/new`, and open delete dialog (0 violations)
  - [x] Code coverage: 98.9% statement and line coverage
- [x] Task 4.5: Documentation updates (`PLAN.md`, `DECISIONS.md` with ADR-013, `TASKS.md`, `README.md`)

---

## Phase 5: Resume Editor Core (Outline)

- [ ] Task 5.1: Two-pane layout with mobile responsive tab switcher (Editor Form <-> Live Scaled A4/Letter Preview)
- [ ] Task 5.2: Reactive section forms with react-hook-form + Zod (Personal Info, Summary, Experience, Education, Skills, Projects)
- [ ] Task 5.3: Reorderable dynamic lists (drag-and-drop or accessible up/down controls) and rich bullet points
- [ ] Task 5.4: Debounced autosave (~1000ms) with optimistic concurrency check (`expectedVersion`) and conflict handling
- [ ] Task 5.5: Version snapshot restoration UI (capped at 20) with pre-restore checkpoint
- [ ] Task 5.6: Guest-first editing and in-place draft claim modal (`AuthModal`) saving local draft to D1 upon login/signup

---

## Phase 6: Templates & Design Customization (Outline)

- [ ] Task 6.1: Template engine with 5 distinct ATS-friendly styles (Modern, Minimal, Classic, Technical, Executive)
- [ ] Task 6.2: Customization panel (accent colors, typography, margins, spacing, A4/Letter size)
- [ ] Task 6.3: Separation of design tokens and content payload to ensure loss-free template swapping

---

## Phase 7: Export Systems (Outline)

- [ ] Task 7.1: Print stylesheet (`@page`, zero headers/footers, exact page breaks)
- [ ] Task 7.2: Client-side PDF export trigger
- [ ] Task 7.3: JSON export and import with strict Zod validation

---

## Phase 8: Public Share Links (Outline)

- [ ] Task 8.1: Unique slug generator (nanoid) and `/r/:slug` public route
- [ ] Task 8.2: Privacy controls: password protection, expiration date, noindex tags, download toggles
- [ ] Task 8.3: View count increments with bot mitigation

---

## Phase 9: ATS Rule-Based Checker (Outline)

- [ ] Task 9.1: Pure function rule evaluators (action verbs, quantifiable metrics, contact hygiene)
- [ ] Task 9.2: Real-time ATS score indicator and recommendation panel in editor

---

## Phase 10: Polish, Hardening & Production Deploy (Outline)

- [ ] Task 10.1: Accessibility review (WCAG AA compliance, Axe verification)
- [ ] Task 10.2: Performance audit and bundle size minimization
- [ ] Task 10.3: Remote D1 migration and Cloudflare Workers production deployment
- [ ] Task 10.4: Live smoke tests and final documentation updates
