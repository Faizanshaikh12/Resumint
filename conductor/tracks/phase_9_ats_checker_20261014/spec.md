# Specification: Phase 9 - ATS Checker, Resume Score, Job Description Match

## 1. Overview & Goals
Resumint Phase 9 implements an explainable, 100% client-side heuristic resume evaluator and job description keyword matcher. It calculates a deterministic 0-100 score across 7 core resume dimensions, provides actionable fix hints linked directly to editor inputs, and analyzes candidate keyword coverage against user-pasted job descriptions without sending any data over the network or invoking external AI APIs.

### Core Principles
1. **100% Client-Side & Pure**: Zero network requests, zero server routes, zero Cloudflare D1 reads/writes, zero database migrations. Works seamlessly for guests (`/build`) and authenticated users (`/resumes/:id/edit`).
2. **Honesty & Transparency**: Clearly branded as "Resumint checklist score (a guide, not a guarantee)". Never claim "ATS approved" or "passes ATS".
3. **Absolute Privacy**: Job descriptions remain strictly in memory and `sessionStorage` keyed by resume ID; never persisted to databases or sent over the wire.
4. **Deterministic & Explainable**: Same resume input -> identical score. Every point lost maps to an explicit check with a human reason, fix hint, and clickable field target.
5. **No AI & Anti-Stuffing**: Pure algorithmic evaluation using curated in-repo dictionaries. Suggestions advise "Add only if it is true for you" and warn against keyword stuffing.
6. **Performance Budget**: Evaluation of schema-capped resumes runs in <50ms. Analysis runs debounced (~500ms) with `useDeferredValue` to maintain 60 FPS typing responsiveness.

---

## 2. Architecture & Data Structures (`app/lib/ats/`)

### Types (`types.ts`)
```typescript
export type CheckStatus = "pass" | "warn" | "fail" | "na";

export type CategoryId =
  | "contact"
  | "structure"
  | "summary"
  | "experience"
  | "dates"
  | "length"
  | "language";

export interface FieldTarget {
  sectionId: string;
  itemId?: string;
  field?: string;
  bulletIndex?: number;
}

export interface Check {
  id: string; // kebab-case stable identifier
  category: CategoryId;
  weight: number;
  status: CheckStatus;
  credit: number; // 0..1 (pass=1, warn=0.5 default, fail=0, na excluded)
  title: string;
  message: string;
  fix?: string;
  targets?: FieldTarget[];
}

export interface CategoryScore {
  id: CategoryId;
  label: string;
  weight: number;
  earned: number;
  maxPossible: number;
  score: number; // 0..100 percentage
}

export interface AtsReport {
  score: number; // 0..100 rounded
  label: "Needs work" | "Good start" | "Strong" | "Excellent";
  categories: CategoryScore[];
  checks: Check[];
  topFixes: Check[];
  meta: {
    wordCount: number;
    pageCount?: number;
    language: "en" | "other";
  };
}
```

### Context Builder (`context.ts`)
Extracts pre-computed context once per run:
- Ordered list of non-hidden, non-empty visible sections.
- Flattened plain text for entire visible resume.
- Total word counts and section-by-section word counts.
- Flattened bullet points with associated metadata `(sectionId, itemId, bulletIndex, text)`.
- Language heuristic: English stopword frequency ratio test (if < 15% standard English stopwords in natural language text, flag as `"other"`).
- Injected `now` timestamp (default `new Date()`) for deterministic date comparisons.

---

## 3. Rules & Categories (Total Weight = 100)

| Category | Weight | Checks & Scoring Logic |
| :--- | :---: | :--- |
| **Contact and Basics** | **15** | Candidate full name present; valid email regex; plausible phone number; location present; links use secure `https://` protocol; no placeholder text (`alex.morgan@example.com`, `John Doe`, etc.). |
| **Structure** | **15** | Core sections present (`experience` OR `projects` for students, `education`, `skills`); standard recognizable section headings; sensible section order; no duplicate sections. |
| **Summary** | **10** | Summary section present; optimal word count (~25-80 words); does not open with first-person pronoun ("I am", "I"); not composed purely of buzzwords. |
| **Experience Bullets** | **30** | Bullets start with strong action verb (curated ~180 verb dictionary; past tense for past roles, present for current); contains quantifiable metrics (numbers, %, $, multipliers); optimal word length (8-30 words); 2-6 bullets per position; no opening verb repeated >2x in a single role. Softened for student resumes with Projects. |
| **Dates and Order** | **10** | Parseable start/end dates; start date <= end date; reverse-chronological ordering; current roles specify "Present"; warn on unexplained gaps > 12 months. |
| **Length / Readability** | **10** | Page budget compliance (1-2 pages via Phase 6 page model); total word count within 350-900 words; no dense walls of text (>100 words per bullet); skills list contains 5-25 items. |
| **Language and Tone** | **10** | Zero sample placeholder text left behind ("Lorem", "Company Name"); zero first-person pronouns in bullets ("I", "my", "we"); buzzword density within healthy threshold; no repeated words ("the the"); no double spaces; consistent trailing punctuation across bullets. |

