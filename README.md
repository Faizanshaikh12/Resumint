# Resumint 📄✨

> Modern, blazing fast, ATS-optimized online resume builder built with React Router v7 and Cloudflare D1.

[![CI](https://github.com/Faizanshaikh12/Resumint/actions/workflows/ci.yml/badge.svg)](https://github.com/Faizanshaikh12/Resumint/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Live Production URL**: [https://resumint.faizan-shaikh-dev.workers.dev](https://resumint.faizan-shaikh-dev.workers.dev)  
**Live Health Endpoint**: [https://resumint.faizan-shaikh-dev.workers.dev/health](https://resumint.faizan-shaikh-dev.workers.dev/health)

---

## Overview

Resumint provides a zero-friction experience: jump straight into creating your resume with live previews, customize typography and layouts, export high-fidelity PDFs client-side, and claim your draft securely when ready to save or share.

---

## Features

- **ATS Checklist Score & Real-Time Checker**: Explainable 0-100 score evaluating contact basics, structure, summary, experience action verbs and quantifiers, dates, length, and tone. Every point lost maps to an actionable fix with clickable editor field navigation.
- **100% Client-Side Job Description Match**: Match pasted job descriptions against visible resume content with canonical skill dictionary matching, requirement heading boost, and keyword stuffing detection. Job text is processed 100% locally and never leaves your browser.
- **Public Share Links (`/r/:slug`)**: Share formatted resumes instantly via secret web links with zero login friction for recipients. Live updates reflect author edits in real-time.
- **Granular Privacy Controls**:
  - **Password Protection**: Require visitors to enter a password before viewing candidate name, summary, or details. Protected by constant-time WebCrypto PBKDF2 verification, in-memory IP rate limiting, and signed HMAC-SHA256 unlock cookies (`rs_<slug>`).
  - **Server-Side Contact Redaction**: Hide candidate email address and phone number server-side before sending HTML/JSON to public visitors.
  - **Link Expiration**: Automatically deactivate links after 7, 30, 90 days, or a custom UTC cutoff date.
  - **Search Engine De-Indexing**: Emit `X-Robots-Tag: noindex, nofollow` headers and robots meta tags so search crawlers do not index public resumes.
  - **PDF Download Toggle**: Allow or disallow visitor PDF downloads, backed by best-effort `@media print` suppression rules.
  - **Uniform 404 Boundaries**: Missing, revoked, and expired links return identical generic 404 responses to eliminate metadata leakage.
- **Client-Side QR Code Generator**: One-click QR code dialog generated 100% client-side with instant PNG download.
- **Non-PII View Counting**: Asynchronous background view counter via `ctx.waitUntil` with 30-minute visitor deduplication (`rv_<slug>`), owner session bypass, and crawler/bot filtering. Zero IP addresses, user agents, or PII stored.
- **5 ATS-Optimized Templates**: `Modern`, `Minimal`, `Executive`, `Classic`, and `Technical`. Pure presentational design guarantees zero content loss during template switching.
- **Client-Side High-Fidelity PDF Export**: Zero-overhead browser print engine (`@page`, `window.print()`) with automatic paper formatting (`A4` and `US Letter`), pre-flight font readiness, and ATS-readable selectable text vectors.
- **Complete JSON Backup & Import**: Portable versioned JSON envelope (`$schema: https://resumint.dev/schema/v1.json`), protected by a 220 KB pre-parse size cap, prototype pollution prevention, and 100% item ID regeneration with `nanoid()`.
- **Plain-Text ATS Export**: Deterministic `.txt` file export and one-click "Copy as Text" to clipboard, optimized for copy-pasting into legacy ATS job portals with standard uppercase headers and clean bullet points.
- **Guest-First Builder (`/build`)**: Jump directly into editing with local storage persistence (`resumint_guest_draft`), free PDF/JSON/Text export, and draft replacement confirmation dialogs.
- **Visual Design Customization**: Dedicated Design panel with curated swatches, hex picker with real-time WCAG 2.1 AA contrast warnings, font scale/margin sliders, and typography options.
- **Continuous Scaled Preview**: Real-time CSS-scaled preview with reactive page-break guides (`Pages: N`) measuring content height with `ResizeObserver`.
- **Self-Hosted Offline Fonts**: 6 ATS-compliant font families bundled as local woff2 assets with zero external Google Fonts CDN runtime calls.
- **Lazy Document Miniature Thumbnails**: High-performance dashboard cards with `IntersectionObserver` lazy loading, concurrency-throttled preview fetching (max 4 concurrent), and memory caching.
- **Document Management ("My Documents")**: Fast, responsive dashboard at `/dashboard` with keyset cursor pagination, on-demand JSON downloads, and optimistic updates.
- **Flexible Creation**: Start blank, import existing JSON, or select from 3 industry-tested code samples (Software Engineer, Student / Entry-Level, Product Designer).
- **In-Place Actions**: Seamless in-place rename dialogs, one-click resume duplication (`<title> (Copy)`), and confirmation dialogs with cascade warnings.
- **Search & Sort**: Debounced title search with safe SQL LIKE wildcard escaping and multiple sorting criteria (`updated`, `created`, `title`), synchronized with URL search params.
- **Edge & Free-Tier Optimized**: Lightweight projections (no JSON blobs on list queries) and a strict 20-resume per-user storage cap to protect D1 free quotas.
- **Enterprise Authorization Isolation**: Non-owned or missing documents consistently respond with HTTP 404 (never 403) to prevent ID enumeration.
- **WCAG 2.1 AA Compliant**: High-contrast, accessible UI with screen-reader live regions, full keyboard navigation, and zero axe-core violations.
- **Edge Authentication**: Edge-native WebCrypto PBKDF2-SHA256 password hashing with sub-3ms CPU execution on Cloudflare Workers Free Tier.

---

## ATS Checker & Resume Score

Resumint includes a pure, client-side, rule-based resume checker in the **Check** tab of the editor.

> [!NOTE]
> **Resumint checklist score (a guide, not a guarantee)**  
> No real applicant tracking system publishes a score, and Resumint does not claim that any resume is "ATS approved" or guaranteed to pass ATS filters. This heuristic score highlights formatting pitfalls, missing quantifications, vague verbs, and structure issues so you can put your best foot forward.

### How the Score Works

The score ranges from 0 to 100 and is grouped into four tiers:
- **0–39**: Needs work
- **40–69**: Good start
- **70–89**: Strong
- **90–100**: Excellent

Points are allocated across 7 categories totaling 100 points:

| Category | Weight | What We Check |
| :--- | :---: | :--- |
| **Contact and basics** | 15 pts | Full name present, valid email format, plausible phone number, location, HTTPS links, and absence of sample/placeholder values. |
| **Structure** | 15 pts | Core sections (Experience or Projects + Education + Skills), standard section headings, logical section ordering, and no duplicate sections. |
| **Summary** | 10 pts | Present, optimal length (~25-80 words), avoids first-person "I", and avoids buzzword-only fluff. |
| **Experience bullets** | 30 pts | Strong action verbs (past tense for past roles, present for current), quantified achievements (numbers, %, currencies), optimal length (8-30 words), 2-6 bullets per role, and verb diversity. |
| **Dates and order** | 10 pts | Valid chronological ordering, reverse-chronological consistency, current roles marked "Present", and flags unexplained employment gaps > 12 months as a warning. |
| **Length and readability** | 10 pts | Page budget (1-2 pages via layout page model), sensible word count (150-1000), avoids dense paragraph walls, and 5-25 skills items. |
| **Language and tone** | 10 pts | No leftover placeholder/Lorem text, avoids first-person pronouns, low buzzword density, double spaces, repeated words, and consistent bullet punctuation. |

### Fair Scoring: The `na` Renormalization Formula
Career changers, students, or recent graduates who have a **Projects** section instead of formal Work Experience are not penalized. Applicable checks evaluate to `"na"` (Not Applicable) and are excluded from the denominator:
$$\text{Score} = \text{round}\left( \frac{\sum \text{Earned Credit} \times \text{Weight}}{\sum \text{Active Weights}} \times 100 \right)$$

### 100% Client-Side Job Description Match
Compare your resume against any target job posting:
1. Paste the target job posting into the **Job Description Match** card (capped at 10,000 characters).
2. The tokenizer preserves technical tokens (`C++`, `C#`, `.NET`, `Node.js`, `Next.js`, `CI/CD`, `Wi-Fi`, `R`, `Go`) and boosts requirements/qualifications headings (1.8x).
3. Evaluates matched keywords vs missing keywords using an in-repo dictionary of ~300 common skills and aliases.
4. Missing keyword hints indicate where terms could belong (Skills, Summary, Experience) alongside the disclaimer: *"Add only if true for you"*.
5. Includes a keyword stuffing guard that warns if terms are unnaturally repeated (>4% density).
6. **Privacy Guarantee**: Pasted job descriptions are never transmitted over the network and remain strictly in memory and browser `sessionStorage`.

### Adding a New Rule
Adding a new rule to Resumint is modular and requires just three steps:
1. Create a pure rule function in `app/lib/ats/rules/<category>.ts` returning a `Check`:
   ```ts
   export function myRule(ctx: AtsContext): Check {
     const passed = ...;
     return {
       id: "my-rule-id",
       category: "structure",
       weight: 3,
       status: passed ? "pass" : "warn",
       credit: passed ? 1 : 0.5,
       title: "Rule title",
       message: "Human description of what was evaluated",
       fix: "Actionable step to resolve the issue",
       targets: [{ sectionId: "skills" }],
     };
   }
   ```
2. Register the rule in `app/lib/ats/rules/registry.ts`.
3. Add table-driven unit tests in `tests/unit/ats-rules.test.ts` asserting `pass`, `warn`, `fail`, `na`, and edge cases (empty strings, Unicode, etc.).


---

## PDF Export & Browser Print Settings

Resumint renders print-ready, ATS-optimized PDFs directly in the browser using standard CSS Paged Media rules (`@page`).

### Recommended Browser Print Settings:
1. **Destination**: Select *"Save as PDF"* (or your preferred PDF printer).
2. **Paper Size**: Matches your selected design setting (*A4* `210mm x 297mm` or *US Letter* `8.5in x 11in`).
3. **Margins**: Set to **"None"** or **"Default"** (page margins are built into each template's layout engine).
4. **Headers and Footers**: Turn **OFF** (removes browser URL, timestamp, and page numbers).
5. **Background Graphics**: Turn **ON** (preserves theme accents, category sidebars, and divider lines).

### Mobile Export Tip:
- **iOS Safari / Chrome on Android**: Tap **Share > Print**, preview the document, and use a two-finger pinch-out gesture on the print preview to view and save the full uncompressed vector PDF to Files or Google Drive.

---

## Tech Stack

- **Framework**: React Router v7 (Framework Mode) on Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM
- **UI & Styling**: React 19, Tailwind CSS v4, Lucide React, shadcn/ui
- **Forms & Validation**: React Hook Form, Zod
- **Testing**: Vitest, React Testing Library, `@cloudflare/vitest-plugin`, Playwright
- **Deployment**: Cloudflare Workers (Free Plan edge budget)

---

## Getting Started

### Prerequisites

- Node.js >= 20.x
- npm >= 10.x
- Cloudflare Wrangler CLI

### Installation

```bash
git clone https://github.com/Faizanshaikh12/Resumint.git
cd Resumint
npm install
```

### Environment Configuration

Create a `.dev.vars` file for local development (copy from `.dev.vars.example`):

```ini
BETTER_AUTH_SECRET=your-random-32-character-secret-key-here
BETTER_AUTH_URL=http://localhost:5173
```

For Cloudflare D1 migrations and Drizzle Studio tooling, create `.env`:

```ini
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_DATABASE_ID=2be466e3-a248-49a9-8e46-57c6ad2ad5be
CLOUDFLARE_D1_TOKEN=your_cloudflare_api_token
```

### Production Secrets

Configure production secrets on Cloudflare Workers via Wrangler:

```bash
npx wrangler secret put BETTER_AUTH_SECRET
npx wrangler secret put BETTER_AUTH_URL
npx wrangler secret put SHARE_COOKIE_SECRET
```

> [!NOTE]
> **Known Limitation (MVP)**: Email verification is currently deferred as no transactional email provider is configured. In local development, password reset links are printed directly to the console via an edge logging stub. In production, password reset requests return generic success responses.

---

## Database Management & Migrations

Resumint uses **Drizzle ORM** with **Cloudflare D1** (SQLite).

### 1. Generate Migrations
Generate SQL migration files in `/drizzle` from schema changes in `app/db/schema.ts`:
```bash
npm run db:generate
```

### 2. Apply Migrations Locally
Apply migrations to local SQLite Miniflare D1 state:
```bash
npm run db:migrate:local
```

### 3. Apply Migrations to Remote Cloudflare D1
Apply migrations to production Cloudflare D1:
```bash
npm run db:migrate:remote
```

### 4. Seed Database
Seed local D1 with demo user and 3 production-grade sample resumes (Developer, Student, Designer):
```bash
npm run db:seed
```
*(To seed remote D1, pass `-- --remote`)*

### 5. Drizzle Studio
Inspect and manage tables visually via Drizzle Kit Studio:
```bash
npx drizzle-kit studio
```

---

## Local Development

```bash
npm run dev
```

---

## Verification & Testing

Resumint enforces strict multi-tier quality checks:

```bash
# Lint checks
npm run lint

# TypeScript compiler & React Router typegen
npm run typecheck

# Unit & Component tests (Vitest + JSDOM)
npm run test:unit

# Cloudflare Worker & D1 Integration tests (Miniflare D1)
npm run test:worker

# Playwright End-to-End & Axe accessibility audit
npm run test:e2e

# Production build validation
npm run build
```

---

---

## Cloudflare Free Tier & Quota Protection

Resumint is specifically engineered to operate sustainably within the Cloudflare Workers and D1 Free Plan:

| Metric | Cloudflare Free Limit | Resumint Implementation & Consumption | Safety Margin |
| :--- | :--- | :--- | :--- |
| **Worker CPU Time** | 10 ms / request | Sub-3ms WebCrypto hashing & SQLite reads; heavy PDF generation and ATS checks offloaded to client | > 70% headroom |
| **Worker Bundle Size** | 3 MB compressed | **370.03 kB gzipped** (1.87 MB raw) production worker bundle | 87.7% headroom |
| **Worker Requests** | 100,000 / day | Static assets cached immutably; debounced autosave (1000ms); client-side scoring | High daily buffer |
| **D1 Row Reads** | 5,000,000 / month | Lightweight metadata projection on list queries (resumes list omits 200 KB JSON blobs) | Generous margin |
| **D1 Row Writes** | 100,000 / month | 20-resume per-user hard storage cap; 20-snapshot rolling auto-prune; atomic updates | Controlled writes |
| **D1 Storage** | 5 GB total | Average resume row size: ~15-25 KB JSON text | Capacity for >150k resumes |

---

## Environment Variables

| Variable | Required | Description |
| :--- | :---: | :--- |
| `BETTER_AUTH_SECRET` | Yes | 64+ character random cryptographic secret for session signing and auth. |
| `BETTER_AUTH_URL` | Yes | Canonical origin URL (e.g. `http://localhost:5173` or `https://resumint.dev`). |
| `SHARE_COOKIE_SECRET` | Yes | Secret for HMAC-SHA256 signing of password-unlocked public share cookies. |
| `ENVIRONMENT` | No | Environment identifier (`development` or `production`). |

---

## Limitations & Disclaimers

1. **Heuristic ATS Score**: The 0–100 score in the Check tab is a deterministic educational heuristic based on common recruiting standards. It does not guarantee employment or specific corporate ATS outcomes.
2. **Mobile Printing**: Client-side PDF export relies on browser print engines. On iOS Safari and Chrome Android, use *Share > Print > Pinch Outward* to save the full document vector.
3. **Email Delivery**: Resumint MVP does not include an external SMTP/transactional email provider. Password reset flows print secure token links to local server logs in development.
4. **Zero Third-Party AI**: Resumint does not transmit resume data or job descriptions to OpenAI, Anthropic, or external LLMs.

---

## Post-MVP Roadmap

- [ ] **Cloudflare Workers AI**: Opt-in bullet point rewrites and grammar suggestions using `@cloudflare/ai`.
- [ ] **Client-Side DOCX Export**: Word document generation via client-side Web Worker.
- [ ] **Matching Cover Letter Builder**: Synchronized template design presets for cover letters.
- [ ] **Multi-Language ATS Rules**: Linguistic catalogs for French, German, and Spanish.
- [ ] **Job Application Kanban Board**: Simple local tracker for submissions and interview status.

---

## Documentation

- [Architecture & Design Plan](docs/PLAN.md)
- [Task & Milestone Registry](docs/TASKS.md)
- [Architectural Decision Records (ADRs)](docs/DECISIONS.md)
- [Security Architecture & Threat Model](docs/SECURITY.md)
- [Operations & Disaster Recovery Runbook](docs/OPERATIONS.md)
- [Accessibility (WCAG 2.2 AA) Audit](docs/A11Y.md)
- [Agent & Contributor Guidelines](AGENTS.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

---

## License

MIT © 2026 Faizan Shaikh
