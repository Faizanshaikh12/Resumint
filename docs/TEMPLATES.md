# Resumint - Templates & Design Catalog

Resumint provides 10 production-grade, ATS-compliant templates driven by a centralized database master (`template_master` table in Cloudflare D1) and rendered through a single configurable, secure, high-performance generic renderer.

---

## 1. Architecture Overview

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

### Key Principles

1. **DB Stores Data, Not Code**: Database rows store design tokens (`accentColor`, `fontFamily`, `fontSize`, `lineSpacing`, `pageMargin`, `sectionSpacing`, `headingStyle`) and layout variant identifiers (`headerVariant`, `columns`, `sidebarSections`, `sectionHeadingVariant`, `itemVariant`, `skillsVariant`). Code, CSS, and font files remain in the repository to guarantee security (no XSS or CSS injection), performance, and ATS compliance.
2. **Copy-on-Apply Architecture**: When a template is applied, its resolved design tokens and layout settings are copied directly into `resumes.design`. Modifying or deleting master templates never breaks existing user resumes, and public share pages (`/r/:slug`) require zero extra D1 reads.
3. **Generic Component Architecture**: A single `GenericResumeRenderer.tsx` component dynamically mounts layout variants and maps tokens to CSS custom variables (`--accent-color`, `--font-scale`, `--margin-size`, etc.).
4. **Pristine Blank Canvas**: A new resume starts completely blank without any placeholder or sample text leaks. The ATS checker renders a welcoming "Start filling" state rather than penalizing blank documents.

---

## 2. Template Catalog (10 Templates)

The 10 templates are categorized across three tiers: **Basic**, **Standard**, and **Premium**.

| Key | Tier | Name | Font Style | Layout & Arrangement | Accent Color | Best For |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `plain` | Basic | **Plain ATS** | Inter (Clean Sans) | 1 Column, minimal decoration, black/white | `#171717` | High-volume ATS portals, conservative corporate applications |
| `classic` | Basic | **Classic ATS** | Merriweather (Serif) | 1 Column, centered header, thin rules | `#0f172a` | Traditional enterprise, government, finance, and legal roles |
| `compact` | Basic | **Compact Grid** | Inter (Dense Sans) | 1 Column, tight spacing, maximum density | `#1e293b` | 1-page constraints, extensive experience summaries |
| `minimal` | Standard | **Ultra Minimal** | Lato (Clean Sans) | 1 Column, airy whitespace, bottom divider lines | `#334155` | Designers, product managers, and copywriters |
| `modern` | Standard | **Modern Clean** | Inter (Sans) | 1 or 2 Columns, accent bar header, colored rules | `#2563eb` | Versatile tech and general professional roles |
| `technical` | Standard | **Technical Grid** | IBM Plex Sans + Mono | 2 Columns, monospace dates, skills sidebar tags | `#059669` | Software engineers, DevOps, and cloud architects |
| `executive` | Standard | **Executive Serif** | Source Serif 4 | 1 Column, two-tone header band, summary-first | `#1e3a8a` | Senior leadership, VPs, and management consultants |
| `elegant` | Premium | **Elegant Serif** | Source Serif 4 | 1 Column, understated inline header, warm gold tone | `#b45309` | Luxury, academia, legal, and executive advisory |
| `bold` | Premium | **Bold Impact** | Inter (Geometric Sans) | 1 Column, bold header band, pill badges | `#0284c7` | Marketing, creative directors, and startups |
| `creative` | Premium | **Creative Studio** | Lato (Warm Sans) | 2 Columns, colored sidebar, rounded skill chips | `#7c3aed` | Design, UI/UX, agency, and creative leadership roles |

---

## 3. Layout Variants System

The generic renderer composes templates using modular, swappable variant slots:

### Header Variants
- `classic-centered`: Centered candidate name, centered title, and centered contact links row.
- `left-aligned-minimal`: Clean left-aligned name and title with inline bullet-separated contact info.
- `modern-accent-bar`: Thick vertical accent bar flanking candidate name with structured contact badges.
- `two-tone-band`: Prominent colored background band framing name and contact metadata.
- `understated-inline`: Minimalist editorial layout with name and title on a single optical baseline.

### Section Heading Variants
- `left-rule`: Solid vertical colored bar to the left of the uppercase section heading.
- `bottom-rule`: Horizontal colored divider line spanning below the section title.
- `uppercase-boxed`: Compact uppercase title with light background pill/box framing.
- `minimal-spacing`: Generous typographical whitespace without decorative borders.
- `accent-pill`: Filled badge-style heading tag.

### Item Variants
- `standard-compact`: Clean title and subtitle with right-aligned dates and location.
- `detailed-spaced`: Roomy card layout with subtle left accent border.
- `minimal-border`: Ultra-flat layout with subtle bottom divider between entries.

### Skills Variants
- `inline-tags`: Lightweight inline badges with border and background tint.
- `badge-chips`: Rounded pill chips using subtle accent colors.
- `category-list`: Grouped text lines categorized by skill domain.
- `progress-dots`: Minimalist tag representation.

---

## 4. How to Add a New Template

Adding a new template to Resumint requires **zero React boilerplate** and can be done in 1 step (or 2 steps if introducing new visual layout slots):

### Step 1: Add a Seed Row in `app/db/seed/templates.ts`

Add an entry to `TEMPLATE_SEED_DATA`:

```ts
{
  key: "minimal-dark",
  name: "Minimal Dark",
  tier: "standard",
  description: "High contrast dark-accent theme for technical PMs.",
  sortOrder: 11,
  isActive: true,
  design: {
    accentColor: "#0f172a",
    fontFamily: "ibm-plex-sans",
    fontScale: 1.0,
    lineSpacing: 1.35,
    pageMargin: 16,
    sectionSpacing: 14,
    headingStyle: "uppercase",
  },
  layout: {
    headerVariant: "modern-accent-bar",
    sectionHeadingVariant: "left-rule",
    itemVariant: "standard-compact",
    skillsVariant: "badge-chips",
    columns: 1,
    sidebarSections: [],
  },
  sampleContent: createSampleContent(),
}
```

Then run:
```bash
npm run db:seed
```
The idempotent seeder inserts or updates the template in D1.

### Step 2 (Optional): Add a Custom Layout Variant

If your template requires a novel arrangement (e.g., a new header layout), implement the pure variant function in `app/components/templates/variants/`:
1. Add the variant name to `TemplateLayout["headerVariant"]` in `app/db/schema.ts`.
2. Implement the component in `app/components/templates/variants/HeaderVariants.tsx`.
3. The generic renderer automatically picks it up without altering any other templates.

---

## 5. ATS Invariants

All 10 templates strictly maintain machine-readability guarantees:
1. **Semantic HTML**: Exactly one `<h1>` for candidate name, `<h2>` for section titles, and `<h3>` for role titles and institutions.
2. **Linear DOM Reading Order**: In two-column layouts (`technical`, `creative`), the HTML tree places Experience and Education before Sidebar sections (Skills, Languages). Layout is achieved strictly via CSS Grid (`grid-template-areas`), preserving semantic DOM flow.
3. **Native Text Nodes Only**: Text is never rendered in `<canvas>`, `<svg>`, or CSS `content: "..."` pseudo-elements.
4. **Safe Protocols**: URLs strictly validate against `http:`, `https:`, `mailto:`, and `tel:`.
5. **Print & PDF Fidelity**: Print stylesheets (`@page`, `@media print`) guarantee crisp vector text output matching the web preview.
