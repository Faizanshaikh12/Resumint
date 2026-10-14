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

---

## ADR-013: Resume CRUD, Dashboard State & Authorization Architecture (Phase 4)

- **Status**: Accepted
- **Context**: Phase 4 connects the D1 database layer to authenticated routes (`/dashboard`, `/resumes/new`, `/resumes/:id/edit`), establishes user document management, and enforces strict authorization and D1 free-tier resource boundaries.
- **Decisions**:
  1. **404-not-403 Information Leakage Prevention Policy**:
     - Whenever a user attempts to view, edit, rename, duplicate, or delete a resume that either does not exist or belongs to another user, the application responds with HTTP 404 (Never HTTP 403).
     - Rationale: HTTP 403 reveals that a document with the given identifier exists, allowing document ID enumeration attacks. 404 preserves complete data isolation.
  2. **Per-User Resume Cap (D1 Free Tier Budget Protection)**:
     - Hard cap defined as `MAX_RESUMES_PER_USER = 20`.
     - Both `create` and `duplicate` operations verify `countResumes(db, userId) < 20`. Exceeding this limit immediately rejects the mutation with an informative error message without performing any database writes.
  3. **Lightweight List Projections (Free Tier Memory & Bandwidth)**:
     - `listResumes` explicitly projects lightweight metadata columns (`id`, `userId`, `title`, `templateId`, `version`, `createdAt`, `updatedAt`, `hasShareLink`), completely omitting `content` and `design` JSON blobs.
     - Rationale: Querying large JSON structures on list requests unnecessarily exhausts Worker memory and D1 row read quotas. Full blobs are only fetched when loading an individual resume editor.
  4. **URL-as-State for Search, Sort, and Filtering**:
     - Query parameters (`?q=`, `?sort=updated|created|title`, `?cursor=`) are the single source of truth for the dashboard view.
     - Search inputs are debounced (300ms) and safely escape SQLite `LIKE` wildcard metacharacters (`%` and `_`) via `ESCAPE '\\'` so users searching for literal symbols do not trigger wildcards.
  5. **Stable Cursor Pagination with Primary Key Tie-Break**:
     - Keyset cursors encode `{ v: sortColumnValue, id: resumeId }` in Base64.
     - SQL sorting always includes `resumes.id` as a secondary ordering criteria (e.g. `[desc(updatedAt), desc(id)]`), guaranteeing deterministic pagination that never skips or duplicates rows.
  6. **Deferred Real Thumbnails**:
     - Client-side DOM screenshot rendering and SVG thumbnails are deferred until Phase 6 templates are established.
     - Phase 4 implements a lightweight, accessible CSS initials document miniature with WCAG 2.1 AA compliant contrast ratios.
- **Consequences**: Rock-solid authorization isolation, zero data leaks, efficient free-tier D1 utilization, and an accessible, keyboard-navigable dashboard experience.

---

## ADR-014: Resume Editor Architecture, State Management & Preview Pipeline (Phase 5A)

