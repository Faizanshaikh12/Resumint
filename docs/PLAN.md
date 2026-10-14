# Resumint - Architecture & Project Plan

## 1. Project Overview & Goals

**Resumint** is a high-performance, developer- and ATS-friendly online resume builder inspired by Kickresume. It is designed to be lean, fast, accessible, and free of paywalls or intrusive forced sign-ups.

### Core Objectives

1. **Zero-Friction Creation**: Let users start designing their resume instantly on `/` without requiring an account upfront.
2. **Deterministic, In-Place Claiming**: When users click "Save", prompt for credentials via an inline modal and persist their draft to Cloudflare D1 without a page reload or state disruption.
3. **ATS & Print Precision**: Generate pixel-perfect, semantic A4/Letter resumes rendered in pure HTML/CSS and exported client-side via `@page` print styles.
4. **Edge Native**: Run entirely on Cloudflare Workers (Free Plan) with Cloudflare D1 (SQLite) and Drizzle ORM, with no Node.js runtime dependencies.

---

## 2. Scope Matrix

| Category       | MVP (Phase 1 - Phase 8)                                                       | Stretch / Later Phases                  |
| :------------- | :---------------------------------------------------------------------------- | :-------------------------------------- |
| **Auth**       | Email + Password (Better Auth / D1 session), guest-first draft claiming       | OAuth (Google/GitHub), Magic Links      |
| **Editor**     | 2-Pane layout (form + live A4 preview), standard sections, reordering         | Custom user-defined sections            |
| **Templates**  | 5 ATS-compliant templates, typography & accent palette customization          | Template marketplace, color wheel       |
| **Export**     | Client-side `@page` PDF print export, JSON export & import                    | Client-side DOCX export, plain text     |
| **Sharing**    | Public `/r/:slug` view, toggle PDF download, password, expiry, noindex        | Custom domain per resume                |
| **ATS Score**  | Rule-based scoring (action verbs, quantifiable metrics, contact info, length) | Keyword matcher against pasted JD       |
| **AI Helpers** | _Explicitly Disabled / Feature Flagged (Off in MVP)_                          | Cloudflare Workers AI bullet suggestion |

---

## 3. System Architecture Diagram

```
                       Browser Client
           +-------------------------------------+
           | - Guest Draft State (localStorage)  |
           | - Reactive Section & Bullet Editor  |
           | - Live A4 / Letter Scaled Preview   |
           | - Client-side @page PDF Exporter    |
           +------------------+------------------+
                              |
                     HTTPS / JSON RPC
                              |
                              v
       +---------------------------------------------+
       |   Cloudflare Worker (Unified RR v7 Edge)    |
       |  -----------------------------------------  |
       |  - React Router v7 Framework Mode (SSR)     |
       |  - Loaders & Actions (Shared Zod schemas)   |
       |  - Session Verification (SHA-256 hashed)    |
       |  - Security & Cache Headers, Rate Limiting  |
       +----------------------+----------------------+
                              |
                    Direct SQL Bindings
                              |
                              v
       +---------------------------------------------+
       |           Cloudflare D1 (SQLite)            |
       |  -----------------------------------------  |
       |  - users, sessions, accounts, verification  |
       |  - resumes (content & design JSON, version) |
       |  - resume_snapshots (last 20 revisions)     |
       |  - share_links (slug, flags, expiry)        |
       +---------------------------------------------+
```

---

## 3.1 Authentication Sequence Diagram (Better Auth + WebCrypto + D1)

