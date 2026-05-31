# Infrastructure runbook

End-to-end setup for the production hosting stack:

- **Site**         — Cloudflare Workers Builds, served at `<your-domain>` + `www.<your-domain>`
- **CMS**          — Fly.io, Payload + Next.js standalone, SQLite on a volume, scale-to-zero. Served at `admin.<your-domain>`.
- **Media**        — Cloudflare R2 bucket exposed via `media.<your-domain>`
- **Backups**      — GitHub Actions daily cron → R2 `db-backups/` prefix → 7-day lifecycle delete
- **Rebuild hook** — CMS `afterChange`/`afterDelete` → Workers Builds Deploy Hook (debounced 30s)

You'll need accounts on Cloudflare, Fly.io, and (already have) GitHub. The `.nl` domain must be registered at any Dutch registrar (TransIP, Versio, Mijndomein, etc.); only the nameservers need to point at Cloudflare.

---

## 0. Domain + Cloudflare zone

1. Register `<your-domain>` at any registrar that sells `.nl`.
2. Cloudflare dashboard → Add a site → enter the domain → choose Free plan.
3. Cloudflare gives you two nameservers (e.g. `xxx.ns.cloudflare.com`). Set those at your registrar. Propagation takes minutes-to-hours.
4. Wait for the zone to flip to "Active" in Cloudflare before continuing.

## 1. Cloudflare R2

```text
Bucket name:  zeilshipper-media
Region:       auto (default)
Prefixes used:
  /                 → uploads (public via media.<domain>)
  /db-backups/      → daily SQLite snapshots (private, lifecycle-deleted)
```

Setup:

1. R2 → Create bucket → name `zeilshipper-media`.
2. Bucket → Settings → **Custom Domains** → connect `media.<your-domain>`.
   Cloudflare creates the DNS record and TLS cert automatically.
3. Bucket → Settings → **Object lifecycle rules** → Add rule:
   - Prefix: `db-backups/`
   - Action: Delete after `7` days
4. R2 → **Manage API Tokens** → Create token, scope to `zeilshipper-media`, permissions "Object Read & Write".
   Save these three values:
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_ACCOUNT_ID` (visible at R2 dashboard root)

## 2. Fly.io (CMS)

### 2a. Initial deploy on the `*.fly.dev` hostname

```bash
cd cms

# One-time setup
flyctl launch --no-deploy --copy-config --name stichting-zeilshipper-cms
flyctl volumes create data --size 1 --region ams

# Secrets — see SECRETS table below.
# PAYLOAD_PUBLIC_URL points at the *.fly.dev URL for the very first deploy;
# it gets swapped for the custom admin subdomain in step 2b.
flyctl secrets set \
  PAYLOAD_SECRET="$(openssl rand -hex 32)" \
  DATABASE_URI="file:/data/payload.db" \
  PAYLOAD_PUBLIC_URL="https://stichting-zeilshipper-cms.fly.dev" \
  S3_BUCKET="zeilshipper-media" \
  S3_ENDPOINT="https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com" \
  S3_REGION="auto" \
  S3_ACCESS_KEY_ID="<R2 token access key>" \
  S3_SECRET_ACCESS_KEY="<R2 token secret>" \
  MEDIA_BASE_URL="https://media.<your-domain>"
  # CF_PAGES_DEPLOY_HOOK is added after step 3.

flyctl deploy
```

Confirm it boots: `https://stichting-zeilshipper-cms.fly.dev/admin` should serve the Payload login screen. Don't create the user yet — finish step 2b first so your admin account lives on the right hostname's session cookie.

The Fly machine will auto-stop after a few minutes idle (`fly.toml` → `auto_stop_machines = "stop"`, `min_machines_running = 0`). First admin request after a stop incurs a cold start (~3–5 s).

### 2b. Custom admin subdomain (`admin.<your-domain>`)

