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

## Deployment

Deploy directly to Cloudflare Workers edge:

```bash
npm run deploy
```

---

## Documentation

- [Architecture & Plan](docs/PLAN.md)
- [Task Tracker](docs/TASKS.md)
- [Architecture Decision Records](docs/DECISIONS.md)
- [Agent & Contributor Guidelines](AGENTS.md)

---

## License

MIT © 2026 Faizan Shaikh