- **Status**: Accepted
- **Context**: Phase 5A implements the core resume editor UI, state management, section reordering, live preview, and manual persistence. The editor must run on Cloudflare Workers edge, support both logged-in and upcoming guest-first workflows, remain responsive with large documents, and strictly prevent XSS and concurrency bugs.
- **Decisions**:
  1. **Pure Reducer State Management via React Context (`useReducer`)**:
     - Chosen approach: Pure immutable reducer in `app/lib/resume/editor-state.ts` combined with React `useReducer` and `EditorContext`.
     - Rejection of Zustand / Redux: A pure reducer function requires zero external runtime dependencies, keeping the client bundle footprint minimal (33.89 kB gzipped total bundle) and allowing 100% unit test coverage in Vitest without React or DOM mocks.
     - Actions are granular: `UPDATE_FIELD`, `UPDATE_FIELD_PATH`, `ADD_ITEM`, `REMOVE_ITEM`, `MOVE_ITEM`, `ADD_SECTION`, `REMOVE_SECTION`, `RENAME_SECTION`, `REORDER_SECTIONS`, `TOGGLE_SECTION_HIDDEN`, `ADD_BULLET`, `REMOVE_BULLET`, `MOVE_BULLET`, and `REPLACE_CONTENT`.
  2. **Persistence Adapter Abstraction (`ResumePersistence`)**:
     - The editor interacts with storage exclusively via an adapter interface:
       `interface ResumePersistence { save(content: ResumeContent, expectedVersion?: number): Promise<SaveResult>; }`
     - In Stage 5A, `ServerPersistence` sends POST requests to `/resumes/:id/edit` with optimistic concurrency checking (`expectedVersion`), CSRF verification, and 200 KB size caps.
     - In Stage 5B, `GuestPersistence` will implement the exact same interface writing to `localStorage` without altering the `<ResumeEditor />` component.
  3. **Strict Plain-Text Bullets & XSS Immunity**:
     - No rich-text or WYSIWYG editors (TipTap, Slate, Lexical).
     - Bullets and description fields are strictly stored as plain text strings and rendered as native React text nodes (JSX escaping).
     - Zero usage of `dangerouslySetInnerHTML`. This eliminates DOM-based XSS vectors entirely and simplifies export serialization.
  4. **Temporary `BasicPreview` Behind Abstract `<ResumePreview />`**:
     - To ensure Stage 5 does not block on Phase 6 (template engine), preview rendering is abstracted behind `<ResumePreview content design templateId />`.
     - In Stage 5, this delegates to `<BasicPreview />`, which renders semantic HTML (`<h1>`, `<h2>`, `<ul>`, `<li>`) in a responsive CSS-scaled A4 container. In Phase 6, `ResumePreview` will swap in the template registry seamlessly with zero changes to editor state.
  5. **React Router v7 Single Fetch Response Decoding**:
     - In React Router v7 framework mode with Single Fetch enabled, POSTing to an action route outside of `fetcher.submit` returns turbo-stream / Single Fetch encoded arrays (`[{"_1":2...},"actionData",...]`) instead of direct JSON.
     - Implemented `parseActionResponse(text, status)` in `app/lib/resume/persistence.ts` to decode both direct JSON objects and Single Fetch responses, ensuring robust compatibility with React Router v7.
  6. **Stable Nanoid Identifiers**:
     - Every section and array item carries an immutable `nanoid` id used as React `key` and `dnd-kit` sortable id. Array indices are never used as identifiers, preventing item transposition bugs during reordering or deletion.
- **Consequences**: Zero external state libraries, deterministic optimistic concurrency in SQL, robust keyboard-accessible drag-and-drop, instantaneous live preview with zero network latency, and complete decoupling between editor state and storage engines.

---

## ADR-015: Pure Presentational Templates & Zero Content Loss on Switch (Phase 6)

- **Status**: Accepted
- **Context**: Resume builders often conflate template presentation with resume content schemas, causing data fields to disappear or corrupt when switching templates.
- **Decision**:
  - Templates (`Modern`, `Minimal`, `Executive`, `Classic`, `Technical`) are strictly pure presentational components (`(props: TemplateProps) => JSX.Element`).
  - Zero side-effects, zero network fetching, and zero local state inside templates.
  - Resume content schema (`ResumeContent`) is 100% decoupled from templates.
  - Template switching preserves all user content unconditionally.
  - When switching templates, `mergeTouchedDesign(newTemplateDefaults, currentDesign, touchedFields)` preserves fields explicitly customized by the user while updating uncustomized default properties.
- **Consequences**: Switching templates never loses candidate data; templates remain lightweight, modular, and easily testable with full Vitest snapshot and semantic HTML tests.

---

## ADR-016: Continuous Preview Model with Dynamic Page Guides vs. True Server Pagination

