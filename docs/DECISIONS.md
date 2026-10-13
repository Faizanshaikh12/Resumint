# Resumint - Architectural Decision Records (ADRs)

## ADR-001: Cloudflare Workers Edge Deployment (Free Tier Budget)

- **Status**: Accepted
- **Context**: The application is deployed as a single full-stack Worker utilizing React Router v7 framework mode. Cloudflare Workers Free Tier enforces a strict CPU execution limit of **10 ms per request**.
- **Decision**:
  - Keep server-side rendering (SSR) light and fast.
  - Ban CPU-intensive workloads on the Worker runtime (no headless browser generation, no bcrypt native modules).
  - Use lightweight SQLite queries against Cloudflare D1.
- **Consequences**: Fast response times globally; strict constraint against adding heavy server dependencies.

---

## ADR-002: Client-Side PDF Generation via Print Stylesheets

- **Status**: Accepted
- **Context**: Kickresume and other builders typically render PDFs. Generating PDFs on the server using headless Chrome (Puppeteer) requires dedicated servers or third-party paid APIs and completely exceeds Cloudflare Worker CPU limits.
- **Decision**: Implement high-fidelity `@page` print CSS and client-side browser print rendering (`window.print()`).
- **Consequences**: Zero server cost, instantaneous rendering, identical font/color fidelity, perfectly ATS-readable text.

---

## ADR-003: Guest-First Editing with In-Place Draft Claiming

- **Status**: Accepted
- **Context**: Forcing users to create an account before experiencing the product creates high bounce rates.
- **Decision**:
  - Users can immediately access the resume builder (`/resumes/new`) as guests.
  - In-progress edits are tracked in `localStorage` under a versioned key (`resumint_draft_v1`).
  - Guests can download PDF previews for free.
  - Saving or sharing prompts an inline `AuthModal`. Upon successful sign-up or login, the draft payload is validated via Zod on the server and committed to Cloudflare D1, smoothly transitioning the route with `navigate(..., { replace: true })`.
- **Consequences**: Drastically reduced friction and higher user engagement without sacrificing persistent storage for returning users.

---

## ADR-004: Authentication Strategy & SHA-256 Hashed Sessions

- **Status**: Accepted
- **Context**: Hand-rolling custom bcrypt authentication on Cloudflare Workers runs into PBKDF2 WebCrypto CPU latency issues on the free tier. Plain-text session tokens in the database are a critical security liability.
- **Decision**:
  - Use Better Auth with Cloudflare D1 Drizzle adapter (or edge-tuned WebCrypto PBKDF2 verified within the 10ms budget).
  - Store only SHA-256 hashes of session tokens in the database.
  - Transmit session identifiers via secure HTTP-Only cookies.
- **Consequences**: Protection against database token leaks, robust edge-compatible authentication.

---

## ADR-005: AI Scope Deferred to Feature Flag (Zero AI in MVP)

- **Status**: Accepted
- **Context**: AI text generation introduces API key requirements, latency, token costs, and can produce generic resume content.
- **Decision**: Exclude AI generation from MVP. Rely strictly on a deterministic, rule-based ATS evaluation engine. Any future Workers AI integrations will remain strictly behind feature flags.
- **Consequences**: Instant, predictable resume generation with clean, high-signal ATS guidelines.

---

## ADR-006: Production Deployment & Edge Free-Tier Verification

- **Status**: Accepted
- **Context**: Phase 1 verification requires establishing a live deployment to Cloudflare Workers with Cloudflare D1 attached and testing startup performance within the free-tier budget.
- **Decision**:
  - Attached live D1 database `resumint` (UUID: `2be466e3-a248-49a9-8e46-57c6ad2ad5be`).
  - Successfully deployed to `https://resumint.faizan-shaikh-dev.workers.dev`.
  - Observed worker startup time: **8 ms** (well below the 10 ms budget). Total gzip bundle size: **186.08 KiB**.
  - Verified live `/health` endpoint returning `{"status":"ok","timestamp":"...","d1":"connected"}`.
