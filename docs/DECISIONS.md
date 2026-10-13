# Resumint - Architectural Decision Records (ADRs)

## ADR-001: Cloudflare Workers Edge Deployment (Free Tier Budget)
- **Status**: Accepted
- **Context**: The application is deployed as a single full-stack Worker utilizing React Router v7 framework mode. Cloudflare Workers Free Tier enforces a strict CPU execution limit of **10 ms per request**.
- **Decision**:
  - Keep server-side rendering (SSR) light and fast.
  - Ban CPU-intensive workloads on the Worker runtime (no headless browser generation, no bcrypt native modules).
  - Use lightweight SQLite queries against Cloudflare D1.
- **Consequences**: Fast response times globally; strict constraint against adding heavy server dependencies.

---

## ADR-002: Client-Side PDF Generation via Print Stylesheets
- **Status**: Accepted
- **Context**: Kickresume and other builders typically render PDFs. Generating PDFs on the server using headless Chrome (Puppeteer) requires dedicated servers or third-party paid APIs and completely exceeds Cloudflare Worker CPU limits.
- **Decision**: Implement high-fidelity `@page` print CSS and client-side browser print rendering (`window.print()`).
- **Consequences**: Zero server cost, instantaneous rendering, identical font/color fidelity, perfectly ATS-readable text.

---

## ADR-003: Guest-First Editing with In-Place Draft Claiming
- **Status**: Accepted
- **Context**: Forcing users to create an account before experiencing the product creates high bounce rates.
- **Decision**:
  - Users can immediately access the resume builder (`/resumes/new`) as guests.
  - In-progress edits are tracked in `localStorage` under a versioned key (`resumint_draft_v1`).
  - Guests can download PDF previews for free.
  - Saving or sharing prompts an inline `AuthModal`. Upon successful sign-up or login, the draft payload is validated via Zod on the server and committed to Cloudflare D1, smoothly transitioning the route with `navigate(..., { replace: true })`.
- **Consequences**: Drastically reduced friction and higher user engagement without sacrificing persistent storage for returning users.

---

## ADR-004: Authentication Strategy & SHA-256 Hashed Sessions
- **Status**: Accepted
- **Context**: Hand-rolling custom bcrypt authentication on Cloudflare Workers runs into PBKDF2 WebCrypto CPU latency issues on the free tier. Plain-text session tokens in the database are a critical security liability.
- **Decision**:
  - Use Better Auth with Cloudflare D1 Drizzle adapter (or edge-tuned WebCrypto PBKDF2 verified within the 10ms budget).
  - Store only SHA-256 hashes of session tokens in the database.
  - Transmit session identifiers via secure HTTP-Only cookies.
- **Consequences**: Protection against database token leaks, robust edge-compatible authentication.

---

## ADR-005: AI Scope Deferred to Feature Flag (Zero AI in MVP)
- **Status**: Accepted
- **Context**: AI text generation introduces API key requirements, latency, token costs, and can produce generic resume content.
- **Decision**: Exclude AI generation from MVP. Rely strictly on a deterministic, rule-based ATS evaluation engine. Any future Workers AI integrations will remain strictly behind feature flags.
- **Consequences**: Instant, predictable resume generation with clean, high-signal ATS guidelines.