---

## 4. Job Description Keyword Matcher (`app/lib/ats/keywords/`)

1. **Tokenization (`tokenize.ts`)**:
   - Handles multi-character technical tokens: `C++`, `C#`, `.NET`, `Node.js`, `Next.js`, `CI/CD`, `TypeScript`, `Vue.js`, `REST APIs`.
   - Strips URLs, emails, and punctuation.
   - Input capped at 10,000 characters before parsing.
2. **Extraction (`extract.ts`)**:
   - In-repo curated skills dictionary (`skills-dictionary.ts`) with ~300 verified technical and domain skills with alias maps (`js` -> `JavaScript`, `k8s` -> `Kubernetes`, `postgres` -> `PostgreSQL`, `reactjs` -> `React`).
   - Keyword weighting: +50% frequency boost for terms appearing under requirement headings ("Requirements", "Qualifications", "Must have").
   - Filter out stopwords and generic corporate boilerplate ("team player", "responsibilities", "work environment").
3. **Matching (`match.ts`)**:
   - Case-insensitive, alias-aware, word-boundary safe matching (`Java` does not match `JavaScript`; `Go` does not match `going`).
   - Calculates weighted keyword coverage percentage (0-100%).
   - Classifies keywords into `matched` and `missing` (ranked top 15).
   - Each missing keyword provides a target hint ("Could fit in Skills or Experience") and explicit label: *"Add only if it is true for you"*.
   - Stuffing guard: Flags unnatural repetition (>4% density for single keyword) or comma-dump sequences.
   - Isolated from base checklist score: Pasting or omitting a JD never penalizes the main 0-100 resume score.

---

## 5. UI Integration

1. **Editor Tab Expansion**:
   - Left pane receives third tab: `Content` | `Design` | `Check`.
   - EditorHeader displays debounced real-time score badge (e.g. `82 Strong`) that activates the `Check` tab when clicked.
2. **Score Header**:
   - Accessible SVG/CSS circular or gauge score display with label and aria-label (`Score 82 out of 100, Strong`).
   - Honesty notice: *"Resumint checklist score (a guide, not a guarantee)"*.
   - Category progress bars showing points earned vs max possible.
3. **Checklist & Navigation**:
   - Filter chips: `All` | `Needs attention` (fails + warns) | `Passed`.
   - Each check displays status icon, title, message, and fix recommendation.
   - Click-to-Focus: Clicking a check triggers `focusField(target)`, seamlessly switching to the `Content` tab, scrolling to the element, and focusing the exact input or bullet point via `data-field-path`.
4. **Top 3 Fixes**:
   - Prominently showcases the top 3 highest-impact recoverable checks to guide quick improvement.
5. **Job Description Card**:
   - Textarea with character counter, "Clear" button, and "Analyze Keywords" action.
   - Persists input in `sessionStorage` keyed by resume ID; never transmitted to any server.

---

## 6. Testing Strategy
- **Unit Tests (`tests/unit/ats/`)**:
  - Pure framework: score calculation, normalization without `na`, rounding, label thresholds, determinism.
  - Individual rule suites for all 7 categories: contact, structure, summary, experience, dates, length, language.
  - Edge cases: student resumes with projects only, non-English resumes, max-size resumes under 50ms.
  - Keyword extractor and matcher: special tokens, aliases, boundary isolation, 4 realistic JD fixtures.
- **Component Tests (`tests/components/AtsChecker.test.tsx`)**:
  - Score display, filter chips, top fixes rendering, click-to-focus event triggering, job description persistence.
- **Playwright E2E Tests (`tests/e2e/ats.spec.ts`)**:
  - Sample resume score check -> click check -> focus input -> edit text -> score updates in real time.
  - Job description pasting -> missing keywords displayed -> add skill -> coverage increases -> assert 0 network requests leak JD text.
  - Axe accessibility compliance on Check tab.
