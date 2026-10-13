# Track Specification: Phase 2 - Database Layer

## 1. Overview
Build the complete data access, storage, and persistence layer for **Resumint** using Cloudflare D1 (SQLite) and Drizzle ORM. This includes Zod-validated JSON contracts, Better Auth tables, Core Resume entities, optimistic concurrency controls, version snapshots (capped at 20), public sharing logic, idempotent seeding, and comprehensive integration testing in `@cloudflare/vitest-plugin`.

## 2. Requirements & Scope

### In Scope
1. **Typed JSON Contracts (Zod First)**:
   - `resumeContentSchema`: Covers personal info, summary, experience, education, skills, languages, projects, certifications, awards, publications, volunteering, interests, references, customSections.
   - Stable item identifiers (`nanoid`), date range structure `{ start, end, current }`, string arrays for bullets, `sectionOrder: string[]`, `hiddenSections: string[]`.
   - `resumeDesignSchema`: `accentColor`, `fontFamily` (system/safe enum), `fontSize`, `lineSpacing`, `margins`, `pageSize` (`A4 | Letter`), `sectionSpacing`, `columns`.
   - `templateIdSchema`: enum (`modern | minimal | executive | classic | technical`).
   - Strict size bounds (max items per section, max string lengths, total serialized size cap ~200 KB) to protect D1 row budgets.
   - `createDefaultContent()` and `createDefaultDesign()` helpers in `app/lib/resume/defaults.ts`.
   - Unit tests validating bounds and defaults.

2. **Drizzle Schema (`app/db/schema.ts`)**:
   - Auth tables conforming to Better Auth SQLite schema (`user`, `session`, `account`, `verification`).
   - App tables:
     - `resumes`: `id` (text pk, nanoid 12), `userId` (fk cascade), `title`, `templateId`, `content` (`text({ mode: "json" })`), `design` (`text({ mode: "json" })`), `version` (integer default 1), `createdAt`, `updatedAt` with `$defaultFn` and `$onUpdate`. Index on `(userId, updatedAt)`.
     - `resumeSnapshots`: `id`, `resumeId` (fk cascade), `content`, `design`, `label`, `createdAt`. Index on `(resumeId, createdAt)`.
     - `shareLinks`: `id`, `resumeId` (fk cascade, UNIQUE), `slug` (UNIQUE, nanoid 14), `isActive`, `allowDownload`, `noindex` (default true), `passwordHash`, `expiresAt`, `viewCount` (integer default 0), `createdAt`.
   - Foreign key cascade deletion verification.

3. **Migrations Management**:
   - Migration generation via `drizzle-kit` into `drizzle/`.
   - Local migration execution via `wrangler d1 migrations apply DB --local`.
   - Remote migration execution via `wrangler d1 migrations apply DB --remote`.

4. **Typed Query Modules (`app/db/queries/`)**:
   - `resumes.ts`:
     - `createResume(db, userId, input?)`
     - `listResumes(db, userId, options)` (projection of metadata only, no heavy blobs)
     - `getResume(db, userId, id)` (strict authorization check)
     - `updateResume(db, userId, id, input)` with SQL-level optimistic locking: `UPDATE ... WHERE id = ? AND user_id = ? AND version = ?`
     - `renameResume`, `deleteResume`, `duplicateResume`.
   - `snapshots.ts`:
     - `createSnapshot`, `listSnapshots`, `restoreSnapshot` (bumps version and creates pre-restore snapshot).
     - Auto-prune keeping newest 20 snapshots per resume in the same batch.
   - `shares.ts`:
     - `upsertShareLink`, `regenerateSlug`, `revokeShareLink`, `deleteShareLink`.
     - `getPublicResumeBySlug` (sanitized projection returning status enum: `ok | not_found | revoked | expired | password_required`).
     - `recordView` with bot filtering to preserve D1 write allowances.

5. **Idempotent Seed Script (`scripts/seed.ts`)**:
   - Creates a demo user and 3 rich sample resumes (Developer, Student, Designer).
   - Supports local D1 execution by default and remote with explicit flag.

6. **Health Check Route Upgrade**:
   - `/health` verifies D1 table presence and migration status without exposing sensitive schema data.

7. **Worker Integration & Unit Tests**:
   - Multi-tier tests verifying constraints, authorization isolation (User B cannot mutate User A data), version conflicts, snapshot pruning, and share status resolution.

## 3. Acceptance Criteria
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:worker`, `npm run build` pass with 0 errors.
- Code coverage >= 80% on `app/db/queries` and `app/lib/schemas`.
- Migrations cleanly apply locally and remotely.
- Live `/health` on `resumint.faizan-shaikh-dev.workers.dev` confirms table existence.