```
        Browser Client                  Cloudflare Worker (Edge)                  Cloudflare D1
              |                                    |                                    |
              | 1. POST /api/auth/sign-up/email    |                                    |
              |    { name, email, password }       |                                    |
              |----------------------------------->|                                    |
              |                                    | 2. Rate limit check (10 req/min)   |
              |                                    | 3. WebCrypto PBKDF2-SHA256         |
              |                                    |    (100,000 iter, sub-3ms CPU)     |
              |                                    | 4. INSERT user, account, session   |
              |                                    |----------------------------------->|
              |                                    |<-----------------------------------|
              | 5. HTTP 200 OK                     |                                    |
              |    Set-Cookie: resumint.session=.. |                                    |
              |<-----------------------------------|                                    |
              |                                    |                                    |
              | 6. GET /dashboard (Cookie)         |                                    |
              |----------------------------------->| 7. requireUser(request)            |
              |                                    | 8. SELECT session WHERE token=?    |
              |                                    |----------------------------------->|
              |                                    |<-----------------------------------|
              |                                    | 9. Check expiry, return AuthUser   |
              | 10. HTTP 200 (Dashboard SSR)       |    (password & raw token omitted)  |
              |<-----------------------------------|                                    |
              |                                    |                                    |
              | 11. POST /logout                   |                                    |
              |----------------------------------->| 12. DELETE session from D1         |
              |                                    |----------------------------------->|
              |                                    |<-----------------------------------|
              | 13. HTTP 302 Redirect to /login    |                                    |
              |     Set-Cookie: Clear session      |                                    |
              |<-----------------------------------|                                    |
```

---

## 4. Data Model & Entity-Relationship Diagram

### ASCII ER Diagram

```
+------------------------------------------------------------------+
|                              USER                                |
|------------------------------------------------------------------|
| id: text [PK]                                                    |
| name: text                                                       |
| email: text [UNIQUE]                                             |
| email_verified: integer (boolean)                                |
| image: text (nullable)                                           |
| created_at: integer (timestamp)                                  |
| updated_at: integer (timestamp)                                  |
+------------------------------------------------------------------+
       | 1                           | 1                     | 1
       |                             |                       |
       | 0..N                        | 0..N                  | 0..N
       v                             v                       v
+-----------------------+     +-------------------+   +--------------------+
|        SESSION        |     |      ACCOUNT      |   |      RESUMES       |
|-----------------------|     |-------------------|   |--------------------|
| id: text [PK]         |     | id: text [PK]     |   | id: text [PK] (12) |
| token: text [UQ]      |     | account_id: text  |   | user_id: text [FK] |
| user_id: text [FK]    |     | provider_id: text |   | title: text        |
| expires_at: integer   |     | user_id: text [FK]|   | template_id: text  |
| ip_address: text      |     | password: text    |   | content: JSON text |
| user_agent: text      |     | created_at: int   |   | design: JSON text  |
| created_at: integer   |     | updated_at: int   |   | version: int (1..) |
| updated_at: integer   |     +-------------------+   | created_at: int    |
+-----------------------+                             | updated_at: int    |
                                                      +--------------------+
                                                            | 1        | 1
                                                            |          |
                                                    0..20   v          v 0..1
                               +-----------------------------+   +-----------------------+
                               |      RESUME_SNAPSHOTS       |   |      SHARE_LINKS      |
                               |-----------------------------|   |-----------------------|
                               | id: text [PK] (nanoid)      |   | id: text [PK] (nanoid)|
                               | resume_id: text [FK, cascd] |   | resume_id: text [FK,UQ|
                               | content: JSON text          |   | slug: text [UQ] (14)  |
                               | design: JSON text           |   | is_active: integer    |
                               | label: text (nullable)      |   | allow_download: int   |
                               | created_at: integer (ts)    |   | noindex: integer      |
                               +-----------------------------+   | password_hash: text   |
                                                                 | expires_at: int (null)|
                                                                 | view_count: int (0..) |
                                                                 | created_at: int (ts)  |
                                                                 +-----------------------+
```

### Table Definitions & Invariants

1. **`user`**: User identity record managed in conformity with Better Auth standards.
2. **`session`**: Active authenticated sessions with hashed token lookup.
3. **`account`**: Auth credentials (local password hash or federated OAuth credentials).
4. **`verification`**: Verification tokens for password resets and email verification flows.
5. **`resumes`**: Core resume entity.
   - `content`: Typed JSON containing sections (personal, summary, experience, education, skills, projects, certifications, etc.) bounded by strict Zod schema caps (~200 KB limit).
   - `design`: Typed JSON containing theme choices (accent color, font family, sizing, spacing, margins, paper size).
   - `version`: Monotonically incrementing integer used for optimistic concurrency control inside SQL queries (`WHERE id=? AND user_id=? AND version=?`).
   - Indexes: `(user_id, updated_at)`.
6. **`resume_snapshots`**: Reversion checkpoints for undo/restore functionality.
   - Auto-pruned to retain at most the newest 20 snapshots per resume.
   - Indexes: `(resume_id, created_at)`.
