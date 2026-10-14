# Track Implementation Plan: Phase 8 - Share via Link

### Phase 1: Schema Addition & Migration
- [x] Task: Add `hideContact` (boolean, default false) to `shareLinks` table in `app/lib/db/schema.ts`
- [x] Task: Generate migration via drizzle-kit, review SQL by hand, and apply locally
- [x] Task: Update share query functions (`app/lib/db/queries/shares.ts`) and ensure `passwordHash` is never selected into public/UI return types
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 2: Pure Logic Foundation (`app/lib/share/`) & Unit Tests
- [x] Task: Implement `app/lib/share/status.ts` (`getShareStatus(link, now)` with public `unavailable` mapping and expiry boundary)
- [x] Task: Implement `app/lib/share/expiry.ts` (presets 7/30/90 days/custom/never, UTC end-of-day timestamp, past date rejection)
- [x] Task: Implement `app/lib/share/redact.ts` (`redactContactDetails` removing email and phone when `hideContact` is true)
- [x] Task: Implement `app/lib/share/password.ts` (constant-time compare, random salt, PBKDF2 WebCrypto, 6-128 chars)
- [x] Task: Implement `app/lib/share/unlock-cookie.ts` (HMAC-SHA256 signed cookie `rs_<slug>`, 24h expiration, password fingerprint invalidation)
- [x] Task: Implement `app/lib/share/bots.ts` (`isLikelyBot` detection table for crawlers, link previews, prefetch, non-HTML accept)
- [x] Task: Implement `app/lib/share/meta.ts` (`buildShareMeta` with profile tags, truncated summary, robots tags, generic fallback)
- [x] Task: Implement comprehensive unit tests in `tests/unit/share.test.ts`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 3: Owner Management Route (`/resumes/:id/share`)
- [x] Task: Create `app/routes/resumes.$id.share.tsx` loader with `requireUser`, ownership 404, returning share configuration without `passwordHash`
- [x] Task: Implement action intents (`enable`, `update`, `setPassword`, `removePassword`, `regenerate`, `disable`, `enableAgain`, `deleteLink`) with per-user active link limit (10 max)
- [x] Task: Wire editor header "Share" button to navigate to `/resumes/:id/share`, or open `AuthDialog` for guest users
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 4: Public Route `/r/:slug` & Live Resume Viewer
- [x] Task: Implement `app/routes/r.$slug.tsx` loader with slug lookup, status computation, and indistinguishable 404 for missing/expired/revoked
- [x] Task: Implement locked state rendering (password form with rate-limiting, generic error timing path, signed unlock cookie issuance)
- [x] Task: Implement unlocked state rendering with server-side contact redaction, `ResumePreview` template rendering, and mobile responsive layout (390px)
- [x] Task: Implement slim top bar ("Download PDF" hook when `allowDownload` is true) and footer ("Made with Resumint")
- [x] Task: Implement `@media print` suppression when `allowDownload` is false
- [x] Task: Implement route `headers` export (`no-store`, `noindex` headers, CSP frame-ancestors / X-Frame-Options DENY)
- [x] Task: Implement view count increment via `ctx.waitUntil` (filtering bots, owner, and 30-min dedupe cookie `rv_<slug>`)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 5: Share Settings UI & Client-Side QR Code Dialog
- [x] Task: Build Share Settings interface in `app/routes/resumes.$id.share.tsx` (on/off switch, link copy button, expiry presets, password modal, danger zone)
- [x] Task: Implement lightweight client-side QR code generator dialog with "Download PNG" action
- [x] Task: Add accessible status indicators, live regions, and optimistic fetcher updates
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 6: Dashboard Integration & Optimized List Query
- [x] Task: Update dashboard resume list query to include lightweight share link status join (`isActive`, `expiresAt`, `hasPassword`) without content blobs or `passwordHash`
- [x] Task: Add real-time share status badges on `ResumeCard.tsx` (`Not shared`, `Shared`, `Protected`, `Expired`, `Disabled`)
- [x] Task: Add "Share settings" and "Copy link" options to `ResumeCard.tsx` action menu
- [x] Task: Verify resume deletion cascades to delete associated share link
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 7: Component, Worker Integration & Playwright E2E Tests
- [x] Task: Component tests for Share settings UI, locked page, and QR modal in `tests/components/Share.test.tsx`
- [x] Task: Worker integration tests for owner endpoints, public loader isolation, password flows, headers, and view counting in `tests/worker/share.test.ts`
- [x] Task: Playwright E2E tests (`tests/e2e/share.spec.ts`) using dual browser contexts (owner + visitor), password unlock, expiry, PDF download, and Axe scans
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 8: Documentation & Verification
- [x] Task: Update `docs/PLAN.md` with share lifecycle ASCII diagrams and route definitions
- [x] Task: Update `docs/DECISIONS.md` with ADRs (uniform 404s, live content vs snapshot, unlock cookie HMAC, dedupe view counter)
- [x] Task: Update `docs/TASKS.md` and `README.md`
- [x] Task: Run full verification suite (`npm run lint`, `npm run typecheck`, `npm test`, `npm run test:worker`, `npm run build`, `npm run test:e2e`)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)
