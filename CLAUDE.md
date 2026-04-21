# CLAUDE.md — ilovejson codebase guide

## Tech stack

- **Next.js 16** (Pages Router) + **React 19** + **Tailwind CSS 4**
- **NextAuth.js v4** for authentication
- **Prisma v7** (client generated to `src/generated/prisma/`, **not** `@prisma/client`)
- **nodemailer** for transactional email (magic links)

## Path aliases (jsconfig.json + webpack)

| Alias | Resolves to |
|---|---|
| `@components/*` | `src/components/*` |
| `@constants/*` | `src/constants/*` |
| `@utils/*` | `src/utils/*` |
| `@lib/*` | `src/lib/*` |

## Authentication

Authentication is **active**. It is built on NextAuth v4 and controlled by environment variables — if env vars are absent the relevant providers silently skip and the app behaves identically to the pre-auth state.

### Providers

Three sign-in methods (order on the sign-in page matches this list):

1. **Email magic link** — enabled when `EMAIL_SERVER` + `EMAIL_FROM` are set. In local dev without those vars set, a dev transport is used that prints the magic link to the server console.
2. **Google OAuth** — enabled when `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` are set.
3. **GitHub OAuth** — enabled when `GITHUB_ID` + `GITHUB_SECRET` are set.

Microsoft / Azure AD is **not** supported and not in the codebase.

### Auth files

| File | Purpose |
|---|---|
| `src/lib/auth.js` | `authOptions` — providers, adapter, session strategy |
| `src/lib/prisma.js` | Prisma singleton (imports from `src/generated/prisma/`) |
| `pages/api/auth/[...nextauth].js` | NextAuth catch-all API route |
| `pages/auth/signin.jsx` | Custom sign-in page |

### Session

Uses database sessions (via `@auth/prisma-adapter`) when `DATABASE_URL` is set, otherwise falls back to JWT.

## Prisma

### Important: Prisma v7 changes

- The Prisma client **must be imported** from `src/generated/prisma/`, not from `@prisma/client`.
- The datasource `url` property is gone from `prisma/schema.prisma`. Prisma v7 requires a **driver adapter** — the app uses `@prisma/adapter-pg` with the `pg` pool:
  ```js
  import { PrismaPg } from '@prisma/adapter-pg'
  import pg from 'pg'
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  new PrismaClient({ adapter })
  ```
- CLI config lives in `prisma.config.ts`. The `datasource.url` must be set there for migrations (not in `schema.prisma`, not as `migrate.url`):
  ```ts
  export default defineConfig({
    earlyAccess: true,
    schema: 'prisma/schema.prisma',
    datasource: { url: process.env.DATABASE_URL },
  })
  ```

### Regenerating the client

```bash
npx prisma@7.2.0 generate
```

### Running migrations (production)

```bash
DATABASE_URL=... npx prisma@7.2.0 migrate deploy
```

## File organization

| Directory | Purpose | Purged? |
|---|---|---|
| `public/uploads/{tool}/` | Temporary uploaded input files | Yes — 30 min (crontab.conf) |
| `public/downloads/{tool}/` | Temporary converted output files | Yes — 30 min (crontab.conf) |
| `public/saved/{userId}/` | User-saved permanent files | **Never** — excluded from cron |

The cron pattern uses `-mindepth 2` to skip the tool subdirectory itself, and targets only `uploads/` and `downloads/` — `saved/` is never matched.

## Saved Files

Signed-in users can click **Save** on any conversion result. This:
1. Copies the output file from `public/downloads/{tool}/` to `public/saved/{userId}/`
2. Creates a `SavedFile` row in the database (`type` field holds the tool slug, `expiresAt` is set to `9999-12-31` as a "never expires" sentinel)
3. Per-user cap: **100 MB**. Exceeding it returns HTTP 413 with a clear error message.

## Conversion history

Every successful conversion, when a session exists, silently creates a `Conversion` row via `src/utils/logConversion.js`. Failures are logged and do not affect the response.

## Dashboard

All dashboard pages live under `pages/dashboard/` and require a valid session (redirect to `/auth/signin` otherwise).

| Page | Path | Purpose |
|---|---|---|
| Overview | `/dashboard` | Conversion count, top tool, storage usage, recent saves |
| Saved files | `/dashboard/files` | Full file manager with rename/delete |
| History | `/dashboard/history` | Passive conversion log, paginated |
| Settings | `/dashboard/settings` | Connected providers, storage, delete account |

## Local dev setup

1. Copy `.env.example` → `.env.local` and fill in values.
2. For database: run Postgres locally or use a free tier (Neon, Supabase, Railway).
3. For email: leave `EMAIL_SERVER` blank — magic links are logged to the console.
4. `npm run dev` — runs on port 3002.

To run migrations:
```bash
DATABASE_URL=your-url npx prisma@7.2.0 migrate dev
```