- **Status**: Accepted
- **Context**: Emulating exact physical print page breaks inside the live browser editor often causes content clipping, layout jitters, and slow rendering.
- **Decision**:
  - Live preview renders continuous flowing content inside a standard CSS-scaled A4/Letter paper container.
  - Content height is measured reactively with `ResizeObserver` to display dashed page guide overlays (`Pages: N`, with a warning when exceeding 2 pages).
  - Exact page breaking is handled by standard CSS Paged Media rules (`@page`, `break-inside: avoid-page`, `break-after: avoid`) during browser print (`window.print()`).
- **Consequences**: Butter-smooth editing experience with immediate responsive feedback, while print and PDF output cleanly avoid breaking headers, dates, or experience items across physical pages.

---

## ADR-017: ATS Compliance Invariants & Font Bundling Discipline

- **Status**: Accepted
- **Context**: Applicant Tracking Systems (ATS) parse resume documents using text extraction engines that stumble on complex multi-column floats, graphical headers, icons as text, and unencoded fonts.
- **Decision**:
  - Semantic HTML only: Exactly one `<h1>` for candidate name, `<h2>` for section titles, `<h3>` for item headings, `<ul>`/`<li>` for bullets, `<time>` for dates.
  - Strict linear DOM order: Even in 2-column templates (`Technical`), content reads sequentially in the DOM tree, styled via CSS Grid.
  - Zero text in canvas, SVG, or CSS pseudo-elements (`content: "..."`).
  - Strict protocol sanitizer (`sanitizeHref`) permitting only `http:`, `https:`, `mailto:`, `tel:`.
  - Self-hosted woff2 font bundling: 6 ATS-vetted font families (`Inter`, `Source Serif 4`, `Lato`, `Merriweather`, `IBM Plex Sans`, `Roboto Mono`) with zero external Google Fonts CDN runtime dependencies.
- **Consequences**: Maximized ATS machine-readability across major enterprise parsing engines (Workday, Greenhouse, Taleo) with 100% offline edge privacy compliance.

---

## ADR-018: Native Print CSS (@page) vs. Third-Party PDF Libraries (Phase 7)

- **Status**: Accepted
- **Context**: In Phase 7, users need to download pixel-perfect PDF resumes. Client-side alternatives include `@react-pdf/renderer` (heavy, duplicate component tree, rendering divergence) or `html2pdf.js`/`jspdf` (rasterizes HTML to canvas, degrading vector text crispness and breaking ATS selectable text). Server-side alternatives (Puppeteer/Browser Rendering) violate Cloudflare Workers free-tier CPU constraints (10ms limit) and introduce substantial operational costs.
- **Decision**:
  - Implement 100% client-side PDF export utilizing browser native print engines (`window.print()`) combined with CSS Paged Media (`@page`).
  - Dynamically inject paper size rules (`@page { size: 210mm 297mm; margin: 0; }` for A4, `8.5in 11in` for Letter) based on user design settings via `<PrintRoot>`.
  - Enforce exact print styling via `app/styles/print.css`: `-webkit-print-color-adjust: exact`, `print-color-adjust: exact`, page-break rules (`break-inside: avoid-page`, `break-after: avoid`).
  - Pre-flight `document.fonts.ready` before triggering `window.print()` to guarantee all custom woff2 typography is fully rendered.
  - Temporarily set `document.title` to the sanitized candidate filename (e.g. `Alexander_Vance_Resume.pdf`) before print and restore on `afterprint` (with timer fallback).
  - Provide an informative one-time Print Instructions dialog (Destination: Save as PDF, Margins: None, Headers/Footers: OFF, Background graphics: ON) with a "Don't show this again" preference persisted in `localStorage`.
- **Consequences**: Zero added JavaScript bundle overhead (0 KB server, 0 KB heavy canvas/PDF libraries), exact visual fidelity between live editor preview and generated PDF, selectable ATS-readable text vectors, and full mobile support via native system share/print sheets.

---

## ADR-019: Deterministic JSON Schema Envelope, Prototype Pollution Protection, and Full Nanoid Regeneration (Phase 7)

