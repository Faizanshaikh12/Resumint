# Track Implementation Plan: Phase 6 - Templates and Design Customization

### Phase 1: Design Contract & Pure Logic Foundation
- [ ] Task: Extend `resumeDesignSchema` in `app/lib/schemas/resume.ts` with backward compatibility and defaults
- [ ] Task: Implement `app/lib/resume/design-tokens.ts` mapping design JSON to CSS custom variables
- [ ] Task: Implement `app/lib/resume/contrast.ts` for WCAG 2.1 AA luminance & contrast checking
- [ ] Task: Implement `app/lib/resume/sanitize-link.ts` strictly allowing only `http:`, `https:`, `mailto:`, `tel:`
- [ ] Task: Implement `app/lib/resume/normalize-design.ts` for clamping and template compatibility
- [ ] Task: Implement `app/lib/resume/touched-merge.ts` for preserving customized user fields on template switch
- [ ] Task: Write comprehensive unit tests for schema, tokens, contrast, sanitization, and normalization in `tests/unit/design-contract.test.ts`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 2: Template System & Shared Parts
- [ ] Task: Implement shared template parts in `app/components/templates/parts/` (`SectionRenderer`, `ItemDate`, `BulletList`, `LinkList`, `SkillList`)
- [ ] Task: Implement 5 semantic ATS-friendly templates (`modern`, `minimal`, `executive`, `classic`, `technical`)
- [ ] Task: Implement `app/components/templates/registry.ts` with metadata and fallback resolver
- [ ] Task: Implement `ResumeErrorBoundary` and replace `BasicPreview` with `ResumePreview`
- [ ] Task: Component tests for all 5 templates (full and empty fixtures, semantic HTML, ATS rules) in `tests/components/Templates.test.tsx`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 3: Page Model, CSS & Font Assets
- [ ] Task: Create `app/styles/resume-page.css` with `@page`, page sizing, break rules, print styles
- [ ] Task: Set up self-hosted font loading for 6 bundled families (Inter, Source Serif 4, Lato, Merriweather, IBM Plex Sans, Roboto Mono)
- [ ] Task: Implement dynamic scaled preview container with `ResizeObserver` and page-break guides
- [ ] Task: Document ADR on continuous preview vs true pagination in `docs/DECISIONS.md`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 4: Design Panel UI & Editor Integration
- [ ] Task: Implement `DesignPanel` with template gallery cards, color picker, sliders, and toggles
- [ ] Task: Integrate "Content | Design" tabs in `ResumeEditor` desktop and mobile
- [ ] Task: Wire `setTemplate`, `updateDesign`, `resetDesign` into editor state reducer with undo/redo support
- [ ] Task: Update autosave and server `save` action in `/resumes/:id/edit` with server-side normalization
- [ ] Task: Verify guest claim and version snapshots preserve `design` and `templateId`
- [ ] Task: Component tests for `DesignPanel` in `tests/components/DesignPanel.test.tsx`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 5: Dashboard Thumbnails & Preview Route
- [ ] Task: Implement resource route `/resumes/:id/preview-data` with ownership check and caching headers
- [ ] Task: Implement `ResumeThumbnail` with `IntersectionObserver`, concurrency throttling, and memory cache
- [ ] Task: Integration tests for `preview-data` route in `tests/worker/preview-data.test.ts`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 6: E2E Tests, Documentation & Verification
- [ ] Task: Playwright E2E tests for template switching, customization, persistence, guest claim, and Chromium `page.pdf()` print fidelity
- [ ] Task: Update documentation (`docs/PLAN.md`, `docs/DECISIONS.md`, `docs/TASKS.md`, `docs/TEMPLATES.md`, `README.md`)
- [ ] Task: Run full verification suite (`npm run lint`, `npm run typecheck`, `npm test`, `npm run test:worker`, `npm run build`, `npm run test:e2e`)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
