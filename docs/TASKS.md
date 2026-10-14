# Resumint - Project Tasks & Checklist

## Phase 1: Project Scaffold and Architecture

- [x] Task 1.1: Project Documentation (PLAN.md, TASKS.md, DECISIONS.md, AGENTS.md, README.md skeleton)
- [x] Task 1.2: Template Bootstrap (`create-react-router` with cloudflare-d1 template)
- [x] Task 1.3: Dependency Upgrades (Upgrade all packages to latest stable releases, verify dev server)
- [x] Task 1.4: Core Configuration (`tsconfig.json` strict, `wrangler.jsonc`, D1 typed client, `drizzle.config.ts`)
- [x] Task 1.5: Directory Scaffolding & Canonical Structure (`app/`, `workers/`, `tests/`, `scripts/`)
- [x] Task 1.6: UI Foundation & Design System (Tailwind CSS v4, shadcn/ui components, base layout with Header/Footer)
- [x] Task 1.7: Resource & Error Routes (`/health` with D1 `SELECT 1` ping, root 404 & ErrorBoundary)
- [x] Task 1.8: Quality Tooling & Scripts (ESLint, Prettier, `typecheck`, `lint`, `format`)
- [x] Task 1.9: Testing Harness Setup (Vitest unit tests, RTL component test, `@cloudflare/vitest-plugin` D1 test, Playwright e2e with Axe)
- [x] Task 1.10: CI/CD Automation (`.github/workflows/ci.yml`)
- [x] Task 1.11: Verification & Smoke Test (Run all checks, document results)

---

## Phase 2: Database Layer (Resumint)

- [x] Task 2.1: Typed JSON contracts in `app/lib/schemas/resume.ts` (`resumeContentSchema`, `resumeDesignSchema`, `templateIdSchema`, size caps, default factories)
- [x] Task 2.2: Unit tests for schemas and bounds in `tests/unit/resume-schema.test.ts`
- [x] Task 2.3: Drizzle schema definition in `app/db/schema.ts` (Better Auth tables: `user`, `session`, `account`, `verification`; Domain tables: `resumes`, `resume_snapshots`, `share_links` with cascade deletes and indexed timestamps)
- [x] Task 2.4: Drizzle migration generation (`drizzle/0000_cool_lethal_legion.sql`) and execution (local & remote D1)
- [x] Task 2.5: Typed query modules in `app/db/queries/`:
  - [x] `resumes.ts`: `createResume`, `listResumes` (lightweight metadata only), `getResume`, `updateResume` (optimistic concurrency inside SQL), `renameResume`, `deleteResume`, `duplicateResume`
  - [x] `snapshots.ts`: `createSnapshot`, `listSnapshots`, `restoreSnapshot` (bumps version, pre-restore backup), auto-prune to newest 20
  - [x] `shares.ts`: `upsertShareLink`, `regenerateSlug`, `revokeShareLink`, `deleteShareLink`, `getPublicResumeBySlug` (sanitized projection), `recordView` (with bot filter)
  - [x] Barrel export `app/db/queries/index.ts`
- [x] Task 2.6: Idempotent seed script (`scripts/seed.ts` via `npm run db:seed`) creating demo user + 3 sample resumes (Developer, Student, Designer)
- [x] Task 2.7: Upgraded `/health` endpoint reporting D1 connection, table verification count, and schema status
- [x] Task 2.8: Vitest worker integration tests:
  - [x] `tests/worker/schema.test.ts`: FK cascade deletes, unique slug, unique resumeId
  - [x] `tests/worker/resumes.test.ts`: CRUD, projection, authorization isolation, optimistic concurrency, payload validation
  - [x] `tests/worker/snapshots.test.ts`: creation, restoration, pruning, auth isolation
  - [x] `tests/worker/shares.test.ts`: upsert, slug regen, public projection, bot filter, auth isolation
  - [x] `tests/worker/health.test.ts`: table verification and worker environment
- [x] Task 2.9: Production deployment to Cloudflare Workers with verified schema on live D1 database
- [x] Task 2.10: Updated documentation (`PLAN.md` with ASCII ER diagram, `DECISIONS.md` with ADRs 007-011, `README.md`)

---

## Phase 3: Authentication (Resumint)

