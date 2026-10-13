# Track Implementation Plan: Phase 3 - Authentication

## Phase 1: Research, Architecture & Decision Records
- [x] Task: Evaluate Better Auth password hashing options and Cloudflare Workers CPU constraints
- [x] Task: Evaluate session token database storage model (hashed vs plaintext token) and define mitigations
- [x] Task: Record architectural decisions in `docs/DECISIONS.md` (ADR for Auth approach, CPU risk, and fallback plan)
- [x] Task: Phase Verification & Checkpoint

## Phase 2: Better Auth Edge Setup & Configuration
- [x] Task: Install `better-auth` and configure typed environment variables (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`)
- [x] Task: Create `app/auth/auth.server.ts` with `createAuth(env, request)` factory and Drizzle D1 adapter
- [x] Task: Create resource route `app/routes/api.auth.$.ts` forwarding requests to Better Auth handler
- [x] Task: Configure cookies, CORS, trusted origins, password policy, and email reset stub
- [x] Task: Phase Verification & Checkpoint

## Phase 3: Password Hashing Edge Benchmark (Critical Gate)
- [x] Task: Deploy authentication endpoints to Cloudflare Workers (`workers.dev`)
- [x] Task: Benchmark signup and login across at least 20 attempts on live deployed worker
- [x] Task: Verify execution remains strictly within the 10ms CPU free-tier budget without errors
- [x] Task: Record benchmark results and parameters in `docs/DECISIONS.md`
- [x] Task: Phase Verification & Checkpoint

## Phase 4: Server Helpers & Route Protection
- [x] Task: Implement `app/auth/helpers.server.ts` (`getSession`, `requireUser`, `requireGuest`, `safeRedirect`, `AuthUser`)
- [x] Task: Implement rate limiting for auth endpoints respecting D1/KV free tier limits
- [x] Task: Unit tests for `safeRedirect` and auth validation schemas in `tests/unit/auth.test.ts`
- [x] Task: Phase Verification & Checkpoint

## Phase 5: Reusable UI & Authentication Pages
- [x] Task: Create `app/components/auth/AuthForm.tsx` (accessible, compact mode, react-hook-form + Zod)
- [x] Task: Create auth routes: `/login`, `/signup`, `/forgot-password`, `/reset-password`
- [x] Task: Create protected `/dashboard` placeholder and `POST /logout` route action
- [x] Task: Update `app/components/Header.tsx` to reflect active session state and user menu
- [x] Task: Phase Verification & Checkpoint

## Phase 6: Multi-Tier Integration & E2E Testing
- [x] Task: Worker integration tests in `tests/worker/auth.test.ts` (signup, duplicate email rejection, login, session cookies, logout, requireUser redirect, requireGuest, rate limiting)
- [x] Task: Playwright E2E tests in `tests/e2e/auth.spec.ts` (signup -> dashboard -> logout -> login, protected redirect flow, axe accessibility)
- [x] Task: Verify test coverage >= 80% on `app/auth`
- [x] Task: Phase Verification & Checkpoint

## Phase 7: Documentation & Production Verification
- [x] Task: Add ASCII Auth Sequence Diagram to `docs/PLAN.md`
- [x] Task: Update `docs/DECISIONS.md` with final numbers and ADRs
- [x] Task: Update `docs/TASKS.md` (tick Phase 3, refine Phase 4) and `README.md` with auth setup
- [x] Task: Run full verification suite (`lint`, `typecheck`, `test:unit`, `test:worker`, `test:e2e`, `build`)
- [x] Task: Deploy to Cloudflare Workers and execute final live smoke tests
- [x] Task: Phase Verification & Checkpoint
