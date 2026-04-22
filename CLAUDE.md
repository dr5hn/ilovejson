# ILoveJSON — Claude Code Guide

## Stack

- **Framework:** Next.js 16 (Pages Router, Turbopack)
- **React:** 19
- **Language:** JavaScript/JSX throughout (`pages/`, `src/`). No `.ts`/`.tsx` source files.
- **Styling:** Tailwind CSS 4
- **Node:** >=22.0.0

## Build & Deploy

```bash
npm ci          # install
npm run build   # Next.js production build (outputs to dist/)
npm start       # serve on port 3000
npm run dev     # dev server on port 3002
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | No | Sentry DSN for error tracking. Empty = disabled (local default). |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | No | Umami website ID for analytics. Empty = disabled (local default). |
| `NEXT_PUBLIC_UMAMI_URL` | No | Umami script URL (cloud or self-hosted). |

Both systems are **disabled by default** — if the env vars are absent, nothing phones home.

## Error tracking (Sentry)

- Initialized client-side in `sentry.client.config.js` (imported by `_app.js`)
- Initialized server-side via Next.js instrumentation hook (`instrumentation.js` → `sentry.server.config.js`)
- All API routes are wrapped with `withErrorTracking()` from `src/middleware/errorHandler.js`, which tags each event with `tool`, `route`, and `method`
- React render errors are caught by `src/components/ErrorBoundary.jsx` at the layout level
- Unhandled promise rejections are forwarded from `_app.js`
- **Privacy:** `sendDefaultPii: false`; request bodies (file contents) are stripped in `beforeSend`

## Analytics (Umami)

- Cookie-free, GDPR-compliant; no consent banner needed
- Script injected via `pages/_document.jsx` — only rendered when both env vars are set
- Client-side helpers in `src/utils/analytics.js`
- Events fired:
  - `tool_used` — after every successful conversion (`{ tool, inputSize, durationMs }`)
  - `conversion_failed` — on error (`{ tool, errorType }` — never the error message)
  - `download_file` — when user clicks Download (`{ tool }`)
- Page views tracked automatically by Umami script (query strings stripped)

## Key metrics to review weekly

1. Top 5 tools by `tool_used` event count
2. Conversion success rate per tool (`tool_used` vs `conversion_failed`)
3. Error rate in Sentry — new issues, regression count
4. Weekly active users (Umami dashboard)
5. Download rate relative to conversion count

## Path aliases

Defined in `jsconfig.json`:

| Alias | Resolves to |
|---|---|
| `@components/*` | `src/components/*` |
| `@constants/*` | `src/constants/*` |
| `@utils/*` | `src/utils/*` |
| `@middleware/*` | `src/middleware/*` |
