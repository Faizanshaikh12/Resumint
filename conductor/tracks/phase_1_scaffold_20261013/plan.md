# Track Implementation Plan: Phase 1 - Project Scaffold and Architecture

## Phase 1: Foundational Documentation & ADRs
- [ ] Task: Create `docs/PLAN.md` (goals, MVP vs stretch scope, ASCII architecture diagram, route map, free-tier budget, roadmap)
- [ ] Task: Create `docs/TASKS.md` (detailed Phase 1 checklist and high-level milestones for Phases 2–10)
- [ ] Task: Create `docs/DECISIONS.md` (ADR log with updated 10ms CPU limits, client-side PDF, Better Auth, zero AI in MVP, guest-first flow)
- [ ] Task: Create `AGENTS.md` (coding conventions, definition of done, command standards)
- [ ] Task: Create `README.md` skeleton
- [ ] Task: Phase Verification & Checkpoint

## Phase 2: Project Scaffolding & Dependency Upgrades
- [ ] Task: Bootstrap React Router v7 using official Cloudflare D1 template
- [ ] Task: Upgrade dependencies to latest stable versions and resolve compatibility
- [ ] Task: Configure `.gitignore`, `.env.example`, `.dev.vars.example`, and `.editorconfig`
- [ ] Task: Phase Verification & Checkpoint

## Phase 3: Configuration & Database Client Setup
- [ ] Task: Configure `tsconfig.json` (strict, noUncheckedIndexedAccess, `~/*` alias)
- [ ] Task: Configure `wrangler.jsonc` (D1 binding DB, compatibility date, migrations directory)
- [ ] Task: Generate Worker types (`cf-typegen`)
- [ ] Task: Configure `drizzle.config.ts` and `app/db/client.ts` with `getDb(env)`
- [ ] Task: Phase Verification & Checkpoint

## Phase 4: Folder Architecture & Base UI Layout
- [ ] Task: Scaffold canonical folder structure across `app/`, `workers/`, `tests/`, `scripts/`
- [ ] Task: Configure Tailwind CSS v4 and install core shadcn/ui components (button, input, label, card, dialog, dropdown-menu, sonner, skeleton)
- [ ] Task: Build base responsive layout with Header (logo, theme toggle), Footer, and Container
- [ ] Task: Implement `/health` resource route (JSON status + D1 `SELECT 1` ping)
- [ ] Task: Implement accessible 404 and root ErrorBoundary
- [ ] Task: Phase Verification & Checkpoint

## Phase 5: Quality Tooling & Testing Harness Setup
- [ ] Task: Configure ESLint / Prettier and add `lint`, `format`, and `typecheck` scripts
- [ ] Task: Configure Vitest unit tests (e.g. `cn()` helper test)
- [ ] Task: Configure React Testing Library component test (Header logo & theme toggle)
- [ ] Task: Configure `@cloudflare/vitest-pool-workers` integration test for `/health` with local D1
- [ ] Task: Configure Playwright e2e test with Axe accessibility inspection
- [ ] Task: Configure GitHub Actions CI workflow in `.github/workflows/ci.yml`
- [ ] Task: Phase Verification & Checkpoint

## Phase 6: Final Verification & Smoke Test
- [ ] Task: Execute full verification pipeline (`lint`, `typecheck`, `test:unit`, `test:worker`, `test:e2e`, `build`)
- [ ] Task: Generate report of dependency versions and local health status
- [ ] Task: Phase Verification & Checkpoint
