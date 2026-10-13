# Resumint - Project Tasks & Checklist

## Phase 1: Project Scaffold and Architecture
- [ ] Task 1.1: Project Documentation (PLAN.md, TASKS.md, DECISIONS.md, AGENTS.md, README.md skeleton)
- [ ] Task 1.2: Template Bootstrap (`create-react-router` with cloudflare-d1 template)
- [ ] Task 1.3: Dependency Upgrades (Upgrade all packages to latest stable releases, verify dev server)
- [ ] Task 1.4: Core Configuration (`tsconfig.json` strict, `wrangler.jsonc`, D1 typed client, `drizzle.config.ts`)
- [ ] Task 1.5: Directory Scaffolding & Canonical Structure (`app/`, `workers/`, `tests/`, `scripts/`)
- [ ] Task 1.6: UI Foundation & Design System (Tailwind CSS v4, shadcn/ui components, base layout with Header/Footer)
- [ ] Task 1.7: Resource & Error Routes (`/health` with D1 `SELECT 1` ping, root 404 & ErrorBoundary)
- [ ] Task 1.8: Quality Tooling & Scripts (ESLint, Prettier, `typecheck`, `lint`, `format`)
- [ ] Task 1.9: Testing Harness Setup (Vitest unit tests, RTL component test, `@cloudflare/vitest-pool-workers` D1 test, Playwright e2e with Axe)
- [ ] Task 1.10: CI/CD Automation (`.github/workflows/ci.yml`)
- [ ] Task 1.11: Verification & Smoke Test (Run all checks, document results)

---

## Phase 2: Database Schema & Migrations (Outline)
- [ ] Task 2.1: Implement Drizzle schema with typed JSON and defaults (`users`, `sessions`, `resumes`, `resume_snapshots`, `share_links`)
- [ ] Task 2.2: Generate initial SQLite migrations with `drizzle-kit`
- [ ] Task 2.3: Implement typed query helper functions (`resumes.ts`, `snapshots.ts`, `shares.ts`)
- [ ] Task 2.4: Seed script with sample resumes and templates
- [ ] Task 2.5: Integration tests verifying D1 relational cascade deletions and constraints

## Phase 3: Authentication & Guest Claiming (Outline)
- [ ] Task 3.1: Configure Better Auth / D1 session storage with SHA-256 token hashing
- [ ] Task 3.2: Build Auth Modal component for seamless inline login/signup
- [ ] Task 3.3: Implement `/api/auth` handlers and session loaders
- [ ] Task 3.4: Draft-claiming logic preserving guest `localStorage` data into D1 upon auth
- [ ] Task 3.5: Authorization guard tests ensuring isolated user data

## Phase 4: Resume CRUD & Dashboard (Outline)
- [ ] Task 4.1: Zod validation schemas for resume content and design
- [ ] Task 4.2: Dashboard page (`/dashboard`) with resume cards, search, and sorting
- [ ] Task 4.3: Actions: Create, Duplicate, Rename, and Delete (with confirmation dialog)
- [ ] Task 4.4: Authorization isolation tests (User A cannot view or mutate User B resumes)

## Phase 5: Resume Editor Core (Outline)
- [ ] Task 5.1: Two-pane layout with mobile responsive tab switcher
- [ ] Task 5.2: Dynamic section forms (Personal Info, Summary, Experience, Education, Skills, Projects)
- [ ] Task 5.3: Drag-and-drop item reordering and bullet points editor
- [ ] Task 5.4: Debounced autosave (~1s) with optimistic version validation
- [ ] Task 5.5: Version snapshot creation (capped at 20) and restoration

## Phase 6: Templates & Design Customization (Outline)
- [ ] Task 6.1: Template engine with 5 distinct ATS-friendly styles (Modern, Minimal, Classic, Technical, Executive)
- [ ] Task 6.2: Customization panel (accent colors, typography, margins, spacing, A4/Letter size)
- [ ] Task 6.3: Separation of design tokens and content payload to ensure loss-free template swapping

## Phase 7: Export Systems (Outline)
- [ ] Task 7.1: Print stylesheet (`@page`, zero headers/footers, exact page breaks)
- [ ] Task 7.2: Client-side PDF export trigger
- [ ] Task 7.3: JSON export and import with strict Zod validation

## Phase 8: Public Share Links (Outline)
- [ ] Task 8.1: Unique slug generator (nanoid) and `/r/:slug` public route
- [ ] Task 8.2: Privacy controls: password protection, expiration date, noindex tags, download toggles
- [ ] Task 8.3: View count increments with bot mitigation

## Phase 9: ATS Rule-Based Checker (Outline)
- [ ] Task 9.1: Pure function rule evaluators (action verbs, quantifiable metrics, contact hygiene)
- [ ] Task 9.2: Real-time ATS score indicator and recommendation panel in editor

## Phase 10: Polish, Hardening & Production Deploy (Outline)
- [ ] Task 10.1: Accessibility review (WCAG AA compliance, Axe verification)
- [ ] Task 10.2: Performance audit and bundle size minimization
- [ ] Task 10.3: Remote D1 migration and Cloudflare Workers production deployment
- [ ] Task 10.4: Live smoke tests and final documentation updates
