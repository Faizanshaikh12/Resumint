# Resumint - Agent & Contributor Guidelines

## Development Standards

1. **Edge Compliance**: Cloudflare Workers free tier environment. Never import Node.js built-ins (`node:fs`, `node:child_process`, `node:crypto` native wrappers). Use Web Standard APIs (`fetch`, `crypto.subtle`, `Headers`, `Request`, `Response`).
2. **TypeScript Strictness**:
   - `strict: true`
   - `noUncheckedIndexedAccess: true`
   - Never use `any` without an explicit explanatory comment.
3. **Link Formatting**: Clickable markdown links must follow standard GitHub markdown format: `[Label](file:///path/to/file)`.
4. **Testing Discipline**:
   - Every bug fix and feature requires accompanying unit, component, or worker tests.
   - Do not use arbitrary timeout sleeps; rely on assertions with automatic retry/waiting.
5. **Conventional Commits**:
   - `feat: ...` for features
   - `fix: ...` for bug fixes
   - `chore: ...` for maintenance and tooling
   - `test: ...` for test additions/updates
   - `docs: ...` for documentation changes

## Key Commands

- `npm run dev`: Launch local development server with Cloudflare Miniflare/Wrangler bindings
- `npm run build`: Build production client and worker bundles
- `npm run typecheck`: Run React Router typegen and TypeScript compiler checks
- `npm run lint`: Execute ESLint checks
- `npm test`: Run unit and component test suites
- `npm run test:worker`: Run Vitest pool workers tests with local D1
- `npm run test:e2e`: Execute Playwright end-to-end tests