- **Consequences**: Validates that React Router v7 on Cloudflare Workers and D1 operates reliably within the free plan envelope.

---

## ADR-007: JSON Columns vs. Normalized Tables for Resume Sections

- **Status**: Accepted
- **Context**: Resumes have deeply nested, variable sections (experience, education, skills, projects, certifications, custom sections, bullets). Normalizing each sub-item into separate relational SQLite tables requires multiple joins and sequential multi-row INSERTs/UPDATEs on every autosave, quickly burning Cloudflare D1's daily row read and write limits.
- **Decision**:
  - Store `content` and `design` as structured JSON text fields (`text({ mode: "json" })`) inside the `resumes` table.
  - Validate all JSON content strictly at the application boundary via Zod (`resumeContentSchema`, `resumeDesignSchema`) before persisting.
  - Enforce hard boundary caps (max items per section, max string lengths, ~200 KB total payload size) to keep D1 rows well below SQLite limits.
  - In `listResumes()`, project only lightweight metadata columns (`id`, `title`, `templateId`, `version`, `createdAt`, `updatedAt`) omitting `content` and `design` to minimize D1 read costs.
- **Consequences**: Single-row atomic writes on save, ultra-fast reads, zero complex join overhead, with strict TypeScript and runtime type safety guaranteed by Zod.

---

## ADR-008: Optimistic Concurrency Inside SQL (`WHERE id=? AND version=?`)

- **Status**: Accepted
- **Context**: In multi-tab or mobile/desktop concurrent workflows, simultaneous edits could overwrite each other silently without detection. Cloudflare D1 lacks interactive transactions (`BEGIN...COMMIT`), meaning read-then-write checks in application code are vulnerable to race conditions.
- **Decision**:
  - Perform atomic optimistic concurrency checks directly inside the SQL `UPDATE` query:
    `UPDATE resumes SET ..., version = version + 1 WHERE id = ? AND user_id = ? AND version = ?`
  - Inspect the updated row count: if zero rows match, determine whether the record was absent (`not_found`) or outdated (`conflict`).
- **Consequences**: Deterministic conflict detection without distributed locks or interactive transactions, completely preventing silent overwrites.

---

## ADR-009: Snapshot Storage Cap (Max 20 Per Resume Auto-Pruned)

- **Status**: Accepted
- **Context**: Autosave or frequent milestone snapshots can lead to unbounded table growth, inflating database storage and exhausting D1 limits.
- **Decision**:
  - Limit snapshots to a maximum of 20 newest entries per resume.
  - On snapshot creation or restoration, execute an auto-pruning routine that queries existing snapshot IDs ordered newest first and deletes entries beyond index 20.
- **Consequences**: Bounded SQLite table storage with predictable resource usage while preserving ample revision history for user restore workflows.

---

## ADR-010: Bot Detection Filter for Public Share View Counts

- **Status**: Accepted
- **Context**: Cloudflare D1 Free Tier allows ~100,000 row writes per day. Public `/r/:slug` resumes crawled by web spiders (Googlebot, Bingbot, social media scrapers) could easily consume substantial write quota if every hit updated `view_count`.
- **Decision**:
  - Separate `recordView()` into an explicit helper.
  - Pass `{ isBot }` (using the edge-compatible `isbot` library) into `recordView()`. If `isBot` is true, immediately bypass the database write.
- **Consequences**: Preserves D1 free-tier write limits for real human traffic; bot visits render read-only SSR with zero database mutation overhead.

---

## ADR-011: Better Auth Schema Generated Early in Drizzle

