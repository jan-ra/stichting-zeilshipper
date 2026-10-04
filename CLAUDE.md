# Stichting Zeilshipper

Static Vite/React site (`site/`) built from a Payload CMS (`cms/`, Next.js, SQLite on Fly).
Architecture and ops: [README.md](README.md), [infra/DEVOPS-PLAN.md](infra/DEVOPS-PLAN.md).

## Ground rules

- **Production is only changed by merging to `main`.** `.github/workflows/release.yml`
  backs up the DB, deploys the CMS (migrations at boot), then moves the `release` branch,
  which is what Cloudflare builds. Never run `flyctl deploy`, `flyctl secrets`, push to
  `main`/`release`, or merge PRs — the maintainer merges.
- **Prod content is the source of truth.** Never overwrite the prod DB or write to it
  outside a migration. Content changes that must ship with code go in a **data
  migration** (below), never in a manual edit.
- Reading prod is fine: `npm run pull` (snapshot + media, read-only).
- No emojis in code, UI strings or commits.

## The loop

```sh
npm run pull -- --snapshot-only   # fresh prod snapshot (if LATEST is > 1 day old)
npm run dev                       # local stack on the pulled DB: CMS :3001, site :4173
npm run verify -- --quick         # while iterating: typecheck, unit tests, migration guard
npm run verify                    # before a PR: + migrations on prod snapshot, CMS build,
                                  #   site build on that data, 80 browser checks
npm run rehearse                  # before a PR that touches cms/src/migrations, payload.config.ts,
                                  #   cms/Dockerfile or the entrypoint: prod image on a prod copy
                                  #   + rollback leg against the image live on Fly
```

Paste `.verify/report.md` (and `.verify/rehearsal-report.md`) into the PR. Look at the
screenshots in `.verify/screenshots/` for pages the change touches — the tests catch
errors, not ugliness.

## Database changes

- **Schema**: edit `cms/src/collections|globals`, then `cd cms && npm run migrate:create <name>`.
  Read the generated SQL. It must be additive (ADD COLUMN / CREATE TABLE): rollback to
  the previous image is only free while that holds. The migration guard fails on
  DROP / table rebuilds / deletes unless the PR carries the `destructive-migration`
  label (CI) or `ALLOW_DESTRUCTIVE_MIGRATION=1` (local) — use expand/contract instead.
- **Data** (content that must change with a release): a hand-written migration in
  `cms/src/migrations/` using the local API with `req` (so it is inside the migration's
  transaction) and `context: { skipRebuild: true }`. Guard every change on the value
  you expect to find, so it never clobbers a later editor edit and is a no-op on a
  fresh DB. Register it in `src/migrations/index.ts`. Example:
  `20260927_200000_content_youtube_videos.ts`.
- `db-diff` (`cms/scripts/ci/db-diff.mjs`) fails verify if any prod row disappears;
  intended deletions need `ALLOW_DATA_LOSS=1` and a line in the PR saying why.
- Transactions are on for `payload migrate` only (see the comment in `payload.config.ts`).

## Tickets

Work arrives as GitHub issues on the project board (users/jan-ra/projects/5). Use the
`/ticket <number>` skill: it moves the card, branches, implements, verifies, opens the
PR with `Closes #n`, and moves the card to In review.

## Rollback

Actions → Rollback → pick a `release/*` tag. Code-only by default (data kept); restoring
the DB backup is an explicit opt-in. See infra/DEVOPS-PLAN.md § Rollback.
