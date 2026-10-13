# Track Specification: Phase 1 - Project Scaffold and Architecture

## 1. Overview

Establish the foundational architecture, tooling, testing harness, CI/CD, and project documentation for **Resumint**, a modern online resume builder built on React Router v7 and Cloudflare Workers (D1 SQLite).

## 2. Requirements & Scope

### In Scope

1. **Foundational Documentation**:
   - `docs/PLAN.md` with goals, MVP vs stretch scope, architecture diagram, route map, and risks.
   - `docs/TASKS.md` with multi-phase checkboxes.
   - `docs/DECISIONS.md` with ADRs (Workers CPU budget, client-side PDF, Better Auth, zero AI in MVP, guest-first flow).
   - `AGENTS.md` and `README.md` skeleton.
2. **Project Scaffolding**:
   - Scaffolding via React Router v7 template for Cloudflare D1.
   - Upgrading dependencies to their latest stable releases.
   - Git hygiene, `.gitignore`, `.env.example`, `.dev.vars.example`.
3. **Configuration & Bindings**:
   - TypeScript strict mode with `noUncheckedIndexedAccess` and path alias `~/* -> app/*`.
   - `wrangler.jsonc` configured for D1 `DB` binding and migrations directory.
   - D1 typed client helper in `app/db/client.ts`.
4. **Folder Structure & UI Skeleton**:
   - Canonical folder organization for routes, components, db, lib, styles, and tests.
   - Tailwind CSS v4 and essential shadcn/ui components (button, input, label, card, dialog, dropdown-menu, sonner, skeleton).
   - Base responsive layout (Header with theme toggle, Footer, Container).
   - `/health` resource route verifying `{ status: "ok" }` and executing `SELECT 1` on D1.
   - Error boundaries and accessible semantic landmarks.
5. **Quality & Test Automation**:
   - ESLint, Prettier, and TypeScript checks.
   - Vitest unit test for utility functions.
   - React Testing Library component test.
   - `@cloudflare/vitest-pool-workers` integration test for `/health`.
   - Playwright end-to-end smoke test with Axe accessibility check.
   - GitHub Actions CI workflow (`.github/workflows/ci.yml`).

### Out of Scope

- Authentication implementation (Deferred to Phase 3).
- Production database schema and resume CRUD (Deferred to Phase 2/4).
- Resume Editor UI, templates, PDF export, share links, ATS checker (Deferred to subsequent phases).

## 3. Acceptance Criteria

- `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` succeed with 0 errors.
- `/health` returns `{ status: "ok" }` with D1 `SELECT 1` confirmation.
- CI workflow file passes syntactic and configuration validation.
- All docs exist and reflect verified architectural decisions.
