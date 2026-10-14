# Resumint - Templates & Design Catalog

Resumint provides 5 production-grade, ATS-compliant presentational templates designed to pass automated parsing systems (Workday, Greenhouse, Taleo) while maintaining exceptional visual aesthetics.

---

## 1. Architecture Overview

```
                      ┌──────────────────────┐
                      │   resumeDesignSchema │
                      └──────────┬───────────┘
                                 │
                   ┌─────────────┴─────────────┐
                   ▼                           ▼
        ┌─────────────────────┐     ┌──────────────────────┐
        │   design-tokens.ts  │     │ normalize-design.ts  │
        │  (CSS Custom Props) │     │ (Clamping & Bounds)  │
        └──────────┬──────────┘     └──────────┬───────────┘
                   │                           │
                   └─────────────┬─────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │    Template Registry    │
                    │   (getTemplate / IDs)   │
                    └────────────┬────────────┘
                                 │
     ┌──────────────┬────────────┼────────────┬──────────────┐
     ▼              ▼            ▼            ▼              ▼
┌─────────┐   ┌─────────┐  ┌───────────┐ ┌─────────┐   ┌───────────┐
│ Modern  │   │ Minimal │  │ Executive │ │ Classic │   │ Technical │
└─────────┘   └─────────┘  └───────────┘ └─────────┘   └───────────┘
     │              │            │            │              │
     └──────────────┴────────────┼────────────┴──────────────┘
                                 ▼
                     ┌───────────────────────┐
                     │ Shared Modular Parts  │
                     │  - SectionRenderer    │
                     │  - ItemDate           │
                     │  - BulletList         │
                     │  - LinkList           │
                     │  - SkillList          │
                     └───────────────────────┘
```

---

## 2. Template Catalog

| Template ID | Name | Layout | Default Font | Accent Color | Description & Best For |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `modern` | **Modern Clean** | 1 or 2 Columns | Inter | `#2563eb` (Blue) | Versatile tech and general professional roles. Subtle colored headers and clean borders. |
| `minimal` | **Ultra Minimal** | 1 Column | Lato | `#171717` (Charcoal) | Maximum whitespace and typography focus. Favored by designers, PMs, and copywriters. |
| `executive` | **Executive Classic** | 1 Column | Source Serif 4 | `#1e3a8a` (Deep Navy) | Traditional serif typography with centered header rules. Best for senior leadership, finance, law. |
| `classic` | **Classic ATS** | 1 Column | Merriweather | `#0f172a` (Slate) | Traditional single-column document with solid uppercase dividers. Best for legacy enterprise portals. |
| `technical` | **Technical Grid** | 2-Column Grid | IBM Plex Sans | `#059669` (Emerald) | Dense layout with skills badge tags and monospace date accents. Best for software and DevOps engineers. |

---

## 3. Design Tokens & Capabilities

All templates dynamically inherit from CSS custom variables injected at the root `<article>` element:

| CSS Variable | Design Field | Allowed Range / Values | Default |
| :--- | :--- | :--- | :--- |
| `--accent` | `accentColor` | Valid 3 or 6 digit Hex (`#2563eb`) | `#2563eb` |
| `--font` | `fontFamily` | `inter`, `source-serif-4`, `lato`, `merriweather`, `ibm-plex-sans`, `roboto-mono` | `inter` |
| `--scale` | `fontScale` | `0.85` – `1.25` (pre-clamped) | `1.0` |
| `--line` | `lineSpacing` | `1.0` – `1.8` | `1.3` |
| `--margin` | `pageMargin` | `10mm` – `30mm` | `16mm` |
| `--gap` | `sectionSpacing` | `8mm` – `32mm` | `16mm` |
| `--page-width` | `pageSize` | `A4` (210mm) or `Letter` (8.5in / 215.9mm) | `A4` |
| `--page-height` | `pageSize` | `A4` (297mm) or `Letter` (11in / 279.4mm) | `A4` |

---

## 4. ATS Invariants

All templates adhere to 7 strict machine-parsing rules:
1. **Semantic HTML**: Exactly one `<h1>` for candidate name; `<h2>` for sections; `<h3>` for individual roles and institutions.
2. **Linear DOM Reading Order**: Even in two-column layouts, the HTML tree reads experience before education, styled via CSS Grid without altering reading stream.
3. **No Canvas or SVG Text**: All textual data is rendered as native DOM text nodes. Icons are strictly `aria-hidden="true"`.
4. **No CSS Text Generation**: Text is never injected using `content: "..."` in CSS.
5. **Safe Protocol Sanitization**: Links strictly validate against `http:`, `https:`, `mailto:`, and `tel:`. Any `javascript:` or `data:` URLs are stripped.
6. **WCAG Contrast Warning**: Accent colors under 4.5:1 relative luminance against white trigger interactive warnings in the Design Panel.
7. **Offline Font Independence**: Fonts are bundled locally as woff2 assets with standard system fallback stacks.