7. **`share_links`**: Public read-only sharing representation.
   - Unique 14-character nanoid slug.
   - Strict 1:1 relation to resume (`resume_id UNIQUE`).
   - Granular privacy flags: `is_active`, `allow_download`, `noindex`, `password_hash`, `expires_at`.
   - `view_count` recorded conditionally, filtering automated crawlers to preserve D1 free-tier write budget.

---

## 5. Route Map & Behavior Notes

```
/                     -> Marketing Landing Page & "Start Building" CTA
/build                -> Guest Resume Builder (Local storage persistence, draft replace, print/export)
/resumes/new          -> Choose-Start Page (Blank canvas, code samples, or Import JSON)
/resumes/:id/edit     -> Authenticated Resume Editor (Content & Design panels, continuous preview, export menu)
/resumes/:id/preview-data -> Resource route: JSON preview data with Cache-Control: private, max-age=60
/resumes/:id/export.json  -> Authenticated resource route: On-demand JSON backup download with attachment header
/dashboard            -> Authenticated Resume Dashboard ("My Documents": search, sort, cursor pagination, CRUD, JSON export)
/login                -> Sign In Page with redirect parameter retention
/signup               -> Account Registration Page with instant session generation
/forgot-password      -> Password reset request
/reset-password       -> Password reset fulfillment
/r/:slug              -> Public Read-Only SSR Resume Page (Phase 8)
/health               -> Resource route: returns status, D1 ping & table count verification
/api/auth/*           -> Better Auth endpoints (Session, Signin, Signup)
/logout               -> Session invalidation endpoint
```

### 5.2 Export & Import Architecture (Phase 7)

```
========================= EXPORT PIPELINE =========================

+-----------------------------------------------------------------+
|                       Editor Header / Guest                     |
+-----------------------------------------------------------------+
           |                     |                      |
           v                     v                      v
    [Download PDF]        [Download JSON]        [Download Plain Text]
           |                     |                      |
           v                     v                      v
+--------------------+ +--------------------+ +--------------------+
|  usePrintResume    | |  exportResumeJson  | |  exportResumeText  |
|  - Check hint pref | |  - Versioned env   | |  - Section order   |
|  - Font pre-flight | |  - 2-space indent  | |  - Hidden filter   |
|  - Title swap      | |  - Deterministic   | |  - Clean bullets   |
|  - window.print()  | |  - Blob download   | |  - Blob / copy     |
+--------------------+ +--------------------+ +--------------------+
           |
           v
+-----------------------------------------------------------------+
|  CSS Paged Media Engine (@page { size: ...; margin: 0; })       |
|  - break-inside: avoid-page                                     |
|  - -webkit-print-color-adjust: exact                            |
|  - Native OS print sheet -> Save as PDF (Vector ATS output)     |
+-----------------------------------------------------------------+

========================= IMPORT PIPELINE =========================

+-----------------------------------------------------------------+
|               ImportDialog (Drag & Drop or Select)              |
+-----------------------------------------------------------------+
           |
           v
+-----------------------------------------------------------------+
|  parseResumeJson(rawText) Security Barrier:                     |
|  1. Pre-parse Size Check: byteLength <= 220 KB (OOM defense)   |
|  2. Prototype Pollution Guard: regex("__proto__"|"constructor") |
|  3. Schema Version Verification ($schema / version)             |
|  4. Strict Zod Validation (content) + Lenient Fallback (design) |
|  5. Nanoid ID Regeneration (100% fresh IDs for all items)       |
+-----------------------------------------------------------------+
           |
           v
+-----------------------------------------------------------------+
|  Summary Card Preview (Title, Template, Sections, Items count)  |
+-----------------------------------------------------------------+
           |
    +------+------+
    |             |
    v (Guest)     v (Authenticated)
+------------+ +--------------------------------------------------+
| Replace    | | POST /resumes/new (action: import)               |
| Draft in   | | - Verify user resume count < 20                  |
| LocalState | | - Create resume row in D1                        |
+------------+ | - Redirect to /resumes/:id/edit                  |
               +--------------------------------------------------+
```

