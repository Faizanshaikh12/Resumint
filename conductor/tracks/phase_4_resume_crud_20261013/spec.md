# Specification: Phase 4 - Resume CRUD + Dashboard

## 1. Overview
Phase 4 connects the Cloudflare D1 query layer to React Router v7 routes and builds the authenticated resume dashboard ("My Documents") at `/dashboard`. Users can list their resumes, create new resumes (blank or from built-in code samples), rename, duplicate, and delete resumes with optimistic fetchers, live toast notifications, and accessible confirmation dialogs.

## 2. Functional Requirements
1. **Intents & Action Validation**:
   - `create`: Source `blank | sample`, optional `sampleId`, optional `title`, optional `templateId`. Enforces per-user resume limit (cap: 20). Redirects to `/resumes/:id/edit`.
   - `rename`: Input `id` and `title` (1-100 characters, trimmed). No-op if title is unchanged.
   - `duplicate`: Clones content and design from existing resume; title becomes `<title> (Copy)` (capped at 100 characters); version resets to 1; share link is NOT copied. Enforces resume limit.
   - `delete`: Deletes resume; cascade deletion removes snapshots and share links.
2. **Dashboard Route (`/dashboard`)**:
   - `loader`: Reads `?q=` (case-insensitive substring search with wildcard escaping for `%` and `_`), `?sort=` (`updated` | `created` | `title` with stable tie-break by `id`), `?cursor=`. Returns lightweight summary columns only (never content/design JSON blobs).
   - `action`: Handles intents `create`, `rename`, `duplicate`, `delete`. Enforces CSRF origin verification. Non-owned or missing resumes respond with HTTP 404 (never 403) to prevent resource existence enumeration.
3. **Choose-Start Route (`/resumes/new`)**:
   - Selection page allowing creation of a "Blank resume" or one of 3 code samples (Developer, Student, Designer).
   - Submits `create` intent to `/dashboard` action.
4. **Editor Placeholder Route (`/resumes/:id/edit`)**:
   - `requireUser` guard.
   - Calls `getResume(db, id, userId)`; responds with HTTP 404 if not found or not owned.
   - Renders resume title, version, template id, "Editor arrives in Phase 5" placeholder, and return link.
   - Route-level `ErrorBoundary` handling 404 cleanly.
5. **UI & Accessibility**:
   - Header with "My Documents", resume count cap indicator (e.g., "3 of 20"), and "New resume" button (disabled when at limit).
   - Search toolbar with debounced input and sort select synced with URL query parameters.
   - Grid/list of `ResumeCard` components with title, template badge, relative time, and action dropdown.
   - Delete confirmation dialog.
   - Pagination via `nextCursor` ("Load more").
   - Skeleton loading, empty, and no-results states.
   - Axe accessibility compliant (WCAG 2.1 AA).

## 3. Non-Functional Requirements & Security
- **Strict Authorization**: Every query and mutation is scoped by `userId`.
- **Enumeration Prevention**: Non-owned resumes return 404 Not Found.
- **D1 Budget Protection**: Max 20 resumes per user; lightweight projection in list queries.
- **CSRF Protection**: All mutating actions enforce origin verification.

## 4. Acceptance Criteria
- Full test pass: `npm run lint && npm run typecheck && npm test && npm run test:worker && npm run test:e2e && npm run build`.
- 100% route-level authorization isolation proven (User B gets 404 for User A's resumes).
- Playwright E2E and Axe audits green.
- Deployed worker verification.
