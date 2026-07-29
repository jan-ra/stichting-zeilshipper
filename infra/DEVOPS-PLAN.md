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
npm run pull      # (repo root) prod DB + media → local; do this now and then
npm run dev       # runs migrations, then the full stack (CMS + site)
```

`npm run pull` brings the production DB down byte-for-byte. Because prod records
which migrations it has applied (in its `payload_migrations` table), the copy you
pull already knows its migration state — so `npm run migrate` locally applies only
what prod is still missing. That is your migration dry-run.

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
- A failed migration exits non-zero → health check never passes → **Fly keeps the
  previous release.** Combined with a pre-deploy backup, a bad migration is recoverable.
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

## Backups & restore ✅

- Nightly `.backup` snapshot → R2 `db-backups/`, 7-day lifecycle ([backup-db.yml](../.github/workflows/backup-db.yml)).
- 🔜 Pre-deploy backups → `db-backups/predeploy/<sha>.db` on a longer-retention prefix.
- Restore drill: see [README.md](README.md) § Restore drill.

---

## One-off data operations

| Task | Tool | Where it's safe to run |
|---|---|---|
| Seed full demo dataset | `npm run seed` | **local only** (wipes collections) |
| Import curated ships | `node scripts/import-ships.mjs` | 🔜 non-destructive upsert via a manual pipeline |
| Provision local position bot | `scripts/provision-position-bot.mjs` | **local only** |
| Nightly AIS positions | [update-positions.yml](../.github/workflows/update-positions.yml) | GitHub Actions cron (prod) ✅ |

---

## Roadmap

- 🔜 **Ordered deploy pipeline** (`.github/workflows/deploy.yml`): on push to `main` →
  CI (typecheck+build) → pre-deploy backup → `flyctl deploy` (migrations on boot) →
  trigger site build via Cloudflare deploy hook. Switch Cloudflare from build-on-push
  to deploy-hook-only so the release order is DB → CMS → site.
- 🔜 **Prod guards** on `seed.ts` / `import-ships.mjs` (`ALLOW_DESTRUCTIVE=1`), and
  `import-ships` rewritten as a non-destructive upsert exposed as `workflow_dispatch`.
- 🔜 **Hardening**: populate `csrf` allowlist + scope `cors` in the Payload config.
