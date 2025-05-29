# RoasFlow – Production Deployment Guide

This document walks you through everything needed to deploy **RoasFlow** to a production environment securely and reliably.

---

## 1. Architecture Overview

| Layer | Technology | Purpose |
|-------|------------|---------|
| Front-end / SSR | Next.js 15 (App Router, React 18) | UI + Server Components |
| AuthN/AuthZ | Clerk | User & session management |
| Video | Stream.io Video SDK | Real-time calls & recordings |
| Storage (optional)* | Postgres / Prisma | Persistent meeting metadata |
| CDN / Hosting | Vercel | Edge-optimised deployment |
| Monitoring | Sentry, Vercel Analytics, Speed Insights | Error & performance telemetry |
| CI/CD | GitHub Actions | Lint → Test → Build → Deploy |

\* RoasFlow is stateless by default; integrate a DB if you persist extra data.

---

## 2. Environment & Secrets

### 2.1 Variables

Add **all** keys to your cloud provider’s secret manager **and** to GitHub repository secrets for CI:

| Variable | Example | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Set automatically by platform |
| `NEXT_PUBLIC_APP_URL` | `https://app.roasflow.com` | Canonical base URL |
| Clerk |  |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_***` | Public key |
| `CLERK_SECRET_KEY` | `sk_live_***` | Server key |
| Stream |  |
| `NEXT_PUBLIC_STREAM_API_KEY` | `abcd1234` | Public key |
| `STREAM_SECRET_KEY` | `efgh5678` | Server secret |
| Monitoring |  |
| `NEXT_PUBLIC_SENTRY_DSN` | `https://xyz.ingest.sentry.io/123` | Client & server DSN |

Optional:
```
# Feature flags
NEXT_PUBLIC_ENABLE_RECORDINGS=true
NEXT_PUBLIC_ENABLE_WEBINAR_MODE=true
```

### 2.2 Validation

`lib/env.ts` uses **zod** to fail fast if variables are missing. Deployment will abort with a clear message.

---

## 3. Security Configuration

1. **Security headers**  
   Automatically injected via `next.config.mjs`:
   - Content-Security-Policy (strict, with Stream/Clerk whitelists)
   - HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
2. **Remove console statements** (`compiler.removeConsole`) in production (errors/warns kept).
3. **Rate limiting / Abuse** – implement API guards if you expose custom endpoints.
4. **Guest tokens** – issued server-side (`actions/stream.actions.ts`); expire in 1 h.
5. **Secrets scope** – never expose `STREAM_SECRET_KEY`, `CLERK_SECRET_KEY` to client.

---

## 4. Monitoring & Observability

| Tool | What it covers | Location |
|------|----------------|----------|
| **Sentry** | JS errors, API exceptions, performance | `sentry.[client|server].config.ts` |
| **Vercel Analytics** | Traffic, custom events | `lib/analytics.ts` |
| **Speed Insights** | Core Web Vitals | `<Layout>` |
| **CI scans** | ESLint, CodeQL, Snyk | `.github/workflows/ci.yml` |

Make sure `NEXT_PUBLIC_SENTRY_DSN` is set **before** first deploy or Sentry initialisation will be skipped.

---

## 5. Deployment Pipeline

### 5.1 CI Workflow (`.github/workflows/ci.yml`)

1. **Lint & Type-check**  
2. **Unit tests** (`jest`) + **coverage**  
3. **Build** (`next build`)  
4. **Security scans** (CodeQL + Snyk)  
5. **Deploy**  
   - `develop` → dev environment (`dev.roasflow.com`)  
   - `main` → staging (`staging.roasflow.com`)  
   - Manual **workflow-dispatch** → production (`roasflow.com`)  
6. Slack & GitHub Release notifications on success.

### 5.2 Vercel Project Settings

| Setting | Value |
|---------|-------|
| **Framework Preset** | Next.js |
| **Root Directory** | `/` |
| **Build Command** | `npm run build` |
| **Output Dir** | `.next` |
| **Install Command** | `npm ci` |
| **Environment Variables** | add table from §2 |

> For self-hosting use Docker: `FROM node:18-alpine`, `next build && next start`.

---

## 6. Deployment Steps (Manual)

1. **Merge to `main`** – triggers staging build.
2. **Smoke test staging**:  
   - `https://staging.roasflow.com`  
   - Run Cypress smoke suite: `npm run test:e2e`.
3. **Promote** `workflow-dispatch` → choose `production`.  
4. **Vercel** promotes same build hash; zero-downtime switch.

Rollback:  
`vercel --prod --force <previous_deployment_url>` or select previous deployment in Vercel UI.

---

## 7. Post-Deployment Checklist

| 🔒 Security | 🔍 Monitoring | 🚀 Functionality | 📈 Performance |
|-------------|--------------|-----------------|----------------|
| [ ] All secrets present & rotated | [ ] Sentry releases visible | [ ] Sign-in & sign-up | [ ] <200 ms TTFB |
| [ ] HTTPS + HSTS | [ ] No error spikes in first 30 min | [ ] Create / join meeting | [ ] LCP <2.5 s |
| [ ] CSP no violations in console | [ ] Core Web Vitals within budget | [ ] Recording & playback | [ ] CLS <0.1 |
| [ ] No `console.error` in logs | [ ] Analytics events flowing | [ ] Screen share | [ ] Bundle <300 kB |
| [ ] Robots & sitemap accessible | [ ] Speed Insights stable | [ ] Guest link join | [ ] Images WebP/AVIF |

---

## 8. Disaster Recovery & Maintenance

| Scenario | Action |
|----------|--------|
| **Bad deploy** | Re-deploy previous Vercel build (`Rollback`). |
| **Secret leaked** | Rotate key, update Vercel + GitHub secrets, invalidate sessions. |
| **Clerk / Stream outage** | Automatic retries + user messaging; monitor status pages. |
| **Data migration** | Use Prisma migrations; run in staging first. |
| **Traffic spike** | Vercel auto-scales; monitor Sentry & Analytics for latency. |

---

## 9. Frequently Asked Questions

**Q:** *Where do I add new env vars?*  
**A:** Update `.env.example`, `lib/env.ts` schema, Vercel Project → Settings → Environment Variables, and GitHub secrets.

**Q:** *Can I use Docker?*  
**A:** Yes. Build with `next build`, serve with `next start` behind Nginx (set same security headers).

**Q:** *How do I verify CSP?*  
**A:** Browser DevTools → Network → CSP Violations tab (or Sentry’s CSP reports).

---

### ✅ You are now ready to launch RoasFlow in production!