1. **DNS** — Cloudflare → DNS → Records → Add record:
   - Type: `CNAME`
   - Name: `admin`
   - Target: `stichting-zeilshipper-cms.fly.dev`
   - Proxy status: **DNS only (grey cloud)** — Cloudflare's proxy intercepts Fly's HTTP-01 cert challenges, so leave it grey at least until the cert is `Ready`.

2. **Cert provisioning on Fly:**
   ```bash
   flyctl certs add admin.<your-domain> -a stichting-zeilshipper-cms
   flyctl certs show admin.<your-domain> -a stichting-zeilshipper-cms
   # wait for Status: Ready (usually 1–2 min after DNS propagates)
   ```

3. **Point Payload at the new URL:**
   ```bash
   flyctl secrets set PAYLOAD_PUBLIC_URL="https://admin.<your-domain>" -a stichting-zeilshipper-cms
   ```
   Setting a secret triggers an automatic re-roll of the machine.

   > **This is load-bearing for auth, not just URL generation.** Payload's config
   > sanitization appends `serverURL` (= `PAYLOAD_PUBLIC_URL`) to the `csrf`
   > allowlist, and the cookie-based JWT strategy rejects any request whose
   > `Origin` is not in that list. If this stays pointed at `*.fly.dev` while you
   > use `admin.<your-domain>`, every authenticated request from the custom
   > domain returns `{user: null}` / 403 with `"U mag deze actie niet uitvoeren."

4. **First user** — visit `https://admin.<your-domain>/admin`, create your admin account. Upload a test image; confirm it lands at `https://media.<your-domain>/<filename>` and shows up in the R2 bucket listing.

## 3. Cloudflare (site) — Workers Builds with Static Assets

Cloudflare consolidated Pages onto the Workers platform; new projects use the
Workers Builds UI. The static-output config that used to be "Build output
directory" now lives in [site/wrangler.toml](../site/wrangler.toml) under the
`[assets]` block.

1. Cloudflare dashboard → Workers & Pages → **Create application** → **Connect to Git** → choose this repo, branch `main`.
2. Build configuration:
   - **Root directory**: `/site`
   - **Build command**: `npm ci && npm run build:full`
   - **Deploy command**: `npx wrangler deploy`
   - **Version command**: `npx wrangler versions upload` (preview deployments)
   - No "build output directory" field — `wrangler deploy` reads `[assets].directory = "./dist"` from `site/wrangler.toml`.
3. **Environment variables** (Production scope):
   - `PAYLOAD_API_URL=https://admin.<your-domain>`
   - `PAYLOAD_PUBLIC_URL=https://admin.<your-domain>`
   - `MEDIA_BASE_URL=https://media.<your-domain>`
   - `BAKE_MAX_BYTES=2097152`
4. **Custom domain**: Worker → Settings → Domains & Routes → add `<your-domain>` (apex) and/or `www.<your-domain>`.
5. **Deploy hook**: Worker → Settings → Builds → Deploy hooks → "Add deploy hook" named `cms-trigger`. Copy the URL.
6. Wire the deploy hook into Fly so a CMS save triggers a rebuild:
   ```bash
   flyctl secrets set CF_PAGES_DEPLOY_HOOK="<URL from previous step>"
   ```
   The env var name stays `CF_PAGES_DEPLOY_HOOK` even though the product is now
   "Workers Builds" — it's just a POST URL, and renaming would churn the Fly
   secret and the hook code in [cms/src/hooks/triggerRebuild.ts](../cms/src/hooks/triggerRebuild.ts).

## 4. GitHub backup workflow

Set these repo secrets (Settings → Secrets and variables → Actions):

```bash
gh secret set FLY_API_TOKEN < <(flyctl tokens create deploy --app stichting-zeilshipper-cms)
gh secret set R2_ACCESS_KEY_ID
gh secret set R2_SECRET_ACCESS_KEY
gh secret set R2_ACCOUNT_ID
```

Trigger a manual run to verify: `gh workflow run backup-db.yml`. Then list snapshots:

