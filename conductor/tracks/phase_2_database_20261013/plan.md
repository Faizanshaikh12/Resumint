# Track Implementation Plan: Phase 2 - Database Layer

## Phase 1: Typed JSON Contracts (Zod First)
- [ ] Task: Create `app/lib/schemas/resume.ts` (Zod schemas for content, design, templates, caps)
- [ ] Task: Create `app/lib/resume/defaults.ts` (helpers for default content and design)
- [ ] Task: Create unit tests in `tests/unit/resume-schema.test.ts` (validation, caps, defaults)
- [ ] Task: Phase Verification & Checkpoint

## Phase 2: Drizzle Schema Definition
- [ ] Task: Define Better Auth SQLite tables in `app/db/schema.ts` (`user`, `session`, `account`, `verification`)
- [ ] Task: Define application tables in `app/db/schema.ts` (`resumes`, `resume_snapshots`, `share_links`) with typed JSON, default functions, and relations
- [ ] Task: Export inferred TypeScript types from `app/db/schema.ts`
- [ ] Task: Phase Verification & Checkpoint

## Phase 3: Migrations Generation & Application
- [ ] Task: Run `drizzle-kit generate` to generate migration SQL in `drizzle/`
- [ ] Task: Review generated SQL and verify foreign key cascades
- [ ] Task: Apply migrations to local D1 (`npm run db:migrate:local`)
- [ ] Task: Apply migrations to remote D1 (`npm run db:migrate:remote`)
- [ ] Task: Phase Verification & Checkpoint

## Phase 4: Typed Query Modules Implementation
- [ ] Task: Implement `app/db/queries/resumes.ts` (create, list, get, update with optimistic locking in SQL, rename, delete, duplicate)
- [ ] Task: Implement `app/db/queries/snapshots.ts` (create, list, restore, auto-prune to 20 newest in batch)
- [ ] Task: Implement `app/db/queries/shares.ts` (upsert, regenerate, revoke, delete, getPublicResumeBySlug, recordView with bot filter)
- [ ] Task: Export queries through barrel `app/db/queries/index.ts`
- [ ] Task: Phase Verification & Checkpoint

## Phase 5: Seed Script & Health Route Upgrade
- [ ] Task: Implement idempotent seed script in `scripts/seed.ts` (creates demo user + 3 sample resumes)
- [ ] Task: Upgrade `/health` in `app/routes/health.ts` to check table existence and migration state
- [ ] Task: Phase Verification & Checkpoint

## Phase 6: Integration Tests & Quality Verification
- [ ] Task: Create test helpers in `tests/helpers/` (factories for user, resume, database)
- [ ] Task: Create worker tests in `tests/worker/schema.test.ts` (cascades, unique constraints)
- [ ] Task: Create worker tests in `tests/worker/resumes.test.ts` (CRUD, authorization isolation, optimistic concurrency conflicts)
- [ ] Task: Create worker tests in `tests/worker/snapshots.test.ts` (creation, restoration, pruning)
- [ ] Task: Create worker tests in `tests/worker/shares.test.ts` (slug lookup, status resolution, bot filtering)
- [ ] Task: Phase Verification & Checkpoint

## Phase 7: Documentation & Production Deploy
- [ ] Task: Update `docs/PLAN.md` with ASCII ER diagram
- [ ] Task: Update `docs/DECISIONS.md` with ADRs (JSON columns, SQL optimistic locking, snapshot cap, bot view filter)
- [ ] Task: Update `docs/TASKS.md` and `README.md`
- [ ] Task: Run full verification suite (`lint`, `typecheck`, `test:unit`, `test:worker`, `test:e2e`, `build`)
- [ ] Task: Deploy to Cloudflare Workers and verify production `/health` endpoint
- [ ] Task: Phase Verification & Checkpoint
