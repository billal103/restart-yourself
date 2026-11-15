# Deployment Guide

This covers how the project actually deploys to Cloudflare, free-tier, per the
project's $0 cost-control rule. The repository is pushed to
`https://github.com/billal103/restart-yourself` and connected to a Cloudflare
Workers & Pages project named `restart-yourself`, deploying on every push to `main`.

## How this actually deploys

Cloudflare's current "Workers & Pages" product deploys everything — including static
sites — as a **Worker with static assets**, via `wrangler deploy`, rather than the
older, separate "Pages" product's dashboard-only build settings (framework
preset/output directory). This repo is configured for that:

- **`wrangler.jsonc`** — `{ "assets": { "directory": "./dist", "not_found_handling":
  "single-page-application" } }`. The `not_found_handling` setting is what makes a
  client-side-routed SPA (React Router here) work as static files: any request that
  doesn't match a real file in `dist/` (e.g. `/dashboard/stories`, loaded directly or
  refreshed) falls back to `index.html`, which lets React Router take over.
- **No `public/_redirects` file** — that mechanism belongs to the older, classic Pages
  product. Cloudflare's Workers-assets runtime also recognizes `_redirects`, and having
  both it and `not_found_handling: "single-page-application"` active at once created a
  genuine redirect loop (`/` → `/index.html` → matches `/*` again → loop), which failed
  the very first real deploy attempt with `Invalid _redirects configuration: Infinite
  loop detected`. Fixed by removing the file and keeping only the `wrangler.jsonc`
  setting.
- **Cloudflare's own Git-connected build pipeline** does the actual deploying —
  configured once via the dashboard (Workers & Pages → the `restart-yourself` project
  → connected to this GitHub repo), it runs `npm run build` then `npx wrangler deploy`
  on every push to `main`, visible under that project's **Deployments** tab.
  `.github/workflows/ci.yml` only runs tests (`tsc`, `oxlint`, Vitest, the PGlite
  suite, Playwright) — it does **not** also deploy, deliberately: an earlier version
  of this file had a second deploy job via `cloudflare/pages-action`, which targets the
  classic Pages API and would have double-deployed through two incompatible paths
  against a project that is actually a Worker, not a classic Pages site.

## Environment variables (optional — real backend vs. mock data)

Set under the Cloudflare project's **Settings → Environment variables** (Production):

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — from a real Supabase project (see
  `docs/SUPABASE_SETUP.md`). Leave unset to deploy the fully-functional mock-data
  frontend — the app is designed to work either way, same as running it locally.

## Manual deployment (no Git integration)

If you'd rather deploy directly from your machine once, with Wrangler installed:

```powershell
npm run build
npx wrangler deploy
```

This asks you to log in to Cloudflare interactively the first time (`npx wrangler
login`), then uploads `dist/` per `wrangler.jsonc`'s config — useful for a one-off
deploy, or to confirm changes locally before pushing.

## Backend deployment

There is no separate "deploy" step for the backend the way there is for the frontend —
a Supabase project is created once (`docs/SUPABASE_SETUP.md`, Option B), and schema
changes after that are pushed with `npx supabase db push` whenever new migrations are
added to `supabase/migrations/`. This is not currently automated in CI, deliberately:
running `db push` automatically on every merge to `main` would apply schema changes to
production without a human reviewing them first, which is a bigger risk than the
convenience is worth for a project this size. Run it manually, deliberately, after
reviewing the migration file being added.

## What CI does not do

- It does not run `supabase test db` (the pgTAP suite) — that needs a real
  Supabase/Docker stack, which GitHub's hosted runners don't have pre-configured
  without additional setup this project hasn't added. `npm run test:db` (PGlite)
  covers materially the same ground and does run in CI.
- It does not deploy Edge Functions — none exist in this project.
- It does not run a Lighthouse/performance budget check — see the performance review
  notes in `docs/PROJECT_PROGRESS.md` for what was checked manually instead.