- [x] Task 3.1: Research & Decision Record (ADR-012 in DECISIONS.md: WebCrypto PBKDF2 edge hashing, session storage, rate limiting, email verification deferred)
- [x] Task 3.2: Edge-compliant WebCrypto PBKDF2-SHA256 password hasher (`app/auth/crypto.server.ts`, 100k iterations, constant-time compare, <3ms CPU execution)
- [x] Task 3.3: Request-scoped Better Auth factory (`app/auth/auth.server.ts`) with Drizzle D1 adapter, rolling session lifecycle, rate limiting, dev email stub
- [x] Task 3.4: Server helpers & route guards (`app/auth/helpers.server.ts` & `app/auth/redirect.ts`: `getSession`, `requireUser`, `requireGuest`, `safeRedirect`, `AuthUser`)
- [x] Task 3.5: Critical Gate Benchmark on deployed free-plan Worker (20/20 live signups and signins succeeded, 100% success rate, 0 CPU errors, documented in ADR-012)
- [x] Task 3.6: Reusable accessible UI:
  - [x] `app/components/auth/AuthForm.tsx` (react-hook-form + Zod, show/hide password, compact mode, accessible labels & aria-live alerts)
  - [x] Routes: `/login`, `/signup`, `/forgot-password`, `/reset-password`
  - [x] Placeholder `/dashboard` protected by `requireUser`
  - [x] POST `/logout` route clearing session
  - [x] Header authentication state with user profile dropdown
- [x] Task 3.7: Comprehensive Test Suites:
  - [x] Unit/component tests (29 passing tests: Zod schemas, safeRedirect, AuthForm RTL, Header auth state)
  - [x] Worker integration tests (43 passing tests: signup, duplicate rejection, login, session cookies, logout, requireUser redirect, 429 rate limit, expired session, sensitive token leak prevention)
  - [x] Playwright E2E tests (6 passing tests: signup -> dashboard -> logout -> login, protected redirect flow, Axe accessibility audits on /login and /signup with 0 violations)
  - [x] Coverage: 100% statement and line coverage on `app/auth` and schemas
- [x] Task 3.8: Documentation updates (`DECISIONS.md`, `PLAN.md`, `TASKS.md`, `README.md`)

---

## Phase 4: Resume CRUD & Dashboard (Resumint)

- [x] Task 4.1: Shared Building Blocks:
  - [x] `app/lib/schemas/resume-actions.ts`: Zod schemas for intents (`create`, `rename`, `duplicate`, `delete`, unified `dashboardActionSchema`), `ActionResult<T>` type, `dashboardQuerySchema`
  - [x] `app/lib/resume/samples.ts`: 3 complete code samples (developer, student, designer) adhering to `resumeContentSchema`, `listSamples()`, `getSample(id)`
  - [x] `app/lib/utils/format.ts`: Web Standard `formatRelativeTime`, `truncateTitle`, `formatDuplicateTitle` (capped at 100 chars)
  - [x] `app/lib/resume/limits.ts`: `MAX_RESUMES_PER_USER = 20`
  - [x] `app/db/queries/resumes.ts`: added `countResumes`, keyset cursor pagination with stable primary-key tie-break, safe SQL LIKE wildcard escaping (`%` and `_`), no-op rename optimization
- [x] Task 4.2: Routes & Server Logic:
  - [x] `/dashboard`: loader with `?q=`, `?sort=`, `?cursor=`, lightweight metadata projection, limit check; action supporting typed create, rename, duplicate, delete intents
  - [x] `/resumes/new`: choose-start page (blank or 3 samples), respects limit, redirects to `/resumes/:id/edit`
  - [x] `/resumes/:id/edit`: protected placeholder loader requiring ownership, 404 isolation for non-owned documents, friendly 404 ErrorBoundary
  - [x] `app/lib/security/csrf.server.ts`: Origin validation rejecting cross-origin mutating requests with 403
  - [x] Updated `app/routes.ts`
- [x] Task 4.3: Accessible Dashboard UI:
  - [x] Header: "My Documents", usage counter ("X of 20"), "New resume" CTA with disabled limit state
  - [x] Toolbar: debounced search input (syncs to `?q=`), sort selector (syncs to `?sort=`), URL as source of truth
  - [x] `ResumeCard`: accessible thumbnail miniature with initials, template badge, relative timestamp, share status badge, action dropdown
  - [x] In-place `RenameDialog` with validation and autofocus
  - [x] Confirmation `DeleteDialog` explicitly naming document and warning of snapshot/share cascade
  - [x] Optimistic mutations via `useFetcher` with rollback and toasts ("Resume renamed", "Resume duplicated", "Resume deleted")
  - [x] Keyset pagination via "Load more" button
  - [x] Skeletons, empty states, and no-search-results states
