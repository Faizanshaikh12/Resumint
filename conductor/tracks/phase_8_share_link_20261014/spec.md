# Specification: Phase 8 - Share via Link

## 1. Overview
Phase 8 implements the public share link feature in Resumint. It allows resume owners to generate public, shareable URLs (`/r/:slug`) for their resumes with granular privacy controls: expiry dates, password protection (PBKDF2/WebCrypto), contact detail redaction (stripping email and phone), search engine indexing opt-out (`noindex`), and toggling client-side PDF downloads.

Public endpoints are hostile-by-default and unauthenticated. Responses must never leak private user metadata, database IDs, email addresses, password hashes, or version histories. Revoked, expired, and non-existent links return an identical generic 404 page. View counts are collected safely for human visits using an in-memory/cookie deduplication window and `ctx.waitUntil` without collecting PII.

## 2. Functional Requirements

### 2.1 Schema & Storage
- Add `hideContact` (boolean, default false) to `share_links` table in D1.
- Update share link database queries and types to support `hideContact`.
- Enforce strict exclusion of `passwordHash` from UI/loader contracts, returning only `hasPassword: boolean`.

### 2.2 Pure Share Logic (`app/lib/share/`)
- `status.ts`: Calculate share status (`ok`, `unavailable`, `password_required`). At public boundary, missing, revoked, and expired links are mapped strictly to `unavailable`.
- `expiry.ts`: Presets (7, 30, 90 days, custom date, never) converted to UTC end-of-day timestamp with past date rejection.
- `redact.ts`: Redact candidate email and phone when `hideContact` is enabled.
- `password.ts`: PBKDF2 WebCrypto password hashing and constant-time verification with per-hash random salt.
- `unlock-cookie.ts`: HMAC-SHA256 signed unlock token over `{ slug, pwFingerprint, exp }` with cookie `rs_<slug>` (httpOnly, secure in prod, sameSite=lax, max 24h).
- `bots.ts`: Detect search engine crawlers, link unfurlers (Slack, Discord, Twitter, WhatsApp), prefetch requests, and non-HTML accepts.
- `meta.ts`: Build Open Graph and SEO meta tags (`<Name> - <Title>`, summary excerpt up to 160 chars, noindex when requested, generic title for locked pages).

### 2.3 Owner Management (`/resumes/:id/share`)
- Authenticated owner route guarded by `requireUser` with 404 isolation for non-owners.
- Actions: `enable`, `update` (allowDownload, noindex, hideContact, expiresAt), `setPassword`, `removePassword`, `regenerate` (instant slug rotation), `disable`, `enableAgain`, `deleteLink`.
- Active link cap: Maximum 10 active share links per user to protect D1 free-tier quota.
- Guest users clicking "Share" in the editor are presented with `AuthDialog` to sign up / save to account first.

### 2.4 Public Resume Viewer (`/r/:slug`)
- Loader evaluates link status; throws generic 404 for missing/expired/revoked.
- If password-protected: verify unlock cookie; if invalid, return only `{ locked: true }`.
- Locked state: Renders minimal unlock form with rate limiting (429 on abuse) and generic error timing path.
- Unlocked state: Redacts contact details before loader return; renders responsive `ResumePreview` (fits mobile 390px cleanly), slim top bar with "Download PDF" (if allowed via `usePrintResume`), and subtle Resumint footer.
- When `allowDownload` is false, hide the download button and apply best-effort `@media print { display: none !important; }`.
- Security headers: `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `X-Robots-Tag: noindex, nofollow` when `noindex` or locked/unavailable.
- View count increment: Executed via `ctx.waitUntil` for real human views only (excluding owner, bots, and repeat visits within 30 min dedupe window via `rv_<slug>` cookie).

### 2.5 Share Settings UI
- Dedicated management view with on/off switch, copyable public URL with toast feedback, QR code generator modal (client-side render with download PNG action).
- Settings toggles: Allow PDF Download, Hide Contact Info, Search Engine Opt-out, Expiry presets, Password protection modal.
- Danger zone: Regenerate link (immediate invalidation of old slug), Disable, Delete link.

### 2.6 Dashboard Integration
- Resume cards display real-time share status badge: `Not shared`, `Shared`, `Protected`, `Expired`, `Disabled`.
- Quick menu actions: "Share settings" and "Copy link" for active links.

## 3. Acceptance Criteria
1. Public route `/r/:slug` never returns account email, user ID, internal resume ID, version, or password hash in HTML or loader JSON.
2. Expired, revoked, and nonexistent share links produce identical 404 responses.
3. Password-protected links show zero candidate content until unlocked with correct password.
4. Redaction strips email and phone when `hideContact` is active.
5. Search engines are instructed not to index via `X-Robots-Tag` and robots meta.
6. 100% test coverage across pure logic, worker integration, RTL components, and Playwright E2E browser flows.