### Dashboard Behavior & Free Tier Protections
- **Authentication Guard**: Every loader and mutating action calls `requireUser`. Unauthenticated requests redirect to `/login?redirectTo=...`.
- **Authorization Isolation**: Missing or unowned resumes respond with HTTP 404 (never 403) to prevent ID enumeration.
- **CSRF Defense**: All mutating actions verify `Origin` header matching current origin.
- **Free Tier Budget Protections**:
  - `listResumes` projects lightweight metadata only, omitting heavy `content` and `design` JSON blobs.
  - Per-user cap of 20 resumes enforced on both create and duplicate.
  - Safe SQL LIKE wildcard escaping for `%` and `_`.
  - Stable cursor pagination with primary key tie-break (`resumes.id`).
  - Lazy `ResumeThumbnail` with `IntersectionObserver`, concurrency throttle (max 4 requests), and memory caching.

---

## 6. Free-Tier Constraints & Risk Mitigation

1. **Cloudflare Worker CPU Budget (10ms limit per request on Free Tier)**:
   - _Risk_: Heavy compute (server-side PDF rendering like Puppeteer/Playwright, bcrypt hashing) easily exceeds 10ms CPU time and crashes worker instances.
   - _Mitigation_: Client-side PDF export via browser print stylesheets; WebCrypto-based PBKDF2/argon2 tuned iterations or Better Auth D1 edge-optimized adapters.
2. **D1 Daily Row Write Limits (~100k writes/day)**:
   - _Risk_: Recording view counts on `/r/:slug` on every single bot hit exhausts D1 write allowances.
   - _Mitigation_: Filter bot User-Agents (`isbot` library); debounce autosave to ~1000ms.
3. **Optimistic Concurrency & Data Loss**:
   - _Risk_: Multiple browser tabs overwriting resume state silently.
   - _Mitigation_: Check version number in the SQL UPDATE query (`WHERE id = ? AND version = ?`).
4. **Snapshot Storage Growth**:
   - _Risk_: Endless snapshots blooming database storage.
   - _Mitigation_: Enforce a hard cap of 20 snapshots per resume, pruning older snapshots during creation.

---

## 7. Delivery Milestones

- **Phase 1: Project Scaffold and Architecture** (Tooling, RR v7, D1 binding, test harness, CI, docs) [DONE]
- **Phase 2: Database Schema & Migrations** (D1 tables, Drizzle schemas, typed queries, seed script, tests) [DONE]
- **Phase 3: Authentication & Guest Claiming** (Better Auth, WebCrypto PBKDF2 edge hashing, auth pages, route guards, tests) [DONE]
- **Phase 4: Resume CRUD & Dashboard** (Resume management, duplicate, delete, search, sort, cursor pagination, 404 isolation, cards) [DONE]
- **Phase 5: Resume Editor Core** (Two-pane UI, section forms, dynamic lists, bullet points, autosave, guest draft claim flow) [DONE]
- **Phase 6: Templates & Customization** (5 ATS-compliant templates, theme & typography styling, design panel, thumbnails, continuous preview) [DONE]
- **Phase 7: Export Systems** (Print stylesheet, client-side PDF download, JSON import/export, plain-text export) [DONE]
- **Phase 8: Public Share Links** (Slug generator, public `/r/:slug` page, password/expiry controls, HMAC cookies, bot-filtered view counting) [DONE]
- **Phase 9: ATS Checker & Rule Engine** (Rule-based score calculator, ATS guidelines, keywords matcher) [DONE]
- **Phase 10: Polish, Hardening & Production Deploy** (Performance audit, axe a11y, live Cloudflare deploy)

---

## 8. Phase 8: Public Share Link Architecture & Sequence Diagrams

### Diagram 1: Owner Enable Share Link
```
Owner Browser                 Worker Edge (/resumes/:id/share)            Cloudflare D1
     |                                      |                                  |
     |--- 1. POST { intent: "enable" } ---->|                                  |
     |    (CSRF verified, auth checked)     |--- 2. Count active user links -->|
     |                                      |<-- Return count (cap = 10) ------|
     |                                      |                                  |
     |                                      |--- 3. upsertShareLink ---------->|
     |                                      |    (slug, allowDownload: true,   |
     |                                      |     noindex: true, active: true) |
     |                                      |<-- Return share record ----------|
     |                                      |                                  |
     |<-- 4. 200 OK { ok: true, slug } -----|                                  |
     |                                      |                                  |
     | (UI displays public URL, QR code,    |                                  |
     |  options, and view count panel)      |                                  |
```

