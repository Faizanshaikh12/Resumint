# Changelog

All notable changes to **Resumint** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-14

### Initial Production MVP Release 🎉

Resumint is a modern, privacy-first, ATS-optimized online resume builder built with React Router v7 and Cloudflare D1.

#### Features
- **Guest-First Architecture**: Jump straight into `/build` with zero mandatory sign-up, persistent local storage (`resumint_guest_draft`), and seamless draft claiming.
- **5 ATS-Compliant Templates**: `Modern`, `Minimal`, `Executive`, `Classic`, and `Technical` with pure presentational separation and zero content loss during template switching.
- **Rule-Based ATS Checker**: Explainable 0–100 heuristic score across 7 categories (Contact, Structure, Summary, Experience, Dates, Length, Language/Tone) with clickable field navigation.
- **100% Client-Side Job Description Match**: In-browser keyword matching against candidate skills using canonical dictionaries and heading-boosted tokenization. Never sends job text over the network.
- **High-Fidelity Client-Side PDF Export**: Pixel-perfect vector PDF generation using native `@page` print styles with A4 and Letter format support and zero server compute overhead.
- **Portable JSON Envelope**: Robust versioned JSON export and import (`$schema: https://resumint.dev/schema/v1.json`) with prototype pollution prevention and ID regeneration.
- **Share via Link (`/r/:slug`)**: Granular sharing with optional password protection (PBKDF2 + HMAC cookies), link expiration, contact redaction, and `X-Robots-Tag: noindex, nofollow` headers.
- **Account Dashboard ("My Documents")**: Keyset cursor pagination, debounced search, optimistic mutations (rename, duplicate, delete), and lazy document miniatures.
- **Data Sovereignty & Account Lifecycle**: Full JSON archive export (`/api/export-data`) and permanent cascading account deletion (`/settings`).

#### Security & Compliance
- **Strict Content Security Policy (CSP)**: Nonce/self-hosted scripts, styles, and fonts with `frame-ancestors 'none'`, `form-action 'self'`, and `base-uri 'self'`.
- **Global Transport & Header Hardening**: HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Cross-Origin-Opener-Policy: same-origin`, and `Permissions-Policy`.
- **Zero Inline Code Execution**: Zero `dangerouslySetInnerHTML`, zero `eval()`, and zero `new Function()` across all client and worker code.
- **CSRF & Origin Protection**: Strict origin verification on all mutating state actions.

#### Accessibility (WCAG 2.2 AA)
- 100% pass rate with zero Axe violations across all public and authenticated pages in light and dark modes.
- Full keyboard-only workflow navigation, visible focus indicators, skip link, logical tab ordering, and verified $\ge 4.5:1$ text contrast.

#### Cloudflare Free Tier Optimization
- Server Worker script: 370.03 kB gzipped (87.7% safety margin under the 3 MB compressed ceiling).
- Average sub-3ms edge CPU time on Cloudflare Workers Free Tier.