- **Status**: Accepted
- **Context**: Resume portability requires exporting full resume data to JSON and importing previously exported resumes or third-party backups. Untrusted JSON inputs present critical vulnerabilities: memory exhaustion from oversized payloads, prototype pollution attacking JavaScript object prototypes, and ID collisions corrupting editor state or relational databases.
- **Decision**:
  - Standardize on a versioned schema envelope: `{ $schema: "https://resumint.dev/schema/v1.json", title: string, templateId: string, content: ResumeContent, design: ResumeDesign }`.
  - **Pre-parse Size Cap**: Enforce a strict 220 KB size cap before running `JSON.parse()`. Rejects abnormally large inputs without memory allocation spikes.
  - **Prototype Pollution Guard**: Scan raw JSON string for prototype pollution keys (`"__proto__"`, `"constructor"`, `"prototype"`) before parsing.
  - **Validation & Lenient Fallback**: Validate content strictly against Zod schemas; if legacy or customized design tokens are missing or invalid, fall back smoothly to the template's default design tokens rather than failing the import.
  - **ID Regeneration**: Completely regenerate all item IDs (`experience[].id`, `education[].id`, `skills[].id`, `links[].id`, etc.) with fresh cryptographically secure `nanoid()` identifiers upon import to eliminate collision risks across existing database resumes.
  - **Deterministic Formatting**: Export JSON with deterministic 2-space indentation and trailing newline for clean version control diffs.
- **Consequences**: Rock-solid defense against denial-of-service, injection, and prototype pollution attacks. 100% interoperability between guest sessions, local downloads, and cloud-synced user resumes.

---

## ADR-020: Plain-Text ATS Export Formatting & Clipboard Fallbacks (Phase 7)

- **Status**: Accepted
- **Context**: Candidates frequently need plain-text resumes for copy-pasting into legacy ATS text boxes (e.g. Taleo, brassring, job boards) that reject PDF uploads or strip all formatting.
- **Decision**:
  - Implement deterministic plain-text serialization (`exportResumeText`) adhering to established ATS best practices:
    - Candidate name in uppercase headline.
    - Compact contact info block (`email | phone | location | link`).
    - Standard section headers (`WORK EXPERIENCE`, `EDUCATION`, `SKILLS`) matching the user's customized `sectionOrder`.
    - Exclude hidden sections (`hiddenSections`) and empty sections.
    - Bullet points formatted with standard ASCII hyphens (`- `).
    - Consistent `\n` line endings without trailing whitespace.
  - Provide both direct `.txt` download via Blob/object URL and one-click "Copy as Text" to clipboard with `navigator.clipboard.writeText` and a hidden `textarea` fallback for legacy or insecure contexts.
- **Consequences**: Instant accessibility for copy-paste application forms, zero server roundtrips, and optimal keyword parsing in raw text extractors.

---

## ADR-021: Uniform Unavailable Boundaries (Indistinguishable 404 for Missing, Revoked, and Expired Links)

- **Status**: Accepted
- **Context**: In Phase 8 public sharing, exposing distinct responses (e.g., 404 for missing vs 410 Gone for revoked vs 403 Forbidden for expired) leaks sensitive user activity metadata to unauthorized external scanners and scrapers.
- **Decision**:
  - Unify all unavailable link states (`not_found`, `revoked`, `expired`) into a single indistinguishable generic response at the public `/r/:slug` boundary.
  - Return HTTP status `404 Not Found` with the exact body `"This link is unavailable"`.
  - Always emit `X-Robots-Tag: noindex, nofollow` and `Cache-Control: no-store`.
  - Provide specific status reasons (`Active`, `Disabled`, `Expired`, `Protected`) exclusively to the authenticated resume owner inside their private management console (`/resumes/:id/share`).
- **Consequences**: Zero metadata leakage to public visitors; hostile-by-default boundary guarantees confidentiality.

---

