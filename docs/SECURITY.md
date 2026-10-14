# Security Policy & Hardening Specification

## 1. Threat Model & Architecture Overview

Resumint is engineered on the Cloudflare Workers edge runtime with strict zero-trust principles:
- **No Native Node.js Primitives:** Zero usage of `node:fs`, `node:child_process`, or unverified native C++ addons. All cryptography utilizes standard `crypto.subtle` (WebCrypto API).
- **Stateless Edge Execution:** Cloudflare Workers run in V8 isolates with no local disk persistence, preventing server-side file traversal and persistent file-system compromise.
- **Client-Side Generation:** Resumes are authored and rendered in the client browser; PDF generation uses standard `@page` CSS print media natively inside the client's browser, eliminating remote server rendering queues (SSRF and headless browser escape vectors).

---

## 2. HTTP Security Headers

Every HTTP response emitted by the Cloudflare Worker runtime (via [workers/app.ts](file:///c:/_Projects/Faizan/Resumint/workers/app.ts)) enforces strict modern security headers:

| Header | Production Value | Protection / Defense |
| :--- | :--- | :--- |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'` | Prevents unauthorized script injection, asset stealing, cross-site framing, and rogue form action hijacking. |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Forces encrypted HTTPS communication and protects against SSL stripping attacks. |
| `X-Content-Type-Options` | `nosniff` | Disables MIME type sniffing by the browser. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Protects privacy by stripping URL paths and query parameters on cross-origin navigation. |
| `X-Frame-Options` | `DENY` | Completely prevents clickjacking by barring framing in iframes. |
| `Cross-Origin-Opener-Policy`| `same-origin` | Isolates the browsing context to protect against Spectre-style cross-origin data leaks. |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=()` | Disables all unnecessary browser hardware sensors and sensitive device capabilities. |

### Stricter Share Route & Data Export Headers
Public shared resume links (`/r/:slug`) and user data exports (`/api/export-data`) enforce additional caching restrictions:
- `Cache-Control: no-store, no-cache, must-revalidate, max-age=0`
- `X-Robots-Tag: noindex, nofollow, noarchive`

---

## 3. Authentication & Session Security

- **Password Hashing:** Better Auth utilizes WebCrypto `crypto.subtle.deriveBits` using **PBKDF2** with **100,000 iterations**, **SHA-256**, and unique cryptographic salts per credential.
- **Session Tokens:** 32-byte cryptographically secure random session tokens stored in Cloudflare D1 with explicit expiration dates.
- **Cookie Flags:**
  - `HttpOnly`: Strictly prevents access from JavaScript.
  - `SameSite=Lax`: Mitigates Cross-Site Request Forgery (CSRF).
  - `Secure`: Transmitted exclusively over HTTPS in production.
  - `Path=/`: Explicitly scoped to the application boundary.
- **Rate Limiting:** Unauthenticated endpoints (signup, login, share password unlocking, and data exports) enforce in-memory edge sliding-window rate limiters, returning `429 Too Many Requests` when abused.

---

## 4. Origin & CSRF Protection

Every mutating HTTP method (`POST`, `PUT`, `DELETE`, `PATCH`) must pass through the `verifyCsrf` barrier ([app/lib/security/csrf.server.ts](file:///c:/_Projects/Faizan/Resumint/app/lib/security/csrf.server.ts)):
- The request's `Origin` or `Referer` header is matched strictly against the trusted application origin (`BETTER_AUTH_URL` / request URL host).
- Cross-origin form posts from third-party sites are immediately rejected with `403 Forbidden`.
- Automated regression suite [tests/worker/security-audit.test.ts](file:///c:/_Projects/Faizan/Resumint/tests/worker/security-audit.test.ts) verifies CSRF rejection across all application action routes.

---

## 5. Input Validation & Static Security Gates

- **Input Sanitization:** Every server action and loader parses untrusted user payloads using strict Zod schemas with finite string bounds and byte limits:
  - Resume title: maximum 100 characters.
  - JSON import envelopes: maximum 2 MB (`MAX_EXPORT_JSON_BYTES`).
  - Job descriptions: maximum 50,000 characters.
- **Static Code Analysis ([tests/unit/security-static.test.ts](file:///c:/_Projects/Faizan/Resumint/tests/unit/security-static.test.ts)):**
  - **Zero `dangerouslySetInnerHTML`:** Automated AST/regex sweep verifies zero usage of unescaped raw HTML injection in the frontend codebase.
  - **Zero `eval()` / `new Function()`:** Dynamic string execution is completely prohibited.
  - **Zero Hardcoded Secrets:** Regex scan verifies no hardcoded API keys or private credentials in repository code.

---

## 6. Account Lifecycle & Cascading Deletion

Resumint provides complete data sovereignty and privacy compliance:
1. **One-Click Data Download (`/api/export-data`):** Authenticated users can download an uncompressed, structured JSON export of all their resumes, custom designs, and metadata.
2. **Permanent Account Deletion (`/settings`):** Type-to-confirm account deletion performs a sequential, foreign-key-safe cascade in Cloudflare D1:
   - All resumes owned by the user.
   - All resume version snapshots.
   - All active and expired public share links.
   - All Better Auth session tokens and account credentials.
   - The user record itself.
3. Once deleted, all previously shared public links immediately return a uniform, non-leaking `404 Not Found`.

---

## 7. Reporting a Vulnerability

If you discover a security vulnerability in Resumint:
1. Please **do not** open a public GitHub issue.
2. Email security reports directly to: `security@resumint.dev` (or message the maintainer via GitHub Security Advisories).
3. Include detailed steps to reproduce the issue and the potential impact. We will acknowledge receipt within 48 hours and work on a fix before public disclosure.