- [x] Task 4.4: Comprehensive Verification:
  - [x] 11 new unit tests for schemas, samples, formatting, and limits
  - [x] 7 component tests for `ResumeCard` and `DashboardEmptyState`
  - [x] 13 worker integration tests: auth guards, limit enforcement (21st rejected), 404 route-level authorization isolation, LIKE wildcard escaping, CSRF rejection, lightweight projection verification
  - [x] 3 Playwright E2E suites: full CRUD lifecycle, User B 404 isolation, Axe WCAG 2.1 AA audits on dashboard, `/resumes/new`, and open delete dialog (0 violations)
  - [x] Code coverage: 98.9% statement and line coverage
- [x] Task 4.5: Documentation updates (`PLAN.md`, `DECISIONS.md` with ADR-013, `TASKS.md`, `README.md`)

---

## Phase 5: Resume Editor, Autosave, Versions & Guest Flow
- [x] **Stage 5A: Editor Core (Complete)**:
  - [x] Task 5.1: Pure logic foundation in `app/lib/resume/` (`editor-state.ts`, `section-registry.ts`, `reorder.ts`, `dates.ts`, `persistence.ts`)
  - [x] Task 5.2: Server action & loader on `/resumes/:id/edit` with optimistic concurrency version bump, 409 conflict, 404 isolation, CSRF origin checks, and 200 KB size caps
  - [x] Task 5.3: Responsive two-pane editor layout with desktop split and mobile edit/preview tab toggle
  - [x] Task 5.4: Live reactive forms with collapsible cards for all 12 standard sections + custom sections, tag-style skills badges, and sortable `<BulletEditor />`
  - [x] Task 5.5: Left section navigation with dnd-kit sortable reordering, visibility toggle, and add/delete custom sections
  - [x] Task 5.6: Semantic HTML `<BasicPreview />` in CSS-scaled A4 container behind abstract `<ResumePreview />`
  - [x] Task 5.7: Navigation protection with React Router `useBlocker` and browser `beforeunload`
  - [x] Task 5.8: Comprehensive test suite (98.9% statement coverage, 73 unit/component tests, 64 worker tests, 10 Playwright E2E tests, 0 Axe a11y violations)
- [ ] **Stage 5B: Autosave, Undo/Redo, Versions & Guest Claim (Awaiting Approval)**:
  - [ ] Task 5.9: Debounced autosave engine (~1.5s) with hash skip, single in-flight coalescing, retry backoff, and 409 conflict modal
  - [ ] Task 5.10: Client undo/redo history stack (~100 items) with keystroke coalescing
  - [ ] Task 5.11: Version snapshot history (`/resumes/:id/versions`), auto-snapshot throttling (1 per 30m), and pre-restore backups
  - [ ] Task 5.12: Client-only `/build` guest flow with versioned localStorage draft (`resumint:guest-draft:v1`) and in-place `AuthDialog` claim flow

---

## Phase 6: Templates & Design Customization (Resumint)

- [x] Task 6.1: Design Contract & Tokens (`app/lib/schemas/resume.ts`, `design-tokens.ts`, `contrast.ts`, `sanitize-link.ts`, `normalize-design.ts`, `touched-merge.ts`)
- [x] Task 6.2: Pure Presentational Templates (`ModernTemplate.tsx`, `MinimalTemplate.tsx`, `ExecutiveTemplate.tsx`, `ClassicTemplate.tsx`, `TechnicalTemplate.tsx`)
- [x] Task 6.3: Modular Template Parts (`SectionRenderer.tsx`, `ItemDate.tsx`, `BulletList.tsx`, `LinkList.tsx`, `SkillList.tsx`)
- [x] Task 6.4: Template Registry (`app/components/templates/registry.ts`) with metadata, capabilities, and fallback handling
- [x] Task 6.5: Continuous Scaled Preview (`app/components/preview/ResumePreview.tsx`, `ResumeErrorBoundary.tsx`, `resume-page.css`) with page break guides and `@page` rules
- [x] Task 6.6: Self-hosted Fonts (6 ATS-safe font families bundled with `@fontsource/inter` and native system font fallbacks, zero external Google Fonts CDN calls)
- [x] Task 6.7: Visual Design Panel UI (`app/components/editor/DesignPanel.tsx`) with template gallery radio cards, color swatches, hex picker with WCAG contrast warnings, typography dropdown, sliders, toggles, and reset confirmation
- [x] Task 6.8: Editor State & History Integration (`ResumeEditor.tsx`, `EditorContext.tsx`, `EditorHeader.tsx`) with Content/Design view switcher, slider coalescing (<400ms), undo/redo stack, and debounced autosave
- [x] Task 6.9: Resource Route `/resumes/:id/preview-data` and Lazy `ResumeThumbnail` with `IntersectionObserver`, concurrency throttle, and memory cache
- [x] Task 6.10: Comprehensive Testing & Verification:
  - [x] 117 unit and component tests passing
  - [x] 68 Vitest worker integration tests passing
  - [x] Playwright E2E tests (`tests/e2e/design.spec.ts`) with template switching, persistence, and Chromium `page.pdf()` print fidelity
  - [x] 0 ESLint errors and warnings
  - [x] 0 TypeScript compiler errors
  - [x] Production build passes cleanly (`react-router build`)