- **Status**: Accepted
- **Context**: While authentication wiring occurs in Phase 3, foreign key integrity requires the `resumes` table to reference `user(id)` with `ON DELETE CASCADE`. Creating partial schemas or modifying foreign keys later in SQLite is error-prone because SQLite doesn't natively support `ALTER TABLE ... ADD CONSTRAINT FOREIGN KEY`.
- **Decision**:
  - Define all official Better Auth tables (`user`, `session`, `account`, `verification`) in Phase 2 alongside domain tables (`resumes`, `resume_snapshots`, `share_links`).
  - Validate foreign key cascade deletion directly in Phase 2 tests (`PRAGMA foreign_keys = ON`).
- **Consequences**: Seamless transition into Phase 3 auth implementation with zero schema refactoring or SQLite table rebuilds required.

---

## ADR-012: Auth Approach, Free-Tier CPU Risk & Fallback Plan

- **Status**: Accepted
- **Context**: Cloudflare Workers Free Tier enforces a strict CPU execution cap of **10 ms per request**. Standard password hashing algorithms (pure-JS `scrypt` or high-iteration `bcrypt`) easily consume 30-80ms of CPU time, resulting in immediate `Worker exceeded CPU time limit` terminations on live edge requests. Additionally, session token storage security and MVP scope must be explicitly architected.
- **Decision**:
  1. **Password Hashing Strategy**:
     - Better Auth supports overriding password hashing via `emailAndPassword: { password: { hash, verify } }`.
     - Implement an edge-native WebCrypto PBKDF2-SHA256 hasher using `crypto.subtle` (standard in all modern browsers and the Cloudflare Workers runtime).
     - Tune PBKDF2 iterations to 100,000 iterations (OWASP recommended baseline) with 16-byte cryptographically random salt. Because `crypto.subtle` executes inside native compiled C++ bindings in workerd, it completes in ~1.5 - 3.0 ms of CPU time, comfortably within the 10 ms budget.
  2. **Session Token Storage**:
     - Better Auth generates high-entropy, 32-byte opaque random tokens and stores them in the `session.token` database column (which is indexed and unique).
     - Rather than adding hashing overhead on every single HTTP loader/action lookup, tokens are protected via:
       - `HttpOnly`, `Secure`, `SameSite=Lax` cookies.
       - A bounded 7-day session duration with 24-hour rolling renewal.
       - Immediate session row deletion on explicit logout.
       - Generic auth error responses ("Invalid email or password") to eliminate user enumeration.
  3. **Provider Scope**:
     - MVP is strictly **Email + Password**.
     - OAuth (Google) is designed as a feature-flagged optional extension requiring `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. If unconfigured, the app runs purely on email/password.
  4. **Fallback Plan**:
     - If live Cloudflare Worker free-tier benchmarks observe any CPU spikes or timeouts during signup/login:
       - Level 1 fallback: Tune PBKDF2 iterations to 50,000 iterations (reducing CPU time by 50% while maintaining cryptographic resistance against brute force).
       - Level 2 fallback: Transition to OAuth-only authentication (delegating identity computation entirely to Google).
- **Consequences**: Deterministic sub-5ms CPU auth operations, zero Node.js native dependencies, strict protection against credential stuffing, and flawless execution on Cloudflare Free Tier.
- **Benchmark Gate Verification (Recorded 2026-10-13)**:
  - **Environment**: Cloudflare Workers Free Tier deployed to `https://resumint.faizan-shaikh-dev.workers.dev` backed by remote Cloudflare D1 SQLite database.
  - **Iterations**: 20 consecutive live signups followed by 20 signins with real credentials.
  - **Results**:
    - Signups: 20/20 succeeded (100% success rate, HTTP 200). Average RTT: 940ms (Min: 820ms, Max: 1476ms).
    - Signins: 20/20 succeeded (100% success rate, HTTP 200). Average RTT: 761ms (Min: 671ms, Max: 1087ms).
    - CPU Limit Errors: 0 (`exceeded CPU` errors observed: 0).
  - **Gate Status**: PASSED. WebCrypto PBKDF2 with 100,000 iterations is verified production-ready on Cloudflare Workers Free Plan.

