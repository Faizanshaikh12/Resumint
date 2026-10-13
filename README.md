# Resumint 📄✨

> Modern, blazing fast, ATS-optimized online resume builder built with React Router v7 and Cloudflare D1.

[![CI](https://github.com/Faizanshaikh12/Resumint/actions/workflows/ci.yml/badge.svg)](https://github.com/Faizanshaikh12/Resumint/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Resumint provides a zero-friction experience: jump straight into creating your resume with live previews, customize typography and layouts, export high-fidelity PDFs client-side, and claim your draft securely when ready to save or share.

## Tech Stack

- **Framework**: React Router v7 (Framework Mode) on Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM
- **UI & Styling**: React 19, Tailwind CSS v4, Lucide React, shadcn/ui
- **Forms & Validation**: React Hook Form, Zod
- **Testing**: Vitest, React Testing Library, `@cloudflare/vitest-pool-workers`, Playwright

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

### Local Development

```bash
npm run dev
```

### Verification & Testing

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
```

## Documentation

- [Architecture & Plan](docs/PLAN.md)
- [Task Tracker](docs/TASKS.md)
- [Architecture Decision Records](docs/DECISIONS.md)
- [Agent & Contributor Guidelines](AGENTS.md)

## License

MIT © 2026 Faizan Shaikh
