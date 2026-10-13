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

Create a `.env` or `.dev.vars` file with your Cloudflare D1 credentials (required for remote migration generation and Drizzle Studio):

```ini
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_DATABASE_ID=2be466e3-a248-49a9-8e46-57c6ad2ad5be
CLOUDFLARE_D1_TOKEN=your_cloudflare_api_token
```

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
