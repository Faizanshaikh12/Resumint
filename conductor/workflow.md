# Resumint - Engineering Workflow & Quality Standards

## Guiding Principles
1. **Spec-Driven Development**: Every track has a confirmed `spec.md` and `plan.md` before code changes occur.
2. **Phase Isolation**: Implement phase by phase. Never skip ahead.
3. **Automated Verification**: Run lint, typecheck, unit, and integration tests before finishing any phase or task.
4. **Edge Budget Discipline**:
   - Zero Node-only APIs (`fs`, `child_process`, native bindings).
   - Lightweight SSR payloads to respect Cloudflare Workers free plan CPU limit (~10ms per request).
   - Client-side `@page` print export for PDFs.
5. **Atomic Conventional Commits**: Commit each logical step (e.g. `feat: ...`, `test: ...`, `chore: ...`).
