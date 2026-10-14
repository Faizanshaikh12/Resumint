# Track Implementation Plan: Phase 10 - Polish, Hardening, and Final Deploy

### Stage 1: Landing Page, Public Pages & Visual Polish
- [ ] Task: Upgrade Landing `/` (`app/routes/home.tsx`):
  - Hero with clear headline, primary CTA "Build your resume" -> `/build`, secondary "Log in".
  - "How it works" in 3 clear steps (Build/Import -> Refine & Score -> Export & Share).
  - Feature highlights reflecting REAL features (5 templates, live preview, autosave, PDF export, share link, checklist score).
  - Live interactive template showcase (real templates preview with instant switcher).
  - Honest FAQ (free, no credit card, data stored on Cloudflare, ATS disclaimer).
  - Semantic HTML, single H1, heading hierarchy.
- [ ] Task: Create `/privacy` (`app/routes/privacy.tsx`) with accurate data handling and legal disclaimer.
- [ ] Task: Create `/terms` (`app/routes/terms.tsx`) with fair use, warranty disclaimer, and legal disclaimer.
- [ ] Task: Create `/about` (`app/routes/about.tsx`) with craft philosophy, GitHub repo and portfolio link.
- [ ] Task: Verify and polish Header & Footer links and ErrorBoundary presentation across all route groups.

### Stage 2: SEO, Discoverability & Meta Assets
- [ ] Task: Configure per-route `meta` (canonical, Open Graph, Twitter card, noindex on auth/app routes).
- [ ] Task: Create `robots.txt` resource route (`app/routes/robots[.]txt.ts`) allowing public marketing pages and disallowing `/dashboard`, `/resumes/`, `/api/`, `/login`, `/signup`.
- [ ] Task: Create `sitemap.xml` resource route (`app/routes/sitemap[.]xml.ts`) listing ONLY public marketing URLs.
- [ ] Task: Create web manifest (`manifest.webmanifest`), favicon assets, and theme color tags.

### Stage 3: Security Hardening & Account Lifecycle
- [ ] Task: Implement global security headers in `workers/app.ts` (strict CSP, HSTS, nosniff, Referrer-Policy, Permissions-Policy, X-Frame-Options, COOP).
- [ ] Task: Audit cookies (`httpOnly`, `secure`, `sameSite: lax`, `path: /`) and rate limits.
- [ ] Task: Implement `/settings` route (`app/routes/settings.tsx`) with account info, single-device logout, and typed account deletion (cascading all records).
- [ ] Task: Implement "Download all my data" resource route (`app/routes/api.export-data.ts`) with no-store owner-only JSON export of all resumes.
- [ ] Task: Replace any `dangerouslySetInnerHTML` in `PrintRoot.tsx` and `root.tsx` with standard JSX or safe external assets.
- [ ] Task: Add static security check (`tests/unit/security-static.test.ts`) asserting zero `eval`, `new Function`, or unapproved `dangerouslySetInnerHTML`.
- [ ] Task: Add CSRF and authorization sweep worker test (`tests/worker/security-audit.test.ts`).
- [ ] Task: Add `.github/dependabot.yml` and verify dependency health (`npm audit`).

### Stage 4: Accessibility Pass (WCAG 2.2 AA Target)
- [ ] Task: Run automated Axe scans across all pages and key states in light and dark modes.
- [ ] Task: Conduct and document keyboard navigation, focus indicators, skip link, and screen reader labels in `docs/A11Y.md`.
- [ ] Task: Integrate `@axe-core/playwright` assertions in E2E suites.

### Stage 5: Performance & Operations
- [ ] Task: Measure and record bundle sizes (client chunks and compressed worker bundle vs Cloudflare free limits).
- [ ] Task: Verify zero loader waterfalls and ensure optimal asset caching headers.
- [ ] Task: Implement lazy cleanup for expired sessions and rate limit rows in `app/db/queries/cleanup.ts`.
- [ ] Task: Document operations, backup/restore, rollback, and free-tier alert plan in `docs/OPERATIONS.md`.

### Stage 6: Comprehensive Testing, CI/CD & Deployment
- [ ] Task: Write end-to-end "golden path" Playwright suite (`tests/e2e/golden-path.spec.ts`) covering full user lifecycle.
- [ ] Task: Verify cross-browser and mobile viewport (390x844).
- [ ] Task: Update `.github/workflows/ci.yml` and `.github/workflows/deploy.yml` with remote migrations and smoke tests.
- [ ] Task: Update all documentation (`README.md`, `docs/PLAN.md`, `docs/TASKS.md`, `docs/DECISIONS.md`, `CHANGELOG.md`) and tag `v1.0.0`.