### Diagram 2: Public View Flow (Hostile-by-Default & View Counting)
```
Visitor / Crawler Browser          Worker Edge (/r/:slug)                 Cloudflare D1
        |                                   |                                   |
        |--- 1. GET /r/:slug -------------->|                                   |
        |                                   |--- 2. getRawShareLinkBySlug ----->|
        |                                   |<-- Return share row --------------|
        |                                   |                                   |
        |                                   |-- 3. Compute status:              |
        |                                   |   - Missing / Revoked / Expired:  |
        |                                   |     Throw 404 (Uniform boundary)  |
        |                                   |   - Password required:            |
        |                                   |     Verify rs_<slug> cookie       |
        |                                   |                                   |
        |                                   |-- 4. If hideContact: true         |
        |                                   |   Redact email & phone in-memory  |
        |                                   |                                   |
        |                                   |-- 5. Human View Check:            |
        |                                   |   !isBot && !isOwner && !isDeduped|
        |                                   |   -> ctx.waitUntil(recordView())  |
        |                                   |   -> Set-Cookie: rv_<slug> (30m)  |
        |                                   |                                   |
        |<-- 6. Render HTML + Headers ------|                                   |
        |    (Cache-Control: no-store,      |                                   |
        |     X-Robots-Tag: noindex,        |                                   |
        |     X-Frame-Options: DENY)        |                                   |
```

### Diagram 3: Password Unlock Flow (PRG Pattern & Signed Cookie)
```
Visitor Browser                     Worker Edge (/r/:slug)                 Cloudflare D1
     |                                       |                                  |
     |--- 1. POST { password } ------------->|                                  |
     |                                       |-- 2. IP Rate Limit Check (5/min) |
     |                                       |                                  |
     |                                       |-- 3. WebCrypto PBKDF2 Verify     |
     |                                       |   (Constant-time comparison)     |
     |                                       |                                  |
     |                                       |-- 4. Issue HMAC-SHA256 Token:    |
     |                                       |   Sign { slug, pwFingerprint, exp}
     |                                       |   Cookie rs_<slug> (HttpOnly,24h)|
     |                                       |                                  |
     |<-- 5. 200 OK + Set-Cookie ------------|                                  |
     |    (Client reloads automatically)     |                                  |
     |                                       |                                  |
     |--- 6. GET /r/:slug (with cookie) ---->|                                  |
     |                                       |-- 7. verifyUnlockToken() -> true |
     |<-- 8. Render Unlocked Resume ---------|                                  |
```

### Diagram 4: Owner Revocation / Slug Regeneration Flow
```
Owner Browser                 Worker Edge (/resumes/:id/share)            Cloudflare D1
     |                                      |                                  |
     |--- 1. POST { intent: "disable" } --->|                                  |
     |       (or intent: "regenerate")      |--- 2. Update share_links ------->|
     |                                      |    (isActive = false / new slug) |
     |                                      |<-- DB commit --------------------|
     |<-- 3. 200 OK (Status: Sharing Off) --|                                  |
     |                                                                         |
     | [Simultaneous Visitor Request on Old URL]                               |
     |                                                                         |
Visitor Browser                     Worker Edge (/r/:oldSlug)             Cloudflare D1
     |                                      |                                  |
     |--- 4. GET /r/:oldSlug -------------->|                                  |
     |                                      |--- 5. getRawShareLinkBySlug ---->|
     |                                      |<-- Inactive / Not Found ---------|
     |                                      |                                  |
     |<-- 6. Immediate 404 Unavailable -----|                                  |
     |    (Zero stale cache, no-store)      |                                  |
```

---

## 9. Phase 9: ATS Checker & Job Description Matcher Architecture

