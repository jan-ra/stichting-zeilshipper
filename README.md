# Stichting Zeilshipper

Two-package monorepo:

- **`site/`** — Vite + React static frontend. Deploys to GitHub Pages on every push to `main` (see `.github/workflows/deploy.yml`).
- **`cms/`** — Payload CMS on Next.js. Deploys to fly.io. SQLite + S3-compatible media storage (Cloudflare R2 in prod, MinIO locally).

The site is fully static. At build time, `site/scripts/load-from-payload.mjs` fetches every collection from the running Payload instance and writes JSON into `site/src/data/generated/`, which Vite then inlines. There are no runtime CMS calls from the browser.

## Dev setup

Prereqs: Node 20+, Docker (only needed for the CMS media bucket).

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
npm run dev                         # http://localhost:5173/stichting-zeilshipper/
```

Re-run `load-from-payload` whenever you change content in the CMS.

## Production builds

- **Site:** `cd site && npm run build` → `site/dist/`. CI does this automatically (`.github/workflows/deploy.yml`).
- **CMS:** `cd cms && fly deploy`. Uses `cms/Dockerfile` and `cms/fly.toml`. First-time setup steps are in the comments at the top of `cms/fly.toml`.
