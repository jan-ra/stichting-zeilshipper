# Stichting Zeilshipper

Two-package monorepo:

- **`site/`** — Vite + React static frontend. Deploys to Cloudflare Workers Builds on every push to `main`.
- **`cms/`** — Payload CMS on Next.js. Deploys to Fly.io. SQLite + S3-compatible media storage (Cloudflare R2 in prod, MinIO locally).

The site is fully static. At build time, `site/scripts/load-from-payload.mjs` fetches every collection from the running Payload instance and writes JSON into `site/src/data/generated/`, which Vite then inlines. There are no runtime CMS calls from the browser.

## Reproduce production locally (two commands)

Prereqs: Node 20+, Docker, `flyctl` authenticated (`flyctl auth login`).

### 1. Pull live data

Copy `.env.pull.example` to `.env.pull` and fill in your R2 credentials
(same `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_ACCOUNT_ID` from [infra/README.md](infra/README.md) §1):

```sh
npm run pull
```

This:
- Starts local MinIO (media storage)
- Snapshots the live SQLite DB from Fly and writes it to `cms/data/payload.db`
- Mirrors all media from the R2 bucket into local MinIO

### 2. Spin up

```sh
npm run dev
```

This:
- Starts MinIO (idempotent)
- Starts the CMS at **http://localhost:3001/admin**
- Builds the site against the local CMS + media (`build:full`)
- Serves the static output at **http://localhost:4173**

MinIO console is at **http://localhost:9001** (minioadmin / minioadmin).

Press Ctrl-C to stop.

---

## Manual dev setup

Prereqs: Node 20+, Docker.

### 1. CMS (Payload)

```sh
cd cms
cp .env.example .env                # then set PAYLOAD_SECRET=$(openssl rand -hex 32)
npm install
npm run minio:up                    # local S3 for media uploads
npm run dev                         # http://localhost:3001/admin
```

Seed the CMS once with the bundled photos + videos:

```sh
npm run seed                        # reads from ../site/public/ and ./seed-assets/videos/
```

### 2. Site (Vite)

```sh
cd site
npm install
npm run load-from-payload           # pulls JSON from http://localhost:3001
npm run dev                         # http://localhost:5173
```

Re-run `load-from-payload` whenever you change content in the CMS.

## Production builds

- **Site:** Cloudflare Workers Builds auto-builds on every push to `main` (build command `npm ci && npm run build:full`, root `site`). For local production builds: `cd site && npm run build:full` → `site/dist/`.
- **CMS:** `cd cms && flyctl deploy`. Uses `cms/Dockerfile` and `cms/fly.toml`. Full setup runbook in [infra/README.md](infra/README.md).
