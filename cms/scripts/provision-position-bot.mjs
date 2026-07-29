/**
 * Provision a local "position-bot" editor user with an API key and write the
 * key into cms/.env as POSITION_BOT_API_KEY, so `npm run update-positions` can
 * PATCH ship positions locally.
 *
 * Idempotent: deletes any existing position-bot@local user first, then recreates
 * it with a fresh API key. Local-dev only — never run against production.
 *
 * Usage:  cd cms && node_modules/.bin/tsx --env-file=.env scripts/provision-position-bot.mjs
 */

import { randomBytes } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { getPayload } from 'payload'

import config from '../payload.config'

const EMAIL   = 'position-bot@example.com'
const ENV_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env')

const payload = await getPayload({ config })

// Remove any existing bot user for a clean, deterministic key.
const { docs: existing } = await payload.find({
  collection: 'users', where: { email: { equals: EMAIL } }, limit: 10,
})
for (const u of existing) await payload.delete({ collection: 'users', id: u.id })

// Payload does not auto-generate a key when enableAPIKey is set via the API
// (the admin UI generates one client-side). So we generate and set it ourselves.
const apiKey = randomBytes(24).toString('hex')

await payload.create({
  collection: 'users',
  data: {
    email: EMAIL,
    // Password is required by the auth strategy but unused — we auth via API key.
    password: `bot-${Math.abs(hash(EMAIL + config.secret)).toString(36)}${'x9Q!'}`,
    role: 'editor',
    enableAPIKey: true,
    apiKey,
  },
})

// Upsert POSITION_BOT_API_KEY into .env.
let env = fs.readFileSync(ENV_PATH, 'utf8')
if (/^POSITION_BOT_API_KEY=.*$/m.test(env)) {
  env = env.replace(/^POSITION_BOT_API_KEY=.*$/m, `POSITION_BOT_API_KEY=${apiKey}`)
} else {
  env += `\nPOSITION_BOT_API_KEY=${apiKey}\n`
}
fs.writeFileSync(ENV_PATH, env)

console.log(`✓ Created editor user ${EMAIL} (role=editor, API key enabled)`)
console.log(`✓ Wrote POSITION_BOT_API_KEY=${apiKey.slice(0, 6)}…(${apiKey.length} chars) into cms/.env`)
process.exit(0)

// tiny deterministic string hash so we don't need Math.random for the password
function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0 } return h }