```bash
AWS_ACCESS_KEY_ID=$R2_ACCESS_KEY_ID \
AWS_SECRET_ACCESS_KEY=$R2_SECRET_ACCESS_KEY \
aws s3 ls s3://zeilshipper-media/db-backups/ \
  --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
```

## 5. End-to-end smoke test

1. Log into `https://admin.<your-domain>/admin`, edit a blog post, save.
2. Within ~45 s a new Workers Builds deployment with source "Deploy Hook" appears in the Cloudflare dashboard.
3. After it finishes (~1–2 min), the site at `https://<your-domain>` shows the edit.
4. Upload a small (<2 MB) and a large (>2 MB) image to a doc, save. After the next deploy, inspect the deployment artifact — the small one lives under `/baked/...`, the large one references `https://media.<your-domain>/...`.

---

## Secrets inventory

| Name | Lives in | How to get it |
|---|---|---|
| `PAYLOAD_SECRET` | Fly secret | `openssl rand -hex 32` |
| `DATABASE_URI` | Fly secret | Literal: `file:/data/payload.db` |
| `PAYLOAD_PUBLIC_URL` | Fly secret | `https://admin.<your-domain>` (post-2b) |
| `S3_BUCKET` | Fly secret | Literal: `zeilshipper-media` |
| `S3_ENDPOINT` | Fly secret | `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `S3_REGION` | Fly secret | Literal: `auto` |
| `S3_ACCESS_KEY_ID` | Fly secret | R2 API token |
| `S3_SECRET_ACCESS_KEY` | Fly secret | R2 API token |
| `MEDIA_BASE_URL` | Fly secret **and** Workers env var | `https://media.<your-domain>` |
| `CF_PAGES_DEPLOY_HOOK` | Fly secret | Worker → Settings → Builds → Deploy hooks → create |
| `PAYLOAD_API_URL` | Workers env var | `https://admin.<your-domain>` |
| `BAKE_MAX_BYTES` | CF Pages env var | `2097152` |
| `FLY_API_TOKEN` | GitHub repo secret | `flyctl tokens create deploy --app stichting-zeilshipper-cms` |
| `R2_ACCESS_KEY_ID` | GitHub repo secret | R2 API token (same as Fly) |
| `R2_SECRET_ACCESS_KEY` | GitHub repo secret | R2 API token (same as Fly) |
| `R2_ACCOUNT_ID` | GitHub repo secret | Cloudflare dashboard → account ID |

---

## Restore drill

Once after first successful backup, do a recovery test to confirm the snapshot is intact.

```bash
# 1. Download latest snapshot
aws s3 cp s3://zeilshipper-media/db-backups/$(date -u +%Y-%m-%d).db ./restore.db \
  --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

# 2. Sanity-check
sqlite3 ./restore.db ".tables"
sqlite3 ./restore.db "SELECT count(*) FROM payload_locked_documents;"

# 3. (Only in an emergency) push it back over the live DB
flyctl scale count 0 -a stichting-zeilshipper-cms
flyctl ssh sftp put -a stichting-zeilshipper-cms ./restore.db /data/payload.db
flyctl scale count 1 -a stichting-zeilshipper-cms
```

## Troubleshooting

- **Media URLs 404** — confirm `MEDIA_BASE_URL` is the same value in Fly secrets *and* in CF Pages env vars, and matches the custom-domain hostname bound to the R2 bucket.
- **Rebuilds not firing** — `flyctl logs -a stichting-zeilshipper-cms`, look for `[rebuild]` lines. If `CF_PAGES_DEPLOY_HOOK not set` appears, the secret is missing. If the POST returns non-2xx, the deploy hook URL was rotated; create a new one.
- **`bake-media` "errors=N"** — the script exits non-zero if any URL failed HEAD; most often this means a Payload media doc still references an obsolete local URL. Re-save the affected docs in admin.
- **SQLite backup hangs** — the Fly machine may be cold; the `flyctl ssh console` calls wake it. If it still hangs, increase the workflow `timeout-minutes`.
