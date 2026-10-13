# Track Implementation Plan: Phase 2 - Database Layer

## Phase 1: Typed JSON Contracts (Zod First)
- [x] Task: Create `app/lib/schemas/resume.ts` (Zod schemas for content, design, templates, caps)
- [x] Task: Create `app/lib/resume/defaults.ts` (helpers for default content and design)
- [x] Task: Create unit tests in `tests/unit/resume-schema.test.ts` (validation, caps, defaults)
- [x] Task: Phase Verification & Checkpoint

## Phase 2: Drizzle Schema Definition
- [x] Task: Define Better Auth SQLite tables in `app/db/schema.ts` (`user`, `session`, `account`, `verification`)
- [x] Task: Define application tables in `app/db/schema.ts` (`resumes`, `resume_snapshots`, `share_links`) with typed JSON, default functions, and relations
- [x] Task: Export inferred TypeScript types from `app/db/schema.ts`
- [x] Task: Phase Verification & Checkpoint

## Phase 3: Migrations Generation & Application
- [x] Task: Run `drizzle-kit generate` to generate migration SQL in `drizzle/`
- [x] Task: Review generated SQL and verify foreign key cascades
- [x] Task: Apply migrations to local D1 (`npm run db:migrate:local`)
- [x] Task: Apply migrations to remote D1 (`npm run db:migrate:remote`)
- [x] Task: Phase Verification & Checkpoint

## Phase 4: Typed Query Modules Implementation
- [x] Task: Implement `app/db/queries/resumes.ts` (create, list, get, update with optimistic locking in SQL, rename, delete, duplicate)
- [x] Task: Implement `app/db/queries/snapshots.ts` (create, list, restore, auto-prune to 20 newest in batch)
- [x] Task: Implement `app/db/queries/shares.ts` (upsert, regenerate, revoke, delete, getPublicResumeBySlug, recordView with bot filter)
- [x] Task: Export queries through barrel `app/db/queries/index.ts`
- [x] Task: Phase Verification & Checkpoint

## Phase 5: Seed Script & Health Route Upgrade
- [x] Task: Implement idempotent seed script in `scripts/seed.ts` (creates demo user + 3 sample resumes)
- [x] Task: Upgrade `/health` in `app/routes/health.ts` to check table existence and migration state
- [x] Task: Phase Verification & Checkpoint

## Phase 6: Integration Tests & Quality Verification
- [x] Task: Create test helpers in `tests/helpers/` (factories for user, resume, database)
- [x] Task: Create worker tests in `tests/worker/schema.test.ts` (cascades, unique constraints)
- [x] Task: Create worker tests in `tests/worker/resumes.test.ts` (CRUD, authorization isolation, optimistic concurrency conflicts)
- [x] Task: Create worker tests in `tests/worker/snapshots.test.ts` (creation, restoration, pruning)
- [x] Task: Create worker tests in `tests/worker/shares.test.ts` (slug lookup, status resolution, bot filtering)
- [x] Task: Phase Verification & Checkpoint

## Phase 7: Documentation & Production Deploy
- [x] Task: Update `docs/PLAN.md` with ASCII ER diagram
- [x] Task: Update `docs/DECISIONS.md` with ADRs (JSON columns, SQL optimistic locking, snapshot cap, bot view filter)
- [x] Task: Update `docs/TASKS.md` and `README.md`
- [x] Task: Run full verification suite (`lint`, `typecheck`, `test:unit`, `test:worker`, `test:e2e`, `build`)
- [x] Task: Deploy to Cloudflare Workers and verify production `/health` endpoint
- [x] Task: Phase Verification & Checkpoint
