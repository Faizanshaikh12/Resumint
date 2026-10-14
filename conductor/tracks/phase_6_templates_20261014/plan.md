# Track Implementation Plan: Phase 6 - Templates and Design Customization

### Phase 1: Design Contract & Pure Logic Foundation
- [x] Task: Extend `resumeDesignSchema` in `app/lib/schemas/resume.ts` with backward compatibility and defaults
- [x] Task: Implement `app/lib/resume/design-tokens.ts` mapping design JSON to CSS custom variables
- [x] Task: Implement `app/lib/resume/contrast.ts` for WCAG 2.1 AA luminance & contrast checking
- [x] Task: Implement `app/lib/resume/sanitize-link.ts` strictly allowing only `http:`, `https:`, `mailto:`, `tel:`
- [x] Task: Implement `app/lib/resume/normalize-design.ts` for clamping and template compatibility
- [x] Task: Implement `app/lib/resume/touched-merge.ts` for preserving customized user fields on template switch
- [x] Task: Write comprehensive unit tests for schema, tokens, contrast, sanitization, and normalization in `tests/unit/design-contract.test.ts`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 2: Template System & Shared Parts
- [x] Task: Implement shared template parts in `app/components/templates/parts/` (`SectionRenderer`, `ItemDate`, `BulletList`, `LinkList`, `SkillList`)
- [x] Task: Implement 5 semantic ATS-friendly templates (`modern`, `minimal`, `executive`, `classic`, `technical`)
- [x] Task: Implement `app/components/templates/registry.ts` with metadata and fallback resolver
- [x] Task: Implement `ResumeErrorBoundary` and replace `BasicPreview` with `ResumePreview`
- [x] Task: Component tests for all 5 templates (full and empty fixtures, semantic HTML, ATS rules) in `tests/components/Templates.test.tsx`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 3: Page Model, CSS & Font Assets
- [x] Task: Create `app/styles/resume-page.css` with `@page`, page sizing, break rules, print styles
- [x] Task: Set up self-hosted font loading for 6 bundled families (Inter, Source Serif 4, Lato, Merriweather, IBM Plex Sans, Roboto Mono)
- [x] Task: Implement dynamic scaled preview container with `ResizeObserver` and page-break guides
- [x] Task: Document ADR on continuous preview vs true pagination in `docs/DECISIONS.md`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 4: Design Panel UI & Editor Integration
- [x] Task: Implement `DesignPanel` with template gallery cards, color picker, sliders, and toggles
- [x] Task: Integrate "Content | Design" tabs in `ResumeEditor` desktop and mobile
- [x] Task: Wire `setTemplate`, `updateDesign`, `resetDesign` into editor state reducer with undo/redo support
- [x] Task: Update autosave and server `save` action in `/resumes/:id/edit` with server-side normalization
- [x] Task: Verify guest claim and version snapshots preserve `design` and `templateId`
- [x] Task: Component tests for `DesignPanel` in `tests/components/DesignPanel.test.tsx`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 5: Dashboard Thumbnails & Preview Route
- [x] Task: Implement resource route `/resumes/:id/preview-data` with ownership check and caching headers
- [x] Task: Implement `ResumeThumbnail` with `IntersectionObserver`, concurrency throttling, and memory cache
- [x] Task: Integration tests for `preview-data` route in `tests/worker/preview-data.test.ts`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 6: E2E Tests, Documentation & Verification
- [x] Task: Playwright E2E tests for template switching, customization, persistence, guest claim, and Chromium `page.pdf()` print fidelity
- [x] Task: Update documentation (`docs/PLAN.md`, `docs/DECISIONS.md`, `docs/TASKS.md`, `docs/TEMPLATES.md`, `README.md`)
- [x] Task: Run full verification suite (`npm run lint`, `npm run typecheck`, `npm test`, `npm run test:worker`, `npm run build`, `npm run test:e2e`)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)
