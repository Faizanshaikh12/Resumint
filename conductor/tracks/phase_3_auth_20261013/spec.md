# Track Specification: Phase 3 - Authentication (Resumint)

## Overview
Implement the complete authentication layer for Resumint using Better Auth integrated with Cloudflare D1 (Drizzle SQLite adapter) on Cloudflare Workers. Build reusable authentication UI (`AuthForm`) suitable for both standalone routes (`/login`, `/signup`) and subsequent embedding into the guest-draft claiming modal in Phase 5. Enforce edge-compliant password hashing, route guards (`requireUser`, `requireGuest`), open-redirect protection (`safeRedirect`), rate limiting, comprehensive multi-tier tests, and live free-tier CPU benchmarking.

---

## Functional Requirements

1. **Better Auth & D1 Integration**:
   - `createAuth(env, request)` factory configured per-request for Cloudflare Workers.
   - Use Phase 2 Drizzle SQLite schema (`user`, `session`, `account`, `verification`) without drift.
   - Resource route mounted at `app/routes/api.auth.$.ts` forwarding requests to Better Auth handler.
   - Session cookies configured: `httpOnly`, `secure` in production, `sameSite: "lax"`, sensible session lifetime with rolling update age.
   - Trusted origins and CSRF protection configured per Better Auth specification.
   - Secrets managed via `.dev.vars` (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`) and typed through `wrangler types`.

2. **Password Policy & Hashing on Edge**:
   - Minimum length 8-12 characters, maximum length cap (to prevent CPU denial-of-service), whitespace rejection.
   - WebCrypto-based PBKDF2/argon2 password hashing tuned to execute reliably within the Cloudflare Workers Free Tier CPU budget (<10ms).
   - Deployed live benchmark verifying at least 20 consecutive signup/login attempts on `workers.dev` without CPU timeout errors.

3. **Server Helpers**:
   - `getSession(request, env)`: Returns active typed session or `null`.
   - `requireUser(request, env)`: Returns authenticated `AuthUser` (id, email, name) or redirects to `/login?redirectTo=<safePath>`.
   - `requireGuest(request, env)`: Redirects already authenticated users away from `/login` and `/signup` to `/dashboard`.
   - `safeRedirect(path)`: Blocks open redirect vulnerabilities (disallowing `//`, `http:`, `https:`, `javascript:`).
   - Strict omission: Never expose password hashes or raw session tokens in client loader JSON or server logs.

4. **Rate Limiting & Security Hygiene**:
   - Rate limiting on sign-in, sign-up, and password-reset endpoints to prevent brute-force attacks while preserving free-tier write limits.
   - Generic error messages ("Invalid email or password") to eliminate account enumeration.
   - Rate limit triggers return HTTP 429.

5. **Reusable UI & Authentication Routes**:
   - `AuthForm.tsx`: Reusable component supporting `signin` and `signup` modes, react-hook-form + Zod validation, `onSuccess` callback, `redirectTo` preservation, `compact` mode toggle for future modal embedding, accessible labels, aria-live error announcements, and password visibility toggles.
   - Dedicated pages: `/login`, `/signup`, `/forgot-password`, `/reset-password` (with dev-only email stub logging reset links).
   - Protected `/dashboard` placeholder showing "Hello, <name>" with user navigation.
   - Root `Header.tsx` updated to conditionally display "Log in / Sign up" when logged out, and user menu (name/email, Dashboard link, Log out button) when logged in.
   - Dedicated `POST /logout` action terminating session and clearing cookie.

---

## Non-Functional Requirements
- **Edge Runtime Compliance**: 100% Web Standards; no Node.js runtime wrappers.
- **Strict CPU Time Budget**: Every auth operation must execute within the 10ms CPU limit on Cloudflare Workers Free Tier.
- **Privacy & Security**: Zero PII in console logs; zero plaintext secrets in repository.
- **Accessibility**: WCAG 2.1 AA compliant forms, full keyboard operability, and valid ARIA attributes verified via Axe.

---

## Acceptance Criteria
- Full test pass: `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:worker`, `npm run test:e2e`, and `npm run build`.
- Deployed benchmark on `workers.dev` confirming >=20 successful signup/login operations with zero CPU limit errors.
- Protected routes enforce `requireUser` and preserve return URLs safely.
- All Phase 3 documentation (ADRs in `docs/DECISIONS.md`, sequence diagram in `docs/PLAN.md`, tasks in `docs/TASKS.md`, environment instructions in `README.md`) complete.

---

## Out of Scope
- Resume CRUD endpoints, dashboard cards/lists, editor canvas, guest draft claiming pipeline (Phase 4/5).
- Third-party OAuth providers (deferred to optional stretch flag).
- Real email SMTP dispatch (dev stub logging reset link only).
- 2FA / WebAuthn.
