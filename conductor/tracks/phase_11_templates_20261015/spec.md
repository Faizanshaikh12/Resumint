# Track Specification: Phase 11 - DB-Driven Templates (Template Master)

## 1. Overview
Transform Resumint's template architecture from rigid, hardcoded static React components into a dynamic, DB-driven template engine. A central `template_master` table in Cloudflare D1 will store design tokens (colors, font keys, spacing, typography scales) and layout variant configurations. A single, high-performance, ATS-compliant Generic Renderer in React consumes these tokens and variants to render resumes seamlessly.

This track introduces 10 distinct templates across 3 tiers (Basic, Standard, Premium), a Copy-on-Apply architecture, a true Blank Resume experience, and unified Duplication workflows.

## 2. Functional Requirements

### 2.1 Database & Seed (`template_master`)
- **Table Definition**:
  - `id`: Text (primary key, e.g. `tmpl_plain`)
  - `key`: Text (unique slug, e.g. `plain`, `modern`, `creative`)
  - `name`: Text (display name)
  - `description`: Text (short summary)
  - `tier`: Text enum (`basic` | `standard` | `premium`)
  - `design`: JSON column validating to `TemplateDesignTokensSchema`
  - `layout`: JSON column validating to `TemplateLayoutConfigSchema`
  - `sampleContent`: JSON column (nullable, optional preview overrides)
  - `sortOrder`: Integer
  - `isActive`: Boolean/Integer (default 1)
  - `version`: Integer (default 1)
  - `createdAt`, `updatedAt`: Timestamps
- **Seed Data (10 Rows)**:
  1. `plain` (Basic): Sans (Inter), monochrome / black & white, 1 column, ultra-clean.
  2. `classic` (Basic): Serif (Merriweather / Source Serif), centered header, traditional thin rules.
  3. `compact` (Basic): Compact sans, tight spacing, single column, optimized for 1-page density.
  4. `minimal` (Standard): Light sans, generous whitespace, understated divider lines.
  5. `modern` (Standard): Geometric sans, primary accent headings, subtle section borders.
  6. `technical` (Standard): Sans + Mono accents, 2-column layout with skills/tools sidebar.
  7. `executive` (Standard): Serif headings with sans body, summary-first emphasis, two-tone structure.
  8. `elegant` (Premium): Display serif, small-caps section titles, subtle warm gold/champagne accents.
  9. `bold` (Premium): High-contrast geometric typography, colored header band, prominent accents.
  10. `creative` (Premium): 2-column with tinted sidebar, modern skill pills/chips, dynamic headers.
- **Backward Compatibility**: Preserves all 5 existing template keys (`modern`, `minimal`, `executive`, `classic`, `technical`).
- **Idempotent Seed Runner**: Executable seed script (`app/db/seed/templates.ts`) that upserts rows safely during migration and CI.

### 2.2 Generic Configurable Renderer (`GenericResumeRenderer`)
- Replace the 5 isolated template directories with a modular, composable generic renderer:
  - Header variants (`standard`, `centered`, `banner`, `compact`)
  - Column layouts (`single`, `two-column-sidebar` with configurable `sidebarSections`)
  - Section heading variants (`underlined`, `accent-pill`, `small-caps`, `left-rule`, `minimal`)
  - Item variants (`compact-row`, `stacked`, `bulleted`)
  - Skills variants (`tags`, `pills`, `categorical-list`, `inline-comma`)
- CSS custom property binding: Dynamic CSS variables (`--resume-accent`, `--resume-font`, `--resume-margin`, `--resume-line-spacing`) calculated safely without inline style vulnerabilities.
- Fallback protection: If an unknown or inactive template key is encountered, safely fall back to `modern` defaults without breaking or crashing.

### 2.3 Font Registry & Assets
- Self-host 5-6 latin-subset fonts in `public/fonts/` (Inter, Source Serif 4, IBM Plex Sans, Merriweather, Roboto Mono, Plus Jakarta Sans).
- Defined via `@font-face` in `app/styles/fonts.css` with `font-display: swap`.
- Strict CSP compliance: Zero external Google Fonts CDN network calls.

### 2.4 Copy-on-Apply Rule & Apply Flow
- When a user applies a template in the Editor:
  - The template's design tokens and layout configs are resolved and copied into `resumes.design` and `resumes.templateId`.
  - Content (`resumes.content`) remains 100% untouched.
  - Option to "Keep my color and page size" in the gallery modal.
  - Generates a 1-step undo snapshot so users can instantly revert with Ctrl+Z / Undo button.
  - `resumes` table remains completely standalone: Share view (`/share/:slug`) and PDF export require 0 joins to `template_master`.

### 2.5 Public Templates API (`/api/templates`)
- Cached GET endpoint returning active templates sorted by `sortOrder`.
- HTTP caching headers (`Cache-Control: public, max-age=3600, s-maxage=86400`).
- Consumed by both authenticated editor and guest `/build` flow.

### 2.6 Blank Resume Experience
- `createDefaultContent()` in `app/lib/schemas/resume.ts` initializes with truly empty strings and empty arrays.
- Clean white page preview (zero dummy strings or placeholder leaks).
- Editor form inputs show helpful placeholder hints (`placeholder="e.g. Acme Corp"`).
- ATS score widget displays a welcoming "Start filling your resume" empty state instead of 0% failure alerts.
- Optional "Load sample data" button available in editor toolbar.

### 2.7 Duplication Workflows
- Dashboard card menu: "Duplicate" action creates an identical copy with fresh ID, cleared `shareSlug`, and checks the resume limit cap.
- Editor header menu:
  - "Duplicate Resume": creates a copy and navigates to the duplicate.
  - "Duplicate and try another template": duplicates resume and automatically opens the Template Gallery.

## 3. Non-Functional Requirements
- **Edge Compliance**: Cloudflare Workers free plan CPU limit (<10ms). No Node built-ins.
- **ATS Compliance**: Semantic HTML (`<h1>`, `<h2>`, `<section>`, `<ul>`, `<li>`), linear screen-reader DOM order even in 2-column sidebar layouts, real text selectable by parsers.
- **Security**: No raw CSS or HTML injection from DB rows. All values validated via Zod schemas.
- **Payload Safety**: D1 SQLite rows capped well within limits. Edge-cached template list (~3KB).

## 4. Acceptance Criteria
- [ ] D1 migration creates `template_master` table, and seed script populates 10 templates idempotently.
- [ ] Generic renderer successfully renders all 10 templates using design tokens and layout variants.
- [ ] Old templates directories removed; all legacy resumes render seamlessly via fallback/normalization.
- [ ] `/api/templates` serves cached JSON with accurate headers.
- [ ] Applying a template copies style to resume, preserves content, supports "keep color", and enables undo.
- [ ] Creating a blank resume produces an empty white preview and non-punitive ATS empty state.
- [ ] Duplication works from Dashboard and Editor menu, including "Duplicate & try another template".
- [ ] 100% passing tests for schema, seed, ATS contract, fallback, blank resume, and duplication.

## 5. Out of Scope
- Free-form raw CSS editing by end users.
- Dynamic user-uploaded custom web fonts (.ttf/.otf upload).
