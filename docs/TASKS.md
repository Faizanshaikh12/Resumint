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

## Phase 3: Authentication & Guest Claiming (Refined Outline)

- [ ] Task 3.1: Better Auth configuration with Cloudflare D1 Drizzle adapter (email/password, SHA-256 hashed session tokens)
- [ ] Task 3.2: Edge-optimized WebCrypto password hashing / verification within 10ms CPU budget
- [ ] Task 3.3: In-place Auth Modal (`AuthDialog.tsx`) supporting seamless login and registration without navigation
- [ ] Task 3.4: Guest draft claiming pipeline: transitions `localStorage` draft (`resumint_draft_v1`) into D1 upon authentication
- [ ] Task 3.5: React Router session loader, auth context, and protected route guards
- [ ] Task 3.6: Worker integration and Playwright tests for auth flows, draft claiming, and session lifecycle

---

## Phase 4: Resume CRUD & Dashboard (Outline)

- [ ] Task 4.1: Dashboard route (`/dashboard`) with resume cards, search, and sorting
- [ ] Task 4.2: Actions: Create, Duplicate, Rename, and Delete (with confirmation dialog)
- [ ] Task 4.3: Authorization isolation tests (User A cannot view or mutate User B resumes)

---

## Phase 5: Resume Editor Core (Outline)

- [ ] Task 5.1: Two-pane layout with mobile responsive tab switcher
- [ ] Task 5.2: Dynamic section forms (Personal Info, Summary, Experience, Education, Skills, Projects)
- [ ] Task 5.3: Drag-and-drop item reordering and bullet points editor
- [ ] Task 5.4: Debounced autosave (~1s) with optimistic version validation
- [ ] Task 5.5: Version snapshot creation (capped at 20) and restoration

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
