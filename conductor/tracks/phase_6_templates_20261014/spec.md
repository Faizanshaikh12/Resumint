# Specification: Phase 6 - Templates and Design Customization

## 1. Overview
Phase 6 introduces a production-grade template system and visual design panel for Resumint. It replaces the temporary `BasicPreview` with 5 ATS-compliant presentational templates (`modern`, `minimal`, `executive`, `classic`, `technical`) backed by a design contract and token generation system. Content and design remain completely decoupled, ensuring zero data loss during template switching.

## 2. Functional Requirements
1. **Design Contract & Tokens (`app/lib/resume/`):**
   - Extend `resumeDesignSchema` with backward compatibility: `accentColor`, `fontFamily` (6 bundled families), `fontScale`, `lineSpacing`, `pageMargin`, `sectionSpacing`, `pageSize`, `columns`, `headerAlign`, `dateStyle`, `showIcons`.
   - `design-tokens.ts`: Convert design parameters into CSS variables (`--accent`, `--font`, `--scale`, `--line`, `--margin`, `--gap`, `--page-width`, `--page-height`).
   - `contrast.ts`: WCAG contrast ratio calculations with `isAccentReadable(hex)` checking against white (4.5:1 ratio).
   - `normalizeDesign(design, template)`: Clamp out-of-range design values and drop unsupported options (e.g. 2 columns on single-column-only templates).
2. **Template System (`app/components/templates/`):**
   - Registry exporting metadata (`id`, `name`, `description`, `atsNotes`, `supports`, `defaultDesign`, `Component`) and fallback handling.
   - Shared modular parts (`SectionRenderer`, `ItemDate`, `BulletList`, `LinkList`, `SkillList`).
   - 5 ATS-friendly templates: `modern`, `minimal`, `executive`, `classic`, and `technical` (with 2-column grid layout maintaining linear reading order).
   - Safe link sanitizer allowing only `http:`, `https:`, `mailto:`, `tel:`.
   - Error boundary for template rendering.
3. **Print-Fidelity & Page Model:**
   - `resume-page.css`: `@page` rules, `break-inside: avoid`, `break-after: avoid`, `print-color-adjust: exact`, chrome hiding.
   - Responsive scaling preview with continuous flow and page-break guides measuring content height.
   - Self-hosted variable/woff2 fonts for 6 families loaded lazily.
4. **Design Panel UI:**
   - Tab switch between "Content" and "Design".
   - Live interactive template gallery cards with radio semantics.
   - Design controls (swatches, hex picker with contrast warning, sliders, toggles).
   - "Reset to template defaults" with confirmation.
   - Touched-fields tracking so template switching only overrides uncustomized fields.
5. **Phase 5 System Integration:**
   - Wire `design` and `templateId` into editor state, undo/redo, autosave, server `save` action, versions snapshot/restore, and guest claim.
   - Resource route `/resumes/:id/preview-data` and lazy `ResumeThumbnail` on dashboard.

## 3. Non-Functional Requirements & ATS Rules
- Pure presentational templates: no fetch, no side-effects, no DOM mutations.
- ATS compliance: semantic HTML (`h1`, `h2`, `h3`, `ul`, `li`, `time`), linear reading order, no text in SVG/images/canvas, no CSS `content:` text, icons `aria-hidden`.
- Never use `dangerouslySetInnerHTML`.
- Workers Free tier budget discipline: client-side preview rendering, lazy self-hosted font loading.

## 4. Acceptance Criteria
- Full test suite passes: Vitest unit, component, worker integration, and Playwright e2e with Chromium PDF generation.
- 0 lint and typecheck errors.
- Switching templates never loses or mutates resume content.
