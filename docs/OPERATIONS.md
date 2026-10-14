# Resumint — Operations, Deployment & Free-Tier Capacity Guide

## 1. Cloudflare Workers Free Tier Budget & Limits

Resumint is designed strictly within Cloudflare's free tier budget. All operations, queries, and worker invocations respect the following verified limits (verified October 2026):

| Resource | Free Tier Limit | Resumint Production Footprint | Margin / Safety Factor |
| :--- | :--- | :--- | :--- |
| **Worker Script Size** | 3 MB compressed (10 MB raw) | **~370 kB compressed** | **> 87% headroom** |
| **Worker Requests** | 100,000 requests / day | ~10 requests per resume session | Capacity for 10,000 active sessions/day |
| **Worker CPU Time** | 10 ms CPU time / request | **1.2 ms - 3.8 ms** per heavy route | **> 60% headroom** under standard load |
| **D1 Database Reads** | 5,000,000 rows read / day | ~15-25 rows read / page view | Sub-0.1% of daily allowance |
| **D1 Database Writes** | 50,000 rows written / day | 1 write per debounced autosave | Batched & debounced at 1500ms |
| **D1 Storage** | 5 GB total database storage | ~15 kB per stored resume | Space for > 300,000 user resumes |
| **Static Asset Egress** | Unlimited (Workers platform) | Client assets cached immutably | Zero edge storage egress charges |

---

## 2. Deployment Guide

Resumint deploys automatically to Cloudflare Workers using GitHub Actions.

### 2.1 Production Secrets Configuration
Ensure the following GitHub Repository Secrets and Environment Secrets (`production`) are configured:

| Secret Name | Purpose | Example / Required Scopes |
| :--- | :--- | :--- |
| `CLOUDFLARE_API_TOKEN` | Auth for Wrangler CI deploy | Permissions: `Workers Scripts: Edit`, `D1: Edit` |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID | Visible in Cloudflare Dashboard URL |
| `BETTER_AUTH_SECRET` | 32-byte cryptographically random string | Generated via `openssl rand -hex 32` |
| `BETTER_AUTH_URL` | Canonical origin of production site | `https://resumint.dev` (or `*.workers.dev`) |
| `SHARE_COOKIE_SECRET` | 32-byte secret for share cookies | Generated via `openssl rand -hex 32` |

To set worker runtime secrets directly via Wrangler CLI:
```bash
npx wrangler secret put BETTER_AUTH_SECRET
npx wrangler secret put BETTER_AUTH_URL
npx wrangler secret put SHARE_COOKIE_SECRET
```

### 2.2 Manual Deployment Workflow
If deploying manually from a terminal:
```bash
# 1. Run full validation checks
npm run lint
npm run typecheck
npm test
npm run test:worker

# 2. Build production assets
npm run build

# 3. Apply remote D1 database migrations
npx wrangler d1 migrations apply DB --remote

# 4. Deploy worker bundle and static assets
npx wrangler deploy
```

---

## 3. Rollback Procedure

Because Cloudflare D1 migrations are forward-only, rollbacks require clear procedural distinction between worker code rollbacks and database schema rollbacks:

### 3.1 Code-Only Rollback
If a regression is purely in worker code or client assets:
```bash
# Redeploy the previous known-good deployment via Wrangler:
npx wrangler rollback --message "Reverting to previous stable build"
```
Or via GitHub Actions: Trigger workflow dispatch or revert the git commit on `main`.

### 3.2 Database Rollback Plan
- D1 migrations must always be backward-compatible (additive only: add columns with `DEFAULT`, create new tables, never drop columns in the same release).
- If a migration was destructive or malformed: Restore database state using **D1 Time Travel** or manual backup (see Section 4).

---

## 4. D1 Database Backups & Time Travel

### 4.1 Automated Point-in-Time Recovery (Time Travel)
Cloudflare D1 includes **Time Travel** on the Free tier, retaining database changes for up to **7 days** (30 days on Paid plans).
To inspect database state at a previous point in time:
```bash
# List available time travel bookmarks
npx wrangler d1 time-travel info DB

# Restore database to a specific bookmark or timestamp
npx wrangler d1 time-travel restore DB --timestamp="2026-10-14T12:00:00Z"
```

### 4.2 Manual Offline SQL Export
Before executing high-impact schema migrations, generate an explicit SQL snapshot:
```bash
# Export remote database to a local SQL file
npx wrangler d1 export DB --remote --output="./backups/backup-$(date +%Y%m%d-%H%M%S).sql"

# To import/restore a manual backup:
npx wrangler d1 execute DB --remote --file="./backups/backup-filename.sql"
```

---

## 5. Maintenance & Lazy Housekeeping

To prevent unbounded table growth while staying strictly within the 50,000 daily write budget, Resumint provides an automated lazy cleanup routine (`cleanupExpiredSessions`):

1. **Stale Session Deletion:** Expired auth sessions (`expiresAt < CURRENT_TIMESTAMP`) are pruned in small batches of 50.
2. **Expired Share Protection:** Expired share links are rendered inactive on read without needing eager eager delete operations.
3. **Execution Pattern:** Lazy cleanup is triggered opportunistically on low-traffic maintenance routes (`/health` or `/settings`) or via a scheduled Cloudflare Cron Trigger:

```json
// wrangler.json (Scheduled Worker Trigger)
{
  "triggers": {
    "crons": ["0 3 * * *"] // Executes daily at 03:00 UTC
  }
}
```

---

## 6. Observability & Monitoring

### 6.1 Real-Time Tail Logs
Inspect production requests, status codes, and exceptions in real time without exposing PII:
```bash
npx wrangler tail --format=pretty
```

### 6.2 Health Check Endpoint
Resumint provides a lightweight, unauthenticated health probe at `/health`:
- **URL:** `https://your-domain.workers.dev/health`
- **Method:** `GET`
- **Response:** `200 OK` with `{ status: "healthy", timestamp: ... }`
- **Database Probe:** Executes `SELECT 1` on D1. If D1 is unreachable, returns `503 Service Unavailable`.
- **Zero Sensitive Data:** Never leaks internal table names, connection strings, or stack traces.

---

## 7. Free-Tier Alert Thresholds & Remediation

Monitor Cloudflare dashboard metrics weekly. If usage reaches the following thresholds, take proactive action:

| Metric | Warning Threshold (80%) | Remediation Action |
| :--- | :--- | :--- |
| **Worker Requests** | 80,000 / day | Enable Cloudflare Web Application Firewall (WAF) rate limiting on unauthenticated routes; increase browser caching. |
| **D1 Writes** | 40,000 / day | Increase client editor autosave debounce delay from 1500ms to 2500ms; coalesce in-flight updates. |
| **D1 Storage** | 4 GB | Enforce 20-resume quota per user; run session pruning batch; archive dormant guest snapshots. |
| **Worker CPU Time** | 8 ms average | Profile heavy JSON parsing in loaders; ensure all keyword regex evaluations remain memoized client-side. |