- [x] Task 6.11: Documentation (`docs/TEMPLATES.md`, `docs/DECISIONS.md` with ADRs 015-017, `docs/PLAN.md`, `docs/TASKS.md`, `README.md`)

---

## Phase 7: Export and Import Systems (Resumint)

- [x] Task 7.1: Pure Export & Import Logic:
  - [x] `filename.ts`: Deterministic candidate filename generator (`[A-Za-z0-9_-]`, 80-char cap, Windows reserved names safe)
  - [x] `json.ts`: Deterministic versioned JSON export with 2-space indentation and trailing newline
  - [x] `json.ts`: Hardened `parseResumeJson` with pre-parse 220 KB size cap, prototype pollution prevention (`"__proto__"`, `"constructor"`, `"prototype"`), strict Zod content validation, lenient design fallback, and 100% item ID regeneration with `nanoid()`
  - [x] `text.ts`: Plain-text ATS serialization (`exportResumeText`) with section ordering, hidden section filtering, uppercase headers, and `- ` bullet points
  - [x] `download.ts`: Browser Blob download helper (`downloadText`) and clipboard writer (`copyToClipboard`) with textarea fallback and toast notifications
- [x] Task 7.2: PDF Print Pipeline:
  - [x] `print.ts`: `printResume` with `document.fonts.ready` preflight, temporary `document.title` swap, and `afterprint` restoration
  - [x] `usePrintResume.ts`: Hook orchestrating print states, hint preference persistence in `localStorage`, and print trigger
  - [x] `PrintHintDialog.tsx`: One-time print settings modal (Destination: Save as PDF, Margins: None, Headers/Footers: OFF, Background graphics: ON, Mobile tip) with "Don't show this again" checkbox
  - [x] `PrintRoot.tsx`: Dynamic `@page { size: ...; margin: 0; }` style tag injection for A4 and Letter paper formats
  - [x] `print.css`: Production print stylesheets with `-webkit-print-color-adjust: exact`, page-break rules (`break-inside: avoid-page`, `break-after: avoid`), and URL wrapping
- [x] Task 7.3: Export UI Integration:
  - [x] `ExportMenu.tsx`: Accessible dropdown menu with Download PDF, Download JSON, Download Plain Text, and Copy as Text
  - [x] `EditorHeader.tsx`: Integrated ExportMenu into both authenticated editor and guest builder header
  - [x] `ResumeCard.tsx`: Added "Download JSON" direct backup action to dashboard resume action menu
  - [x] `/resumes/:id/export.json`: Authenticated resource route serving JSON attachment with 404 isolation, ownership check, and `Cache-Control: no-store`
- [x] Task 7.4: JSON Import Flow & Guest Builder:
  - [x] `ImportDialog.tsx`: Accessible drag-and-drop modal with file picker, pre-parse 220 KB client size check, summary card preview, error states, and import action
  - [x] `/resumes/new`: Added "Import JSON" card, handling `intent: "import"` with user cap limit check (< 20), Zod validation, and redirect to editor
  - [x] `/build`: Guest resume builder route with local storage persistence (`resumint_guest_draft`), export menu, and draft replace confirmation dialog
  - [x] `app/routes/home.tsx`: Updated hero CTA button to navigate to `/build` for guest-first onboarding
