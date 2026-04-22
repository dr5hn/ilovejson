# ILoveJSON — Claude Code Guide

## Stack

- **Framework:** Next.js 16 (Pages Router, Turbopack)
- **React:** 19
- **Language:** JavaScript/JSX throughout (`pages/`, `src/`). TypeScript is a dev dependency for type-checking tooling only — no `.ts`/`.tsx` source files.
- **Styling:** Tailwind CSS 4
- **Node:** >=22.0.0

## Build & Deploy

```bash
npm ci          # install
npm run lint    # ESLint — must pass before build
npm run build   # Next.js production build (outputs to dist/)
npm start       # serve on port 3000
npm run dev     # dev server on port 3002
```

### ESLint

ESLint 9 flat config (`eslint.config.js`) using `eslint-config-next`. The old `.eslintrc.json` and `.eslintignore` have been removed.

`npm run lint` runs `eslint .` and is a **required CI gate** — PRs cannot merge with lint errors. Warnings are tracked but not blocking.

Known warnings (tracked, not blocking):
- `import/no-anonymous-default-export` — all `pages/api/` route handlers use anonymous arrow exports (Next.js convention)
- `@next/next/no-img-element` — two `<img>` tags in `src/components/layout.jsx`; switching to `<Image />` is a separate task

### TypeScript

No source `.ts`/`.tsx` files exist. Next.js type-checks the project via `jsconfig.json` path aliases. TypeScript as a build check is active (no `ignoreBuildErrors` override).

### CI

`.github/workflows/build.yml` runs on PRs to `main`:
1. `npm ci`
2. `npm run lint` (blocking)
3. `npm run build`

No OOM issues observed post-v2.0.0 cleanup (~50 MB of deps removed). `NODE_OPTIONS` bump is not needed on ubuntu-latest with Node 22.
