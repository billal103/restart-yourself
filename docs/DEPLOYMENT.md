# Deployment Guide

This covers the GitHub Actions CI/CD pipeline and how to turn on real deployment to
Cloudflare Pages — all free-tier, per the project's $0 cost-control rule. **Nothing has
been deployed from this sandbox**: there is no GitHub remote, no Cloudflare account,
and no cloud credentials available here. Everything below is the configuration that
makes a real deployment possible once you (not this session) have those accounts — it
has been written and is syntactically ready, but the actual deploy step has never run.

## What's already in place

- **`.github/workflows/ci.yml`** — a `test` job that runs on every push and pull
  request: `npx tsc -b`, `npx oxlint`, `npx vitest run`, `npm run test:db` (the real
  Postgres suite — no Docker needed in CI either), `npm run build`, and the full
  Playwright suite (installing Chromium first). This is the exact same sequence used
  throughout development, so CI failing means something regressed, not that CI is
  checking something different from what was tested locally.
- **A `deploy` job in the same workflow**, gated by `needs: test` and
  `if: github.ref == 'refs/heads/main' && github.event_name == 'push'` — it only runs
  after `test` passes, only on a push to `main`, never on a pull request. Until the
  secrets below are set, this job fails immediately with a clear "missing
  credential"-type error from the Cloudflare action — it does not silently skip or do
  something unexpected.
- **`public/_redirects`** — `/* /index.html 200`. This is required for any
  client-side-routed SPA (React Router here) deployed as static files: without it,
  directly loading or refreshing a route like `/dashboard/stories` 404s, because
  there's no actual `stories` file on the server — only `index.html`, which then lets
  React Router take over. Cloudflare Pages reads this file automatically.

## One-time setup to enable real deployment

1. **Push this repository to GitHub** (it has no remote configured yet in this
   sandbox).
2. **Create a Cloudflare Pages project** — easiest via the Cloudflare dashboard
   (Workers & Pages → Create → Pages → Connect to Git), or via
   `npx wrangler pages project create <name>` if you'd rather not connect Git
   integration directly (the GitHub Action below handles deploys either way).
   - Build command: `npm run build`
   - Build output directory: `dist`
   - If you connect Cloudflare's own Git integration instead of using the GitHub
     Action, disable one of the two — running both would deploy twice per push.
3. **Add repository secrets** (Settings → Secrets and variables → Actions → Secrets):
   - `CLOUDFLARE_API_TOKEN` — create one at
     My Profile → API Tokens → Create Token → "Edit Cloudflare Pages" template.
   - `CLOUDFLARE_ACCOUNT_ID` — found on any Cloudflare dashboard page's right sidebar.
4. **Add repository variables** (same screen, "Variables" tab — these aren't secret,
   but keeping them out of the workflow file makes them editable without a code
   change):
   - `CLOUDFLARE_PAGES_PROJECT` — the Pages project name from step 2.
   - `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — from a real Supabase project (see
     `docs/SUPABASE_SETUP.md`). Leave these unset to deploy the mock-data frontend —
     the app is designed to work either way, same as running it locally.
5. Push to `main`. The `deploy` job now has everything it needs.

## Manual deployment (no GitHub Actions)

If you'd rather deploy directly from your machine once, with Wrangler installed:

```powershell
npm run build
npx wrangler pages deploy dist --project-name=<your-project-name>
```

This asks you to log in to Cloudflare interactively the first time (`npx wrangler
login`), then uploads `dist/` directly — useful for a one-off deploy or to confirm the
Cloudflare side is set up correctly before wiring up CI.

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
