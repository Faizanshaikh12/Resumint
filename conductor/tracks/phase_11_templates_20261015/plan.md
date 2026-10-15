# Implementation Plan: Phase 11 - DB-Driven Templates (Template Master)

## Phase 1: Database Schema, Seed & Validation
- [x] Task: Define Zod Schemas for Design Tokens & Layout Config
  - [x] Write schema tests in `tests/unit/template-schema.test.ts` for `TemplateDesignTokensSchema` and `TemplateLayoutConfigSchema`
  - [x] Implement schemas and type definitions in `app/lib/schemas/template.ts`
  - [x] Update `app/lib/schemas/resume.ts` to support resolved template tokens and layout variants
- [x] Task: Create `template_master` Table & Drizzle Migration
  - [x] Add `templateMaster` table in `app/db/schema.ts` with columns: `id`, `key`, `name`, `description`, `tier`, `design`, `layout`, `sampleContent`, `sortOrder`, `isActive`, `version`, timestamps
  - [x] Generate Drizzle migration in `drizzle/`
  - [x] Write worker database integration tests in `tests/worker/template-db.test.ts`
- [x] Task: Implement Idempotent Seed Runner (10 Templates)
  - [x] Create seed definitions for all 10 templates (plain, classic, compact, minimal, modern, technical, executive, elegant, bold, creative) in `app/db/seed/templates.ts`
  - [x] Implement upsert logic (`ON CONFLICT (key) DO UPDATE`)
  - [x] Add npm script or hook for running seed on local D1 and CI
  - [x] Write seed validation tests verifying all 10 rows conform to Zod schemas
- [x] Task: Phase 1 Verification & Checkpoint (Refer to workflow.md)

## Phase 2: Fonts & Generic Configurable Resume Renderer
- [ ] Task: Setup Local Font Assets & Typography Registry
  - [ ] Place self-hosted latin-subset WOFF2 fonts in `public/fonts/` (Inter, Source Serif 4, IBM Plex Sans, Merriweather, Roboto Mono, Plus Jakarta Sans)
  - [ ] Register `@font-face` rules in `app/styles/fonts.css` with `font-display: swap`
  - [ ] Create font registry helper mapping font keys to CSS family stacks
- [ ] Task: Implement Layout Variant Components
  - [ ] Create Header variants (`standard`, `centered`, `banner`, `compact`) in `app/components/templates/generic/headers/`
  - [ ] Create Section Heading variants (`underlined`, `accent-pill`, `small-caps`, `left-rule`, `minimal`) in `app/components/templates/generic/headings/`
  - [ ] Create Item variants (`compact-row`, `stacked`, `bulleted`) in `app/components/templates/generic/items/`
  - [ ] Create Skills variants (`tags`, `pills`, `categorical-list`, `inline-comma`) in `app/components/templates/generic/skills/`
- [ ] Task: Build Unified `GenericResumeRenderer`
  - [ ] Implement `GenericResumeRenderer.tsx` mapping design tokens to CSS custom variables (`--resume-accent`, `--resume-font`, `--resume-line-spacing`, `--resume-margin`, `--resume-section-spacing`)
  - [ ] Support 1-column and 2-column sidebar layouts (`sidebarSections` routing with fallback for unknown sections)
  - [ ] Ensure strict semantic ATS DOM ordering (h1, h2, section, article, ul, li)
  - [ ] Add comprehensive ATS contract tests across all 10 templates in `tests/component/template-ats-contract.test.ts`
- [ ] Task: Phase 2 Verification & Checkpoint (Refer to workflow.md)

## Phase 3: Deprecate Static Components & Legacy Fallback
- [ ] Task: Implement Backward-Compatible Adapter & Fallback Handler
  - [ ] Write unit tests for legacy template resolution in `tests/unit/template-adapter.test.ts`
  - [ ] Implement resolver that maps existing legacy resumes (`modern`, `minimal`, `executive`, `classic`, `technical`) to new layout variants and design tokens
  - [ ] Ensure unknown or disabled template keys gracefully fall back to `modern` without crashes
- [ ] Task: Replace Static Template Files
  - [ ] Route `TEMPLATES` in `app/components/templates/registry.ts` to use `GenericResumeRenderer`
  - [ ] Remove deprecated isolated template components (`app/components/templates/modern`, `minimal`, etc.)
  - [ ] Run full test suite to guarantee zero regressions on existing resume preview and export
