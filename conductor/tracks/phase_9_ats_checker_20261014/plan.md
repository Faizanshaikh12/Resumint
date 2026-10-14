# Track Implementation Plan: Phase 9 - ATS Checker, Resume Score, Job Description Match

### Phase 1: Pure Types, Data Dictionaries & Context Foundation
- [ ] Task: Create `app/lib/ats/types.ts` defining `CheckStatus`, `CategoryId`, `FieldTarget`, `Check`, `CategoryScore`, and `AtsReport`
- [ ] Task: Create in-repo data dictionaries in `app/lib/ats/data/` (`action-verbs.ts`, `buzzwords.ts`, `stopwords.ts`, `placeholders.ts`, `skills.ts`)
- [ ] Task: Create `app/lib/ats/context.ts` building the pre-computed evaluation context (visible sections, plain text, word counts, flattened bullets, language heuristic, injected `now`)
- [ ] Task: Create `app/lib/ats/analyze.ts` running all registered rules, renormalizing excluded `na` checks to 100, rounding score, and ranking top fixes
- [ ] Task: Write initial unit tests for framework scoring and normalization in `tests/unit/ats-framework.test.ts`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 2: Category Rules Implementation
- [ ] Task: Implement Contact & Basics rules in `app/lib/ats/rules/contact.ts` (name, email, phone, location, links, placeholders)
- [ ] Task: Implement Structure rules in `app/lib/ats/rules/structure.ts` (core sections, student projects accommodation, standard headings, order, no duplicates)
- [ ] Task: Implement Summary rules in `app/lib/ats/rules/summary.ts` (presence, word count 25-80, first-person "I" check, buzzword density)
- [ ] Task: Implement Experience Bullets rules in `app/lib/ats/rules/experience.ts` (action verbs, quantifiable metrics, length 8-30 words, 2-6 bullets per role, verb repetition cap)
- [ ] Task: Implement Dates & Order rules in `app/lib/ats/rules/dates.ts` (parseable dates, start <= end, reverse chronological order, "Present" handling, gaps > 12 months)
- [ ] Task: Implement Length & Readability rules in `app/lib/ats/rules/length.ts` (1-2 pages via page model, word count 350-900, wall of text warning, skills count 5-25)
- [ ] Task: Implement Language & Tone rules in `app/lib/ats/rules/language.ts` (placeholder artifacts, first-person pronouns in bullets, repeated words "the the", double spaces, bullet punctuation consistency)
- [ ] Task: Register all rules in `app/lib/ats/rules/registry.ts`
- [ ] Task: Unit tests for all 7 rule sets with edge cases and student fixtures in `tests/unit/ats-rules.test.ts`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 3: Job Description Tokenizer, Extractor & Matcher
- [ ] Task: Implement `app/lib/ats/keywords/tokenize.ts` with special token recognition (`C++`, `C#`, `.NET`, `Node.js`, `Next.js`, `CI/CD`), character cap (10k), and URL/email stripping
- [ ] Task: Implement `app/lib/ats/keywords/extract.ts` extracting ranked skills and phrases with frequency, requirement section boosting, and stopword filtering
- [ ] Task: Implement `app/lib/ats/keywords/match.ts` comparing JD keywords against resume visible content with word boundaries, aliases, anti-stuffing guard, and coverage percentage
- [ ] Task: Unit tests in `tests/unit/ats-keywords.test.ts` with 4+ realistic JD fixtures (Backend, Frontend, Data Analyst, Non-tech/Healthcare)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 4: ATS Checker Panel & UI Integration
- [ ] Task: Create `ScoreHeader.tsx` displaying circular SVG gauge, score, honest disclaimer label, and category point progress bars
- [ ] Task: Create `ChecklistItem.tsx` with status icon, title, message, fix hint, and click-to-focus action
- [ ] Task: Create `TopFixesCard.tsx` highlighting top 3 recoverable fixes
- [ ] Task: Create `JobMatchCard.tsx` with textarea, character counter, sessionStorage persistence, matched/missing chips with target hints
- [ ] Task: Create `AtsCheckerPanel.tsx` integrating ScoreHeader, filter chips (All, Needs attention, Passed), TopFixes, Checklist, and JobMatchCard
- [ ] Task: Expand editor tab navigation to `Content` | `Design` | `Check` in `ResumeEditor.tsx` and mobile navigation
- [ ] Task: Add real-time debounced score badge to `EditorHeader.tsx` triggering Check tab on click
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 5: Click-to-Focus Field Navigation
- [ ] Task: Add `data-field-path` attributes to editor inputs and bullet items in section forms (`PersonalInfoForm`, `ExperienceForm`, `EducationForm`, `SkillsForm`, `SummaryForm`, `ProjectsForm`, etc.)
- [ ] Task: Implement `focusField(target)` utility switching to `Content` tab, opening collapsed sections, scrolling smoothly, and focusing the target element
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 6: Component, Unit & Playwright E2E Tests
- [ ] Task: Component tests in `tests/components/AtsChecker.test.tsx` (score header, category bars, filter chips, job match storage, focusField callback)
- [ ] Task: Playwright E2E tests in `tests/e2e/ats.spec.ts` (sample resume score check, click issue -> focus input -> edit -> score updates, paste JD -> add missing skill -> assert zero network requests leak JD text, axe WCAG 2.1 AA check)
- [ ] Task: Verify performance benchmark (<50ms max resume analysis) in unit test
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

### Phase 7: Documentation & Verification
- [ ] Task: Update `docs/PLAN.md` with ASCII analyze pipeline and keyword matching diagrams
- [ ] Task: Update `docs/DECISIONS.md` with ADRs (client-side only evaluation, weights and categories, na renormalization, dictionary authoring, JD privacy, no SSRF)
- [ ] Task: Update `docs/TASKS.md` marking Phase 9 complete and refining Phase 10
- [ ] Task: Update `README.md` with ATS score guide, rules table, and disclaimer
- [ ] Task: Execute full verification suite (`npm run lint`, `npm run typecheck`, `npm test`, `npm run test:worker`, `npm run build`, `npm run test:e2e`)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