### Diagram 1: Resume Analysis Pipeline
```
ResumeContent + ResumeDesign + PageCount
                  │
                  ▼
       buildAtsContext(content, design, { now, pageCount })
       - Filter visible sections in configured order
       - Flatten plain text and count words
       - Index bullets with (sectionId, itemId, bulletIndex)
       - Detect language via English stopword ratio (>= 0.08)
                  │
                  ▼
           Rule Registry (Pure Rule Execution)
   ┌──────────────┬──────────────┬──────────────┐
   │ Contact (15) │ Structure(15)│ Summary (10) │
   ├──────────────┼──────────────┼──────────────┤
   │ Experience(30│ Dates (10)   │ Length (10)  │
   ├──────────────┴──────────────┴──────────────┤
   │ Language / Tone (10)                       │
   └────────────────────────────────────────────┘
                  │
                  ▼
        Raw Checks Array [Check, Check, ...]
                  │
                  ▼
       analyze() Normalization Engine
       - Exclude `na` checks from denominator:
         Score = round((Sum(earned_credit * weight) / Sum(active_weight)) * 100)
       - Score label mapping:
         0-39: "Needs work", 40-69: "Good start", 70-89: "Strong", 90-100: "Excellent"
       - Rank top 3 recoverable fixes by unearned weight
                  │
                  ▼
              AtsReport
       (score, label, categories, checks, topFixes, meta)
```

### Diagram 2: Job Description Match Pipeline (100% Client-Side)
```
Target Job Description (Pasted into textarea, capped at 10,000 chars)
                  │
                  ▼
       tokenize(rawText)
       - Strip URLs & email addresses
       - Preserve special tokens: C++, C#, .NET, Node.js, Next.js, CI/CD, Wi-Fi, R, Go
       - Split hyphenated & slash tokens while preserving compound boundaries
                  │
                  ▼
       extractKeywords(jobDescription)
       - Segment headers: Requirements, Qualifications, Must Have, Responsibilities
       - Boost tokens in requirement sections (1.8x multiplier)
       - Match 1-to-3-gram phrases against ~300 in-repo skills dictionary
       - Filter generic stopwords and light-stem non-catalog words
                  │
                  ▼
       matchJobDescription(jobDescription, atsContext)
       - Compare canonical keywords against visible resume text (strict boundaries)
       - Keyword coverage calculation weighted by keyword importance
       - Classify into Matched Chips (count) and Missing Chips (ranked)
       - Generate non-coercive placement hints ("Add only if true for you")
       - Detect keyword stuffing (repeated density > 4% or long comma dumps)
                  │
                  ▼
       JobMatchResult (Rendered locally in JobMatchCard, saved to sessionStorage only)
```

---

## 10. Phase 10: Polish, Hardening, and Production Release (MVP Complete)

### Architecture Highlights
- **Global Security Envelope**: Edge middleware injecting strict CSP (`default-src 'self'`), HSTS, nosniff, framing protection, and Permissions-Policy across all routes.
- **Account Deletion & Data Sovereignty**: Immediate, atomic database cascades for user account deletion across `users`, `accounts`, `sessions`, `resumes`, `snapshots`, `share_links` with signed cookie invalidation.
- **Whole-Archive Data Export**: JSON array of versioned envelopes streamed directly from `/api/export-data` with `Cache-Control: no-store`.
- **A11y & Contrast**: Zero serious/critical Axe violations across all public and authenticated routes; WCAG 2.2 AA compliant contrast ($\ge 4.5:1$).
- **CI/CD Automation**: Dual GitHub Actions workflows: `.github/workflows/ci.yml` (PR gates: lint, typecheck, vitest unit, vitest worker, production build, playwright e2e & a11y) and `.github/workflows/deploy.yml` (production deploy to Cloudflare with automated smoke tests).

---

## 11. Post-MVP Roadmap (Future Scope)

The following features were intentionally excluded from the MVP to preserve edge performance, code simplicity, and strict free-tier compliance:
1. **Cloudflare Workers AI Assistant**: On-demand bullet point rewrites and grammar suggestions using `@cloudflare/ai` models (e.g., Llama 3 8B), strictly behind feature flags and user opt-in.
2. **Client-Side DOCX Export**: Word document generation using `docx` in a Web Worker to preserve offline/client-side privacy.
3. **Cover Letter Builder**: Matched typography and design presets aligning cover letter styling with the chosen resume template.
4. **Multi-Language ATS Rule Sets**: Dedicated linguistic catalogs for Spanish, German, and French resume structure and verb tense analysis.
5. **Job Application Kanban Tracker**: Simple local/synced pipeline for tracking resume submissions, interview stages, and offers.