- [x] Task 7.5: Comprehensive Testing & Verification:
  - [x] 17 pure unit tests in `tests/unit/export-import.test.ts` (100% passing)
  - [x] 7 component tests in `tests/components/ExportImport.test.tsx` (100% passing)
  - [x] 8 worker integration tests in `tests/worker/export-import.test.ts` (100% passing)
  - [x] Playwright E2E tests in `tests/e2e/export-import.spec.ts` (JSON roundtrip, TXT export, 5 templates PDF print fidelity + text extraction, guest `/build` flow, Axe a11y scans)
  - [x] 0 ESLint errors and warnings
  - [x] 0 TypeScript compiler errors
  - [x] Production build passes cleanly (`react-router build`)
- [x] Task 7.6: Documentation:
  - [x] `docs/DECISIONS.md`: ADR-018 (Print CSS vs PDF Libs), ADR-019 (JSON Schema, Prototype Pollution & Nanoid Regeneration), ADR-020 (Plain-Text ATS Export)
  - [x] `docs/PLAN.md`: Export/Import ASCII architecture data-flow diagrams and updated route map
  - [x] `docs/TASKS.md`: Phase 7 checklists marked complete
  - [x] `README.md`: Documented export/import options, browser print configuration, and mobile PDF tips

---

## Phase 8: Public Share Links (Resumint)

- [x] Task 8.1: Schema & Query Module Updates:
  - [x] `app/db/schema.ts`: Added `hideContact` (boolean, default false) to `share_links` table
  - [x] Generated migration `drizzle/0001_magenta_invaders.sql` and applied locally to Cloudflare D1
  - [x] Updated query module `app/db/queries/shares.ts` (`upsertShareLink`, `getShareLinkByResumeId`, `getRawShareLinkBySlug`, `getPublicResumeById`, `countActiveShareLinks`, `revokeShareLink`, `deleteShareLink`, `recordView`)
  - [x] Strict projection rules: Never select `passwordHash` into client/loader types; expose only `hasPassword: boolean`
- [x] Task 8.2: Pure Share Logic Foundation in `app/lib/share/`:
  - [x] `status.ts`: `getShareStatus` mapping `missing`, `revoked`, `expired` to generic `unavailable` at public boundary; exact UTC boundary comparisons with injected `now`
  - [x] `expiry.ts`: Presets (7, 30, 90 days, custom date, never) to UTC end-of-day; past date rejection
  - [x] `redact.ts`: `redactContactDetails` stripping email, phone, mailto, tel when `hideContact` is enabled
  - [x] `password.ts`: Edge-compliant WebCrypto PBKDF2 password hasher and constant-time verifier (<3ms CPU, zero Node built-ins)
  - [x] `unlock-cookie.ts`: HMAC-SHA256 signed tokens (`rs_<slug>`) over `{ slug, pwFingerprint, exp }`, automatically invalidated on password rotation or clearing
  - [x] `bots.ts`: `isLikelyBot` rejecting crawlers (`Googlebot`, `bingbot`, `Slackbot`, `Twitterbot`, `Discordbot`, `WhatsApp`, etc.), HEAD, prefetch headers, and non-HTML accepts
  - [x] `meta.ts`: `buildShareMeta` building plain-text sanitized title, ~160 char summary description, profile OG tags, and noindex robots meta
- [x] Task 8.3: Owner Management Console (`/resumes/:id/share`):
  - [x] Protected route behind `requireUser` with 404 ownership isolation and CSRF origin verification
  - [x] Loader returns sanitized metadata, never `passwordHash`
  - [x] Typed actions: `enable`, `update`, `setPassword`, `removePassword`, `regenerate`, `disable`, `deleteLink`
  - [x] Per-user active link cap (10 active links) protecting D1 write/storage allowances
  - [x] Guest users: Share button opens `AuthDialog` with no unauthenticated server mutation
