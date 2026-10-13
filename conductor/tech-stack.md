# Resumint - Tech Stack Specification

## Core Technologies
- **Framework**: React Router v7 (Framework Mode) on Cloudflare Workers.
- **Language**: TypeScript (Strict Mode, `noUncheckedIndexedAccess`).
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM and `drizzle-kit` migrations.
- **Styling**: Tailwind CSS v4, Lucide React icons, shadcn/ui components.
- **Form Management & Validation**: React Hook Form + Zod (shared client/server validation).
- **Authentication (Phase 3)**: Better Auth (Drizzle adapter on Cloudflare D1) with secure hashed session storage and HTTP-only cookies.
- **Testing**:
  - Vitest (Unit tests)
  - React Testing Library (Component tests)
  - `@cloudflare/vitest-pool-workers` (Worker actions/loaders + D1 integration tests)
  - Playwright (End-to-End browser tests and axe accessibility)
- **CI / CD**: GitHub Actions (`.github/workflows/ci.yml`)
- **Hosting / Edge**: Cloudflare Workers (Free Plan, 10ms CPU limit per request).
