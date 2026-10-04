# DevOps runbook & migration model

This is the operational companion to [README.md](README.md) (which covers first-time
infra provisioning). It explains **how changes flow from your laptop to production
safely**, with the database being the thing we most carefully protect.

Status legend: ✅ implemented · 🔜 planned (see [Roadmap](#roadmap))

---

## The one mental model to hold

There are **two completely different kinds of "database change"**, and they are
handled in opposite ways:

| | **Schema** (structure) | **Content** (rows) |
|---|---|---|
| Examples | add a field to Ships, add a collection | a blog post, a ship's position, a partner logo |
| Source of truth | **code** (`src/collections/*`, `src/globals/*`) | **the production database** |
| How it reaches prod | committed **migration files** → applied on deploy | edited in the admin UI; **never** seeded over |
| Local tool | `npm run migrate:create` then `npm run migrate` | `npm run pull` (copy prod down) |
| Danger | forgetting to generate a migration | running a **seed/import** script against prod |

Golden rules:
1. **Schema travels only as committed migrations.** `push` (dev auto-sync) is OFF
   ([payload.config.ts](../cms/payload.config.ts)) so local can never silently drift from prod.
2. **Never seed/import into prod.** `seed.ts` and `import-ships.mjs` wipe-and-reinsert;
   they are local-bootstrap tools. Prod content lives in the admin UI + nightly backups.

---

## Daily local workflow ✅

Your laptop **is** the staging environment — an exact copy of prod.

```sh
npm run pull      # (repo root) prod DB snapshot + media → local, read-only against prod
npm run dev       # the full stack (CMS + site) on that copy
npm run verify    # the gate before any PR (see below)
```

`npm run pull` takes an online `sqlite3 .backup` on the Fly machine (consistent even while
someone is saving), keeps it read-only under `cms/data/snapshots/` (newest 10, `LATEST`
points at the current one) and copies it over `cms/data/payload.db` (the old file is kept
as `.bak-<stamp>`). `--snapshot-only` leaves your working DB alone.

### Verify and rehearse

| | `npm run verify` | `npm run rehearse` |
|---|---|---|
| When | every PR | PRs touching migrations, `payload.config.ts`, Dockerfile, entrypoint |
| Typecheck, unit tests, migration guard (drift + destructive) | yes | — |
| Pending migrations on a copy of the prod snapshot; schema == fresh-from-migrations; no row lost (`db-diff`) | yes | yes, inside the real image |
| CMS | `next build` + `next start` | the production Docker image through its entrypoint |
| Transactions + concurrent writes probe | — | yes |
| Site build on that data + browser smoke tests (nl/en, desktop/mobile) | yes | yes |
| Rollback leg: the image **live on Fly now** booted on the migrated DB | — | yes |

Both write `.verify/report.md` (pasted into the PR) and screenshots under `.verify/`.
`npm run verify -- --quick` is the fast inner loop; `--ci` is what GitHub runs on PRs
(no prod data there, by design).

---

## Making a schema change ✅

Whenever you change a **field or collection** in `src/collections` / `src/globals`:

```sh
cd cms
npm run migrate:create   # name it, e.g. add_ship_flag → writes src/migrations/<ts>_add_ship_flag.{ts,json}
npm run migrate          # apply locally = exact preview of what prod will do
git add src/migrations && git commit ...
```

- The generated `.ts` is human-readable SQL (`ALTER TABLE … ADD COLUMN …`). **Read it**
  before committing — it should be additive. A rename shows up as drop+add (data loss);
  if you see that, hand-edit the migration to a true rename.
- Commit **both** the `.ts` and the `.json` snapshot (the `.json` is how the next
  `migrate:create` computes its diff). `index.ts` is auto-updated — commit it too.
- On deploy, the container runs `payload migrate` at boot and applies only the new
  delta to prod, **preserving all existing data**.

> Verified: a test `ALTER TABLE … ADD COLUMN` applied to a copy of the live DB in 5ms
> with all 190 ships intact — no table recreation.

---

## How production runs migrations ✅

Fly release VMs don't mount app volumes, so migrations can't run there. Instead the
**app container migrates itself at boot** ([docker-entrypoint.sh](../cms/docker-entrypoint.sh)):

```
payload migrate   →   next start
```

- Env comes from Fly secrets (no `.env` in prod).
- Nothing pending → fast no-op. A deploy carrying a new migration → applies the delta.
- Each migration runs **in a transaction** and commits or rolls back as a whole.
  The SQLite adapter only does this when `transactionOptions` is set; before 2026-09 it
  was not, and an aborted migration write persisted (proven by the rehearsal probe).
  Transactions are enabled for `payload migrate` only — at runtime libsql's
  per-transaction connections lack the busy timeout and concurrent saves fail with
  SQLITE_BUSY. The server runs with WAL + a 5 s busy timeout instead. See the comment in
  [payload.config.ts](../cms/payload.config.ts).
- A failed migration exits non-zero → health check never passes → the release workflow
  redeploys the previous image. The DB is unchanged (the transaction rolled back).
- **Fail-fast guard:** the entrypoint refuses to start if the DB still carries the
  dev-push marker (`dev`/-1), because in that state `payload migrate` would hit a
  no-TTY prompt and *silently skip* migrations. This forces you to run adoption
  before the first deploy (see below) rather than quietly serving a stale schema.
- The runtime image ships the full `node_modules` (dev deps included) because the
  Payload CLI needs `tsx` to load the TS config/migrations — hence `next start`
  rather than the minimized standalone bundle. Tradeoff: the image is ~1.6 GB. That's
  fine for infrequent deploys to a single machine; if it ever matters, the slim path
  is to precompile config+migrations to JS and drop the dev deps.

---

## Production adoption — ✅ DONE (2026-07 / recorded for reference)

Prod's schema was originally built by dev `push`, so its `payload_migrations` table
had a `dev`/`-1` marker instead of a record of the baseline migration. A drift check
against the baseline also found prod was **9 columns behind** the code — features that
dev-push had added but were never deployed:

| table | columns added |
|---|---|
| `ships` | `mmsi`, `auto_track`, `position_updated_at` (AIS tracking) |
| `users` | `enable_a_p_i_key`, `api_key`, `api_key_index` (API-key auth) |
| `blog_posts` | `cover_image_focus` |
| `unesco_page_locales` | `timeline_badge`, `timeline_title` |

Adoption (idempotent node script, prod has no `sqlite3` CLI) did two things, **without
touching content** (all `ADD COLUMN` are additive; existing rows kept their data):

1. Added those 9 columns so prod's schema equals the baseline (verified: column sets
   identical across all 63 tables).
2. Removed the `dev`/-1 marker and recorded `20260717_205802_initial` as applied.

Verified afterward from a fresh snapshot: schema == baseline, migration table = baseline
only, content intact (13 ships, 2 blog posts, 6 team members, 2 users, 50 media), and
`payload migrate` is a clean no-op — so the first migrate-on-boot deploy will no-op.

> If you ever stand up a *new* environment from a push-built DB, the reusable helper is
> [scripts/adopt-migrations.sh](../cms/scripts/adopt-migrations.sh) (bookkeeping only).
> A drifted DB additionally needs its missing columns added first — see the git history
> for the `adopt-prod.mjs` approach used here.

The same adoption already ran on the **local** DB. Restart any running `npm run dev` so
it loads the new `push:false` config.

---

## Ship positions live on R2, not in Payload ✅

Positions are machine-written and change nightly, so they are kept out of the CMS
database entirely. Two JSON objects on the media bucket carry them:

| Key | Written by | Read by |
|---|---|---|
| `data/ships-roster.json` | Ships `afterChange`/`afterDelete` hook ([publishShipRoster.ts](../cms/src/hooks/publishShipRoster.ts)), debounced 5 s | the nightly job |
| `data/positions.json` | [update-positions.yml](../.github/workflows/update-positions.yml), nightly 02:00 UTC | the browser at runtime, and the site build as a fallback snapshot |

Why it is shaped this way:

- The nightly job reads and writes **only R2**. It never calls Payload, so the Fly
  machine stays asleep and no site rebuild is triggered. Editing a ship in the CMS
  still reaches the tracker, via the roster hook.
- The SPA fetches `positions.json` on mount ([useShipPositions.js](../site/src/hooks/useShipPositions.js))
  and merges it over the baked ship data ([useShips.js](../site/src/hooks/useShips.js)).
  A new position is live within the 300 s cache TTL — no deploy.
- `load-from-payload.mjs` bakes a snapshot of the same file into `ships.json`, so the
  globe still renders if the runtime fetch fails. Failure degrades to stale positions,
  never to an empty map.
- `positions.json` keeps the **last 7 daily fixes** per ship under `history`, deduped on
  the AIS fix timestamp so a stationary ship does not flush the week's track. Selecting a
  ship draws that track on the globe and frames the camera around all of its points
  (`fitRoute` in [Fleet.jsx](../site/src/pages/Fleet.jsx), drawn by
  [ShipMarkers.jsx](../site/src/components/globe/ShipMarkers.jsx)) — so a ship with only
  one stored fix shows no line, which is why the backfill above matters.

**One-time bucket config:** the site fetches this cross-origin (images do not, being
`<img>` loads), so `zeilshipper-media` needs a CORS rule allowing `GET`/`HEAD` from the
site origin and `http://localhost:4173`. MinIO allows all origins by default, so local
works without setup.

**Seeding a new environment** (once, before the first nightly run):

```
cd cms
npm run publish-roster        # ships → data/ships-roster.json  (hook maintains it after this)
npm run backfill-positions    # database lat/lng → data/positions.json
```

Skipping the backfill leaves every ship unpositioned until MyShipTracking happens to
hear it — which for a boat that has not moved in months may be never. It fills gaps
only, so it is safe to re-run; `--force` overwrites from the database instead.

Testing the history logic without spending credits — note `--fixture=synthetic` writes
**fabricated** positions that drift from whatever is stored, so restore real data
afterwards:

```
npm run update-positions -- --fixture=synthetic --at=2026-08-01T02:00:00Z
npm run update-positions -- --fixture=synthetic --at=2026-08-02T02:00:00Z   # history grows
npm run update-positions -- --fixture=synthetic --at=2026-08-02T02:00:00Z   # same fix: no-op
npm run backfill-positions -- --force                                       # back to real data
```

---

## Release & rollback ✅

Merging a PR to `main` is the release button ([release.yml](../.github/workflows/release.yml)):

1. **Backup** — online `.backup` of the prod DB → R2 `releases/<stamp>-<sha>/payload.db`
   (outside the `db-backups/` lifecycle rule; kept until deleted by hand).
2. **CMS** — `flyctl deploy` if `cms/` changed since the last release. Migrations run at
   boot, each in a transaction. The workflow then checks every committed migration is
   recorded in prod and the API answers. On failure it redeploys the previous image.
3. **Site** — force-moves the `release` branch to the merged commit. Cloudflare Workers
   Builds watches `release`, not `main`, so the site is always built **after** the CMS
   it reads from is live. The workflow waits until `<meta name="release">` on the live
   site equals the commit, then smoke-tests the pages.
4. **Tag** — annotated `release/<utc>-<sha>` recording the new image, the previous image
   and the backup key.

CMS saves still rebuild the site through the deploy hook (built from `release`).

**Rollback** ([rollback.yml](../.github/workflows/rollback.yml), Actions → Rollback → Run):

- `to_release`: the tag to go back to. Redeploys its CMS image and points `release` at
  its commit. **Data is kept.** This is safe whenever the releases being undone only
  added columns — which the migration guard enforces, and `npm run rehearse` proves by
  booting the live image on the migrated DB.
- `restore_db_from` + `confirm=restore`: additionally restores that release's
  pre-release backup. **Discards content edits made since.** The current DB is backed up
  first, so this too can be undone.

The `release` branch and the GitHub `main` branch protection are the only manual pieces
of Cloudflare/GitHub config — see [README.md](README.md) § 3.

## Backups ✅

- Nightly `.backup` snapshot → R2 `db-backups/` ([backup-db.yml](../.github/workflows/backup-db.yml)).
  Meant to expire after 7 days via a bucket lifecycle rule — as of 2026-09 the rule is
  not active (55 objects), so add it in R2 → bucket → Settings → Object lifecycle rules.
- Pre-release backups → `releases/`, one per release, no expiry.
- Restore = the Rollback workflow's `restore_db_from`. Rehearse a restore locally by
  downloading a backup and `cp`-ing it to `cms/data/payload.db`.

---

## One-off data operations

| Task | Tool | Where it's safe to run |
|---|---|---|
| Seed full demo dataset | `npm run seed` | **local only** (wipes collections) |
| Import curated ships | `node scripts/import-ships.mjs` | 🔜 non-destructive upsert via a manual pipeline |
| Nightly AIS positions | [update-positions.yml](../.github/workflows/update-positions.yml) | GitHub Actions cron (prod) ✅ |
| Republish the tracking roster | `npm run publish-roster` | anywhere (read-only against Payload) |

---

## Roadmap

- ✅ **Ordered release pipeline**, rollback workflow, local verify/rehearse (2026-09).
- 🔜 **Runtime transactions.** Blocked on libsql applying the busy timeout to its
  per-transaction connections; `scripts/ci/concurrency-probe.ts contention` is the test
  that must pass with transactions on for the server.
- 🔜 **Prod guards** on `seed.ts` / `import-ships.mjs` (`ALLOW_DESTRUCTIVE=1`), and
  `import-ships` rewritten as a non-destructive upsert exposed as `workflow_dispatch`.
- 🔜 **Hardening**: populate `csrf` allowlist + scope `cors` in the Payload config.
- 🔜 **Retire the Payload position columns.** `ships.lat` / `lng` / `position_updated_at`
  are no longer read or written by anything — R2 owns positions now. Once the R2 path has
  a week of green nights in prod: drop the three fields from `Ships.ts`, `npm run
  migrate:create`, `npm run generate:types`, then delete the `position-bot` user, the
  `POSITION_BOT_API_KEY` Fly secret, and `cms/scripts/provision-position-bot.mjs`. Take a
  manual backup first (`gh workflow run backup-db.yml`) — this is the one irreversible
  step in the migration.