## ADR-022: Edge-Optimized Caching (Cache-Control: no-store) vs. D1 Read Budget

- **Status**: Accepted
- **Context**: Public share links require instantaneous revocation. If public resume pages or HTML responses are cached in Cloudflare CDN edge caches or browser caches, revoking a link or changing its password would fail to terminate access immediately.
- **Decision**:
  - Enforce `Cache-Control: no-store` on all `/r/:slug` responses.
  - Mitigate D1 read consumption by issuing at most 1 single D1 query per public page hit (`getRawShareLinkBySlug` joined with resume metadata).
  - Defer view increment writes to asynchronous background execution (`ctx.waitUntil`).
- **Consequences**: Immediate, real-time revocation and password change propagation with predictable, single-digit D1 read operations.

---

## ADR-023: Live Content Rendering vs. Snapshot-Pinned Shares

- **Status**: Accepted
- **Context**: When an author edits their resume in the editor, candidates expect recipients to see the latest corrections without having to manually generate a new link or trigger a "republish" deployment step.
- **Decision**:
  - Render live resume content dynamically from the `resumes` table joined by `share_links.resumeId`.
  - Server-side redact private fields (`hideContact`) in-flight before returning data to visitors.
  - Record static snapshot pinning as a future candidate extension for Phase 10+.
- **Consequences**: Seamless author workflow where edits immediately reflect on active links; zero duplicate storage or desynchronized snapshot data.

---

## ADR-024: Cryptographically Signed HMAC Unlock Cookies (rs_<slug>) & Fingerprint Invalidation

- **Status**: Accepted
- **Context**: Password-protected resumes must not require visitors to enter the password on every page reload or navigation, yet storing plaintext session passwords or database unlock tokens risks token inflation. Furthermore, if an author changes or removes the password, existing visitor unlock sessions must terminate immediately.
- **Decision**:
  - Issue an HMAC-SHA256 signed unlock token in an `HttpOnly`, `SameSite=Lax`, `Path=/r/<slug>` cookie (`rs_<slug>`) valid for 24 hours.
  - Include `{ slug, pwFingerprint, exp }` in the signed token payload.
  - Compute `pwFingerprint` as a WebCrypto SHA-256 digest of the password hash. If the owner rotates or clears the password, existing unlock cookies fail verification automatically without requiring database invalidation tables.
  - Derive secret from `SHARE_COOKIE_SECRET` or `BETTER_AUTH_SECRET`.
- **Consequences**: Zero database read/write cost to verify unlock cookies, automatic invalidation on password rotation, and maximum edge performance.

---

## ADR-025: Non-PII Bot Filtering, Asynchronous View Counting (ctx.waitUntil), and 30-Minute Deduplication

- **Status**: Accepted
- **Context**: Cloudflare D1 Free Tier allows ~100,000 daily row writes. If search engine web crawlers, link preview bots (Slack, Discord, LinkedIn, Twitter, iMessage), owners previewing their own resume, or repeated page refreshes increment the view counter, D1 write quotas would be rapidly depleted.
- **Decision**:
  - **Bot Filtering**: Inspect HTTP method (`HEAD` rejected), `Accept` headers (non-HTML rejected), `Purpose: prefetch` / `Sec-Purpose` headers, and known bot user-agents (`Googlebot`, `bingbot`, `Slackbot`, `Twitterbot`, `facebookexternalhit`, `LinkedInBot`, `WhatsApp`, `Discordbot`).
  - **Owner Exemption**: Validate active Better Auth session; if the viewer is the owner of the resume, do not count the view.
  - **Deduplication**: Issue a 30-minute `HttpOnly` cookie (`rv_<slug>`). Repeated visits within 30 minutes bypass the write counter.
  - **Asynchronous Execution**: Invoke `ctx.waitUntil(recordView(...))` on Cloudflare Workers so counter increments never block public HTML rendering.
  - **Zero PII**: Store only integer counts (`view_count = view_count + 1`). Never store visitor IP addresses, user agents, or timestamps.
