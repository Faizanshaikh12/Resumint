# Track Implementation Plan: Phase 8 - Share via Link

### Phase 1: Schema Addition & Migration
- [ ] Task: Add `hideContact` (boolean, default false) to `shareLinks` table in `app/lib/db/schema.ts`
- [ ] Task: Generate migration via drizzle-kit, review SQL by hand, and apply locally
- [ ] Task: Update share query functions (`app/lib/db/queries/shares.ts`) and ensure `passwordHash` is never selected into public/UI return types
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 2: Pure Logic Foundation (`app/lib/share/`) & Unit Tests
- [ ] Task: Implement `app/lib/share/status.ts` (`getShareStatus(link, now)` with public `unavailable` mapping and expiry boundary)
- [ ] Task: Implement `app/lib/share/expiry.ts` (presets 7/30/90 days/custom/never, UTC end-of-day timestamp, past date rejection)
- [ ] Task: Implement `app/lib/share/redact.ts` (`redactContactDetails` removing email and phone when `hideContact` is true)
- [ ] Task: Implement `app/lib/share/password.ts` (constant-time compare, random salt, PBKDF2 WebCrypto, 6-128 chars)
- [ ] Task: Implement `app/lib/share/unlock-cookie.ts` (HMAC-SHA256 signed cookie `rs_<slug>`, 24h expiration, password fingerprint invalidation)
- [ ] Task: Implement `app/lib/share/bots.ts` (`isLikelyBot` detection table for crawlers, link previews, prefetch, non-HTML accept)
- [ ] Task: Implement `app/lib/share/meta.ts` (`buildShareMeta` with profile tags, truncated summary, robots tags, generic fallback)
- [ ] Task: Implement comprehensive unit tests in `tests/unit/share.test.ts`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 3: Owner Management Route (`/resumes/:id/share`)
- [ ] Task: Create `app/routes/resumes.$id.share.tsx` loader with `requireUser`, ownership 404, returning share configuration without `passwordHash`
- [ ] Task: Implement action intents (`enable`, `update`, `setPassword`, `removePassword`, `regenerate`, `disable`, `enableAgain`, `deleteLink`) with per-user active link limit (10 max)
- [ ] Task: Wire editor header "Share" button to navigate to `/resumes/:id/share`, or open `AuthDialog` for guest users
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 4: Public Route `/r/:slug` & Live Resume Viewer
- [ ] Task: Implement `app/routes/r.$slug.tsx` loader with slug lookup, status computation, and indistinguishable 404 for missing/expired/revoked
- [ ] Task: Implement locked state rendering (password form with rate-limiting, generic error timing path, signed unlock cookie issuance)
- [ ] Task: Implement unlocked state rendering with server-side contact redaction, `ResumePreview` template rendering, and mobile responsive layout (390px)
- [ ] Task: Implement slim top bar ("Download PDF" hook when `allowDownload` is true) and footer ("Made with Resumint")
- [ ] Task: Implement `@media print` suppression when `allowDownload` is false
- [ ] Task: Implement route `headers` export (`no-store`, `noindex` headers, CSP frame-ancestors / X-Frame-Options DENY)
- [ ] Task: Implement view count increment via `ctx.waitUntil` (filtering bots, owner, and 30-min dedupe cookie `rv_<slug>`)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 5: Share Settings UI & Client-Side QR Code Dialog
- [ ] Task: Build Share Settings interface in `app/routes/resumes.$id.share.tsx` (on/off switch, link copy button, expiry presets, password modal, danger zone)
- [ ] Task: Implement lightweight client-side QR code generator dialog with "Download PNG" action
- [ ] Task: Add accessible status indicators, live regions, and optimistic fetcher updates
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 6: Dashboard Integration & Optimized List Query
- [ ] Task: Update dashboard resume list query to include lightweight share link status join (`isActive`, `expiresAt`, `hasPassword`) without content blobs or `passwordHash`
- [ ] Task: Add real-time share status badges on `ResumeCard.tsx` (`Not shared`, `Shared`, `Protected`, `Expired`, `Disabled`)
- [ ] Task: Add "Share settings" and "Copy link" options to `ResumeCard.tsx` action menu
- [ ] Task: Verify resume deletion cascades to delete associated share link
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 7: Component, Worker Integration & Playwright E2E Tests
- [ ] Task: Component tests for Share settings UI, locked page, and QR modal in `tests/components/Share.test.tsx`
- [ ] Task: Worker integration tests for owner endpoints, public loader isolation, password flows, headers, and view counting in `tests/worker/share.test.ts`
- [ ] Task: Playwright E2E tests (`tests/e2e/share.spec.ts`) using dual browser contexts (owner + visitor), password unlock, expiry, PDF download, and Axe scans
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 8: Documentation & Verification
- [ ] Task: Update `docs/PLAN.md` with share lifecycle ASCII diagrams and route definitions
- [ ] Task: Update `docs/DECISIONS.md` with ADRs (uniform 404s, live content vs snapshot, unlock cookie HMAC, dedupe view counter)
- [ ] Task: Update `docs/TASKS.md` and `README.md`
- [ ] Task: Run full verification suite (`npm run lint`, `npm run typecheck`, `npm test`, `npm run test:worker`, `npm run build`, `npm run test:e2e`)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
