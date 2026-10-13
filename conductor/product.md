# Resumint - Product Definition

## Vision

Resumint is a modern, high-performance online resume builder inspired by Kickresume. It prioritizes craft, lightning-fast client-side reactivity, beautiful typography, ATS-friendly templates, and a zero-friction guest-first editing experience.

## Target Audience

Job seekers, software engineers, creatives, and professionals who need an accurate, elegant, and exportable resume without intrusive paywalls or complicated sign-up hurdles.

## Core Features

- **Guest-First Editor**: Build a resume immediately from the landing page without signing up first.
- **In-Place Seamless Auth**: When saving or sharing, an inline modal handles sign-up/login and claims the draft in Cloudflare D1 without reloading or losing state.
- **ATS-Friendly Templates**: Real semantic HTML, strict typography hierarchy, customizable accent colors, margins, and section order.
- **Zero-Latency Client-Side PDF Export**: Print-safe stylesheet and `@page` rules optimized for standard A4 and US Letter without serverless CPU overhead.
- **Shareable Links**: Optional public `/r/:slug` URLs with view counts, expiry, and noindex privacy toggles.
- **Rule-Based ATS Checker**: Instant feedback on structure, action verbs, quantified metrics, and formatting.
- **Version Snapshots**: Ability to restore past resume revisions (capped at last 20 revisions).

## Non-Goals (MVP)

- No AI text generation or cover letter builder in MVP.
- No server-side headless browser PDF rendering (constrained by Cloudflare Worker free tier 10ms CPU limits).