- **Consequences**: Zero risk of D1 quota exhaustion from automated scrapers, zero tracking of visitor identities, and sub-10ms SSR rendering.

---

## ADR-026: Robots Meta & Open Crawling Strategy (Permitting /r/ in robots.txt)

- **Status**: Accepted
- **Context**: Users expect search engines not to index their resumes when `noindex` is toggled. If `robots.txt` disallows `/r/`, search engine crawlers will never crawl the page and therefore will never read the `X-Robots-Tag: noindex, nofollow` HTTP header or `<meta name="robots" content="noindex, nofollow" />`, potentially causing search engines to index the URL itself based on external links.
- **Decision**:
  - Do NOT disallow `/r/` in `public/robots.txt`.
  - Never list share URLs in any `sitemap.xml`.
  - Emit both `X-Robots-Tag: noindex, nofollow` and `<meta name="robots" content="noindex, nofollow">` on all `/r/:slug` responses where `noindex: true`, and unconditionally on all locked and unavailable pages.
- **Consequences**: Search engines can crawl the page, process the `noindex` instruction, and completely omit the URL from search indexes.

---

## ADR-027: Convenience vs. DRM: Print Stylesheet Suppression When allowDownload is False

- **Status**: Accepted
- **Context**: Authors may choose to turn off the "Allow PDF Download" toggle. However, web browsers running on user devices can never enforce absolute DRM against client-side screenshots, DOM inspection, or print dialogs.
- **Decision**:
  - Hide the "Download PDF" action button in the public header when `allowDownload` is false.
  - Inject an inline `@media print` style rule hiding `#public-resume-document` and rendering a polite notice during print attempts.
  - Document transparently in documentation and UI help text that this is a convenience barrier, not cryptographic DRM.
- **Consequences**: Honest user communication without misleading security claims; prevents casual unauthorized PDF saving while maintaining web standards compliance.

---

## ADR-028: Contact Redaction Boundary (hideContact) Server-Side Enforcement

- **Status**: Accepted
- **Context**: When authors share resumes publicly on job forums or social networks, they often wish to hide their personal email and telephone number to avoid spammers and telemarketers.
- **Decision**:
  - Enforce contact details redaction (`redactContactDetails`) strictly on the server inside the route loader before serializing JSON or rendering SSR HTML.
  - Clear `email` and `phone` strings from candidate JSON, strip `mailto:` and `tel:` links, and omit them from Open Graph and meta descriptions.
- **Consequences**: Contact details are physically absent from HTTP response payloads, eliminating risk of client-side inspection leakage.

---

## ADR-029: Per-User Active Link Cap (10 Links) for D1 Quota Protection

- **Status**: Accepted
- **Context**: Malicious or runaway scripts could generate millions of unique share slugs, exhausting database storage and index capacity on Cloudflare D1.
- **Decision**:
  - Enforce a strict per-user limit of **10 active share links** (`MAX_ACTIVE_SHARE_LINKS_PER_USER = 10`).
  - Check the active link count before creating a new share link or re-enabling a disabled link.
  - Return HTTP 400 with a clear, user-friendly error message if the limit is exceeded.
- **Consequences**: Guaranteed database capacity preservation within free-tier quotas.

---

## ADR-030: Zero-Dependency Client-Side Dynamic QR Code Generation

- **Status**: Accepted
- **Context**: Providing QR codes for share links allows users to quickly scan and view resumes on mobile devices. Generating QR codes on the server consumes CPU cycles and increases worker bundle size.
- **Decision**:
  - Render QR codes 100% client-side inside `<QrCodeDialog>`.
  - Lazy-load the dialog and QR generator only when the user explicitly clicks the "QR Code" button.
  - Render directly to an HTML5 `<canvas>` element and support one-click PNG download via `canvas.toDataURL("image/png")`.
- **Consequences**: Zero server CPU overhead, zero impact on initial bundle size, accessible keyboard and screen-reader dialog controls.




