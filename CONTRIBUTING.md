# Contributing to Resumint

Thank you for your interest in contributing to Resumint! We welcome pull requests for bug fixes, performance improvements, and documentation enhancements.

## Development Standards

1. **Edge Compliance**: Cloudflare Workers free-tier environment. Never import Node.js built-ins (`node:fs`, `node:child_process`, `node:crypto` native wrappers). Use Web Standard APIs (`fetch`, `crypto.subtle`, `Headers`, `Request`, `Response`).
2. **TypeScript Strictness**:
   - `strict: true`
   - `noUncheckedIndexedAccess: true`
   - Never use `any` without an explicit explanatory comment.
3. **No External Trackers / No Invasive AI**:
   - Zero telemetry, tracking scripts, or external font/analytics CDNs.
   - All resume checks and job description comparisons must execute 100% locally in the browser or within deterministic Workers boundaries.
4. **Conventional Commits**:
   - `feat: ...` for features
   - `fix: ...` for bug fixes
   - `chore: ...` for maintenance and tooling
   - `test: ...` for test additions/updates
   - `docs: ...` for documentation changes

## Local Development Setup

```bash
# 1. Install dependencies
npm ci

# 2. Setup local development variables
cp .dev.vars.example .dev.vars

# 3. Apply local D1 migrations and seed database
npm run db:migrate:local
npm run db:seed

# 4. Start local development server
npm run dev
```

## Quality & Testing Commands

Before opening a pull request, ensure all validation gates pass:

```bash
# Typecheck
npm run typecheck

# Code quality
npm run lint

# Unit & component tests
npm run test:unit

# Cloudflare worker & D1 tests
npm run test:worker

# Playwright E2E and Axe accessibility audits
npm run test:e2e

# Production build validation
npm run build
```

## Accessibility (WCAG 2.2 AA)
All new components and user states must meet WCAG 2.2 AA criteria:
- Zero serious or critical Axe violations.
- Contrast ratio $\ge 4.5:1$ for normal text against its rendered background in both light and dark modes.
- Full keyboard operability and visible focus rings.
