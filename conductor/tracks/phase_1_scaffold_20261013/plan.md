# Track Implementation Plan: Phase 1 - Project Scaffold and Architecture

## Phase 1: Foundational Documentation & ADRs
- [x] Task: Create `docs/PLAN.md` (goals, MVP vs stretch scope, ASCII architecture diagram, route map, free-tier budget, roadmap)
- [x] Task: Create `docs/TASKS.md` (detailed Phase 1 checklist and high-level milestones for Phases 2–10)
- [x] Task: Create `docs/DECISIONS.md` (ADR log with updated 10ms CPU limits, client-side PDF, Better Auth, zero AI in MVP, guest-first flow)
- [x] Task: Create `AGENTS.md` (coding conventions, definition of done, command standards)
- [x] Task: Create `README.md` skeleton
- [x] Task: Phase Verification & Checkpoint

## Phase 2: Project Scaffolding & Dependency Upgrades
- [x] Task: Bootstrap React Router v7 using official Cloudflare D1 template
- [x] Task: Upgrade dependencies to latest stable versions and resolve compatibility
- [x] Task: Configure `.gitignore`, `.env.example`, `.dev.vars.example`, and `.editorconfig`
- [x] Task: Phase Verification & Checkpoint

## Phase 3: Configuration & Database Client Setup
- [x] Task: Configure `tsconfig.json` (strict, noUncheckedIndexedAccess, `~/*` alias)
- [x] Task: Configure `wrangler.jsonc` (D1 binding DB, compatibility date, migrations directory)
- [x] Task: Generate Worker types (`cf-typegen`)
- [x] Task: Configure `drizzle.config.ts` and `app/db/client.ts` with `getDb(env)`
- [x] Task: Phase Verification & Checkpoint

## Phase 4: Folder Architecture & Base UI Layout
- [x] Task: Scaffold canonical folder structure across `app/`, `workers/`, `tests/`, `scripts/`
- [x] Task: Configure Tailwind CSS v4 and install core shadcn/ui components (button, input, label, card, dialog, dropdown-menu, sonner, skeleton)
- [x] Task: Build base responsive layout with Header (logo, theme toggle), Footer, and Container
- [x] Task: Implement `/health` resource route (JSON status + D1 `SELECT 1` ping)
- [x] Task: Implement accessible 404 and root ErrorBoundary
- [x] Task: Phase Verification & Checkpoint

## Phase 5: Quality Tooling & Testing Harness Setup
- [x] Task: Configure ESLint / Prettier and add `lint`, `format`, and `typecheck` scripts
- [x] Task: Configure Vitest unit tests (e.g. `cn()` helper test)
- [x] Task: Configure React Testing Library component test (Header logo & theme toggle)
- [x] Task: Configure `@cloudflare/vitest-plugin` integration test for `/health` with local D1
- [x] Task: Configure Playwright e2e test with Axe accessibility inspection
- [x] Task: Configure GitHub Actions CI workflow in `.github/workflows/ci.yml`
- [x] Task: Phase Verification & Checkpoint

## Phase 6: Final Verification & Smoke Test
- [x] Task: Execute full verification pipeline (`lint`, `typecheck`, `test:unit`, `test:worker`, `test:e2e`, `build`)
- [x] Task: Generate report of dependency versions and local health status
- [x] Task: Deploy to Cloudflare Workers and verify production `/health` endpoint
- [x] Task: Phase Verification & Checkpoint