- [x] Task 8.4: Public View Route (`/r/:slug`):
  - [x] Uniform 404 unavailable boundary for missing, revoked, and expired links (`This link is unavailable`, `noindex`, `no-store`)
  - [x] Minimal password-protected locked state without candidate name, title, or content leaks
  - [x] In-memory IP/slug rate limiting (5 attempts/min, 429 response)
  - [x] Server-side contact redaction (`hideContact`) applied before data serialization
  - [x] Slim header with candidate name and conditional "Download PDF" button via `usePrintResume`
  - [x] Best-effort print suppression stylesheet when `allowDownload` is false
  - [x] Security headers: `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `X-Robots-Tag: noindex, nofollow`
  - [x] Asynchronous non-blocking view counter via `ctx.waitUntil` with 30-min deduplication cookie (`rv_<slug>`), owner exemption, and bot filtering (0 PII stored)
- [x] Task 8.5: UI & Dashboard Integration:
  - [x] `QrCodeDialog.tsx`: 100% client-side dynamic QR code generation with PNG download
  - [x] `ResumeCard.tsx`: Real-time status badges (`Not shared`, `Shared`, `Protected`, `Expired`, `Disabled`) and "Copy link" / "Share settings" action menu
  - [x] `EditorHeader.tsx`: Wired Share button and guest `AuthDialog` modal
- [x] Task 8.6: Comprehensive Testing:
  - [x] 28 unit tests in `tests/unit/share.test.ts` (100% passing)
  - [x] 10 component tests in `tests/components/Share.test.tsx` (100% passing)
  - [x] 12 worker query tests in `tests/worker/shares.test.ts` (100% passing)
  - [x] 11 worker route integration tests in `tests/worker/share-routes.test.ts` (100% passing)
  - [x] 6 Playwright E2E tests in `tests/e2e/share.spec.ts` (100% passing)
  - [x] 0 ESLint errors and warnings
  - [x] 0 TypeScript compiler errors
  - [x] Production build passes cleanly (`react-router build`)
- [x] Task 8.7: Documentation updates (`docs/PLAN.md`, `docs/DECISIONS.md`, `docs/TASKS.md`, `README.md`)

---

## Phase 9: ATS Checker, Resume Score & Job Matcher (Resumint)

- [x] Task 9.1: Types, Framework & Normalization Engine (`app/lib/ats/`):
  - [x] `types.ts`: Defined `CheckStatus`, `CategoryId`, `FieldTarget`, `Check`, `CategoryScore`, `AtsReport`, `AtsContext`, `AtsRule`, and `CATEGORY_DEFINITIONS` with weights
  - [x] `context.ts`: Pure context builder (`buildAtsContext`) indexing visible sections, word count, plain text, bullets with metadata, and language detection via stopword ratio
  - [x] `analyze.ts`: Deterministic evaluation with `na` check renormalization formula (`round((earned / active) * 100)`), score label mapping, and top 3 high-impact fixes
  - [x] In-repo curated dictionaries in `data/`: `action-verbs.ts` (180 past, 160 present, weak phrases), `buzzwords.ts` (70 clichés), `stopwords.ts`, `placeholders.ts`, and `skills.ts` (~300 tech/business/clinical skills with aliases)
- [x] Task 9.2: Complete ATS Rule Set in `app/lib/ats/rules/`:
  - [x] `contact.ts` (15 pts): Full name present, valid email, plausible phone, location, HTTPS links, no placeholder values
  - [x] `structure.ts` (15 pts): Essential sections (Experience/Projects + Education + Skills), standard section headings, sensible order, no duplicates
  - [x] `summary.ts` (10 pts): Presence, 25-80 words, avoids first-person "I", avoids buzzword-only fluff
  - [x] `experience.ts` (30 pts): Action verbs (past tense for past roles, present for current), quantified metrics (percentages, numbers, currencies), length (8-30 words), 2-6 bullets per role, no repetitive opening verbs (>2x)
  - [x] `dates.ts` (10 pts): Parseable dates, chronological consistency, reverse-chronological order, unexplained gaps > 12m (warn-only), current roles have "Present"
  - [x] `length.ts` (10 pts): Page budget (1-2 pages via Phase 6 page model), total word count (150-1000), paragraph density, 5-25 skills items
  - [x] `language.ts` (10 pts): Leftover placeholder/Lorem text, first-person pronouns in bullets, buzzword density, double spaces, repeated words, ALL CAPS runs, trailing punctuation consistency
  - [x] `registry.ts`: Clean modular registry mapping pure rules
- [x] Task 9.3: 100% Client-Side Job Description Matcher (`app/lib/ats/keywords/`):
  - [x] `tokenize.ts`: Special-token preservation (`C++`, `C#`, `.NET`, `Node.js`, `Next.js`, `CI/CD`, `Wi-Fi`, `R`, `Go`), URL/email stripping, 10,000 char cap
  - [x] `extract.ts`: Section-aware extraction (1.8x boost for requirements/qualifications/must-have headers), skills dictionary matching, generic word exclusion, light stemming
  - [x] `match.ts`: Strict word-boundary matching, canonical alias mapping, weighted coverage percentage, matched chips, ranked missing chips with non-coercive hints ("Add only if true for you"), and stuffing alert (>4% density or comma dumps)
