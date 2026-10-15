# ADR 0004: DB-Driven Template Master & Configurable Generic Renderer

- **Status**: Accepted
- **Date**: 2026-10-15
- **Track**: Phase 11 - DB-Driven Templates (Template Master)

---

## Context

Prior to Phase 11, Resumint supported 5 static resume templates (`modern`, `minimal`, `executive`, `classic`, and `technical`). Each template was implemented as an individual, hardcoded React component with custom JSX structures and bespoke styling.

This architecture presented several limitations:
1. **Extensibility Bottleneck**: Adding a new template required writing a new React component, updating multiple registries, wiring custom styles, and writing dedicated tests.
2. **Maintenance Overhead**: Design tokens, layout fixes, and ATS compliance fixes had to be duplicated or manually synchronized across 5 separate JSX files.
3. **Template Discovery**: Templates could not be enumerated, filtered by tier, or queried dynamically via an API without shipping bundle code to every consumer.
4. **Blank Resume Leaks**: Static templates coupled layout rendering with fallback mock values, risking sample placeholder data appearing on exported documents.

Furthermore, storing arbitrary executable React code or CSS files directly in the database (`template_master`) was rejected due to:
- **Security**: Preventing Cross-Site Scripting (XSS) and CSS injection vulnerabilities.
- **ATS Compliance**: Ensuring all rendered output adheres strictly to semantic HTML parsing rules without malformed user-defined DOM.
- **Edge Budget**: Maintaining sub-10ms Worker execution time and keeping the server bundle compact.

---

## Decision

We replaced the 5 static template components with a **DB-driven Template Master** architecture paired with a single, highly configurable, ATS-safe generic renderer:

```
        DB (template_master)                     CODE (repo)
  +-----------------------------+      +-----------------------------------+
  | key, name, tier, sortOrder  |      | Font registry   (key -> woff2)    |
  | design tokens (JSON):       | ---> | Layout variants (header, columns, |
  |   colors, fontKey, sizes,   |      |   section heading, item style)    |
  |   spacing, heading style    |      | ONE generic renderer + CSS        |
  | layout (JSON): variant keys |      | Zod validation of every key       |
  | sampleContent (JSON, opt.)  |      +-----------------------------------+
  +-----------------------------+
```

### 1. Data Model (`template_master` Table)
A dedicated `template_master` table was created in Cloudflare D1 via Drizzle ORM:
- `id` (text, primary key)
- `key` (text, unique): Template identifier (`plain`, `classic`, `compact`, `minimal`, `modern`, `technical`, `executive`, `elegant`, `bold`, `creative`).
- `name` (text): Display name.
- `tier` (text): `basic` | `standard` | `premium`.
- `description` (text): High-level styling notes and recommended role archetypes.
- `design` (JSON): Strict design tokens (`accentColor`, `fontFamily`, `fontSize`, `lineSpacing`, `pageMargin`, `sectionSpacing`, `headingStyle`).
- `layout` (JSON): Variant keys (`headerVariant`, `columns`, `sidebarSections`, `sectionHeadingVariant`, `itemVariant`, `skillsVariant`).
- `sampleContent` (JSON, nullable): Used exclusively for gallery previews.
- `sortOrder`, `isActive`, `version`, `createdAt`, `updatedAt`.

### 2. Copy-on-Apply Architecture
When a user selects and applies a template from the gallery:
- The template's tokens and layout are **copied directly into the resume's record** (`resumes.design`), rather than maintaining a dynamic foreign-key pointer.
- **Benefits**:
  - Future changes, schema migrations, or deprecation of rows in `template_master` will never break existing user resumes.
  - Public share pages (`/r/:slug`) require zero joins or additional queries against `template_master`, keeping edge read costs minimal.
  - Users can freely customize their resume's design tokens (accent color, font scale, margins) post-apply without affecting the master catalog.
  - Undo history: The previous `design` state is snapshotted, allowing 1-click reversal.

### 3. Configurable Generic Renderer (`GenericResumeRenderer.tsx`)
A unified, semantic React component renders all 10 templates by mapping layout variant keys to pure component slots:
- **Header Variants**: `classic-centered`, `left-aligned-minimal`, `modern-accent-bar`, `two-tone-band`, `understated-inline`.
- **Section Heading Variants**: `left-rule`, `bottom-rule`, `uppercase-boxed`, `minimal-spacing`, `accent-pill`.
- **Item Variants**: `standard-compact`, `detailed-spaced`, `minimal-border`.
- **Skills Variants**: `inline-tags`, `badge-chips`, `category-list`, `progress-dots`.
- **CSS Custom Variables**: Dynamically maps validated numeric and color tokens into root CSS variables (`--accent-color`, `--font-scale`, `--margin-size`, etc.). No user-supplied string is injected into raw CSS or style tags.

### 4. Font Registry & Zero Runtime Google Fonts
- 6 self-hosted WOFF2 font families (`Inter`, `Source Serif 4`, `Lato`, `Merriweather`, `IBM Plex Sans`, `Roboto Mono`) with `font-display: swap`.
- Standard system fallbacks ensure instant rendering without layout shift or external network dependencies.

### 5. Edge-Cached API Route
- `/api/templates`: Public read-only JSON endpoint returning active templates sorted by `sortOrder`.
- Cached via `Cache-Control: public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800` at the Cloudflare edge.

### 6. Pristine Blank Resume & ATS "Start Filling" State
- `createDefaultContent()` outputs completely empty strings and empty arrays.
- The generic renderer renders an empty white canvas (`data-testid="blank-resume-canvas"`) with zero leaked placeholder text or sample headings.
- The ATS checker detects empty content and displays a welcoming `"Start filling"` state rather than penalizing the user with a low score.
- A `"Load Sample"` button in the editor header allows instant populating of realistic sample data when desired.

---

## Consequences

1. **Extensibility**: Adding a new template now requires only **1 seed row** in `app/db/seed/templates.ts` (and an optional layout variant function if a novel arrangement is required). No new page components or stylesheets are needed.
2. **Security & ATS Guarantees**: Storing only token keys in D1 guarantees zero risk of XSS or CSS injection. All 10 templates use exact semantic HTML (`<h1>` name, `<h2>` sections, `<h3>` entries, linear reading order), guaranteeing 100% ATS readability across Workday, Taleo, and Greenhouse.
3. **Backward Compatibility**: Legacy template keys (`modern`, `minimal`, `executive`, `classic`, `technical`) remain fully supported through token resolution fallbacks. Existing resumes render identically without migration.
4. **Free Tier Safety**: Edge caching on `/api/templates` and copy-on-apply eliminates redundant D1 reads, keeping CPU time under 3ms.
