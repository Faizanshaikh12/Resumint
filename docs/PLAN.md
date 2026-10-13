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

## 5. Route Map

```
/                     -> Marketing Landing Page & "Start Building" CTA
/resumes/new          -> Guest & Authenticated Resume Builder (Blank / Template)
/resumes/:id/edit     -> Authenticated Resume Editor + Live Preview
/dashboard            -> Authenticated Resume Dashboard (List, Rename, Duplicate, Delete)
/r/:slug              -> Public Read-Only SSR Resume Page (Accessible if active)
/health               -> Resource route: returns status, D1 ping & table count verification
/api/auth/*           -> Authentication endpoints (Session, Signin, Signup)
```

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
- **Phase 3: Authentication & Guest Claiming** (Better Auth, session management, in-place auth modal)
- **Phase 4: Resume CRUD & Dashboard** (Resume management, duplicate, delete, search, cards)
- **Phase 5: Resume Editor Core** (Two-pane UI, section forms, dynamic lists, bullet points, autosave)
- **Phase 6: Templates & Customization** (5 ATS-compliant templates, theme & typography styling)
- **Phase 7: Export Systems** (Print stylesheet, client-side PDF download, JSON import/export)
- **Phase 8: Public Share Links** (Slug generator, public `/r/:slug` page, password/expiry controls)
- **Phase 9: ATS Checker & Rule Engine** (Rule-based score calculator, ATS guidelines)
- **Phase 10: Polish, Hardening & Production Deploy** (Performance audit, axe a11y, live Cloudflare deploy)