- [x] Task 9.4: UI Components & Navigation (`app/components/ats/`):
  - [x] Editor left-pane third tab: **Content | Design | Check**
  - [x] `ScoreGauge.tsx`: Circular SVG meter, accessible score label, category progress bars, and honesty disclaimer: *"Resumint checklist score (a guide, not a guarantee)"*
  - [x] `ChecklistItem.tsx`: Status icons + text (never color alone), title, message, fix block, keyboard-accessible target navigation
  - [x] `TopFixesCard.tsx`: Top 3 high-impact fixes ranked by recoverable points with WCAG AA compliant badge
  - [x] `JobMatchCard.tsx`: Character counter, local analysis, coverage bar, matched chips, missing chips with placement hints, stuffing alert, `sessionStorage` sync, and clear button
  - [x] `ScoreBadge.tsx`: Debounced dynamic score pill in `EditorHeader.tsx` opening Check tab on click
  - [x] `field-focus.ts`: `focusField()` DOM selector navigating to `data-field-path` attributes and auto-scrolling
  - [x] `data-field-path` attributes added across all editor form inputs
- [x] Task 9.5: Comprehensive Testing & Verification:
  - [x] 43 unit tests across framework, rules, and keywords in `tests/unit/ats-*.test.ts` (100% passing)
  - [x] 5 component tests in `tests/components/AtsChecker.test.tsx` (100% passing)
  - [x] 4 Playwright E2E tests in `tests/e2e/ats.spec.ts` (100% passing): guest flow, issue navigation, fix & score update, local JD match & privacy network assertion, score badge, Axe a11y scan
  - [x] Zero network requests containing sensitive JD text asserted in E2E
  - [x] Analysis performance budget verified (< 15ms pure compute, 500ms debounced UI)
  - [x] 0 ESLint errors and warnings
  - [x] 0 TypeScript compiler errors
  - [x] Production build passes cleanly (`react-router build`)
- [x] Task 9.6: Documentation:
  - [x] `docs/PLAN.md`: Resume analysis and JD match pipeline ASCII diagrams, Phase 9 marked complete
  - [x] `docs/DECISIONS.md`: Added ADR-031 to ADR-041 covering client-side scoring, weights, NA renormalization, separate JD match, wordlist authoring, heuristic limits, English scope, JD privacy, zero AI, SSRF prevention, and performance budget
  - [x] `docs/TASKS.md`: Phase 9 ticked and Phase 10 outline refined
  - [x] `README.md`: Feature section, category weights table, honesty disclaimer, and new rule authoring guide

---

## Phase 10: Polish, Hardening & Production Deploy (Refined Outline)

- [ ] Task 10.1: Accessibility & Design Audit:
  - [ ] Complete automated Axe scans across all routes (`/`, `/build`, `/dashboard`, `/resumes/:id/edit`, `/r/:slug`)
  - [ ] Keyboard navigation, focus rings, reduced-motion preferences, and screen reader announcements
  - [ ] Color contrast verification across all 5 resume templates and dark/light UI modes
- [ ] Task 10.2: Performance, Bundle Size & Core Web Vitals:
  - [ ] Audit client bundle chunks and assets; verify zero unnecessary dependencies
  - [ ] Measure First Contentful Paint (FCP), Largest Contentful Paint (LCP), and Interaction to Next Paint (INP)
  - [ ] Fine-tune caching headers and asset immutability
- [ ] Task 10.3: Edge Hardening & Error Handling:
  - [ ] Verify rate limiting on auth and share unlock endpoints
  - [ ] Production 404 and 500 error boundary presentation
  - [ ] D1 quota verification and edge memory safety
- [ ] Task 10.4: Production Deployment & Verification:
  - [ ] Execute remote D1 migrations on live Cloudflare environment
  - [ ] Deploy worker bundle to production via Wrangler
  - [ ] Conduct end-to-end smoke verification on live `.workers.dev` domain
  - [ ] Finalize production documentation and project wrap-up