- [ ] Task: Phase 3 Verification & Checkpoint (Refer to workflow.md)

## Phase 4: Public Templates API (`/api/templates`)
- [ ] Task: Create Public Templates Resource Route
  - [ ] Write endpoint worker tests in `tests/worker/api-templates.test.ts`
  - [ ] Implement `app/routes/api.templates.ts` querying active templates from D1 with fast sorting
  - [ ] Configure edge caching headers (`Cache-Control: public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800`)
- [ ] Task: Integrate API Loader with Guest `/build` Flow
  - [ ] Update guest builder loader to fetch available templates from `/api/templates` or cached helper
- [ ] Task: Phase 4 Verification & Checkpoint (Refer to workflow.md)

## Phase 5: Template Gallery & Copy-on-Apply Flow in Editor
- [ ] Task: Build Live Template Gallery Modal
  - [ ] Create `TemplateGalleryModal.tsx` in `app/components/editor/` showing all 10 templates grouped by tier (Basic, Standard, Premium)
  - [ ] Render live miniature previews using standard sample content
  - [ ] Add "Keep my accent color and page size" toggle checkbox
- [ ] Task: Implement Copy-on-Apply & 1-Step Undo
  - [ ] Write tests for apply logic in `tests/unit/template-apply.test.ts` (content deep equality, design copy, undo snapshot)
  - [ ] Implement style resolution and copy into `resumes.design` and `resumes.templateId` upon selection
  - [ ] Add 1-step undo state in Editor to allow reverting applied template with one click
- [ ] Task: Phase 5 Verification & Checkpoint (Refer to workflow.md)

## Phase 6: Blank Resume & Empty State UX
- [ ] Task: Implement Empty Default Content Initializer
  - [ ] Update `createDefaultContent()` in `app/lib/schemas/resume.ts` to return completely empty fields
  - [ ] Write unit tests verifying empty content output
- [ ] Task: Clean Preview & Helpful Editor Hints
  - [ ] Ensure `GenericResumeRenderer` renders a pristine white page when content is empty (zero placeholder text leaks)
  - [ ] Ensure input fields display guidance placeholders (`placeholder="e.g. Software Engineer"`)
  - [ ] Update ATS score widget to display a welcoming "Start filling your resume" empty state when no content is entered
  - [ ] Add "Load sample content" button in Editor toolbar for users who want prefilled data
- [ ] Task: Phase 6 Verification & Checkpoint (Refer to workflow.md)

## Phase 7: Resume Duplication Workflows
- [ ] Task: Verify & Enhance Dashboard Duplicate Action
  - [ ] Verify Dashboard duplicate functionality: copies content and design, generates new nanoid, strips `shareSlug`, verifies resume count cap
  - [ ] Add worker tests in `tests/worker/resume-duplicate.test.ts`
- [ ] Task: Implement Editor Header Menu Duplication
  - [ ] Add dropdown menu in Editor header with "Duplicate Resume" and "Duplicate and try another template"
  - [ ] "Duplicate Resume": creates copy and redirects to new resume editor
  - [ ] "Duplicate and try another template": creates copy, redirects, and automatically opens Template Gallery modal
- [ ] Task: Phase 7 Verification & Checkpoint (Refer to workflow.md)

## Phase 8: Comprehensive Verification, Testing & Documentation
- [ ] Task: End-to-End Playwright Tests
  - [ ] Write E2E test `tests/e2e/templates-flow.spec.ts` testing template switching, preview update, blank resume creation, and duplication
- [ ] Task: Architecture Decision Record (ADR) & Documentation
  - [ ] Add `docs/decisions/0004-db-driven-template-master.md` detailing the DB token architecture, copy-on-apply rule, and ATS guarantees
  - [ ] Update `README.md` with instructions on how to add a new template (1 seed row + optional variant)
- [ ] Task: Final Quality Sweep
  - [ ] Run `npm run typecheck`
  - [ ] Run `npm run lint`
  - [ ] Run `npm test` & `npm run test:worker` & `npm run test:e2e`
- [ ] Task: Phase 8 Verification & Checkpoint (Refer to workflow.md)
