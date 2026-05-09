#!/usr/bin/env node
/**
 * Build-time content loader.
 *
 * Pulls every editorial content type from WordPress via WPGraphQL, normalises
 * each response into the shape the React pages already consume (see
 * src/data/content.js), and writes pretty-printed JSON to src/data/generated/.
 * The Vite build then statically inlines that JSON — no runtime CMS calls.
 *
 * Usage:  npm run load-content
 *         WP_GRAPHQL_ENDPOINT=https://cms.example.com/graphql npm run load-content
 */

import { writeFile, mkdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ENDPOINT = process.env.WP_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql'
const ROOT     = resolve(fileURLToPath(import.meta.url), '..', '..')
const OUT_DIR  = resolve(ROOT, 'src/data/generated')

// ── GraphQL transport ───────────────────────────────────────────────────────

async function gql(query, variables = {}) {
  let res
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    })
  } catch (err) {
    if (err.cause?.code === 'ECONNREFUSED' || /ECONNREFUSED/.test(String(err))) {
      throw new Error(
        `Cannot reach ${ENDPOINT} (connection refused).\n` +
        `Is WordPress running? Try:  cd wordpress && docker compose up -d`
      )
    }
    throw new Error(`Failed to reach ${ENDPOINT}: ${err.message}`)
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '<no body>')
    throw new Error(`HTTP ${res.status} from ${ENDPOINT}\n${body.slice(0, 800)}`)
  }

  const json = await res.json()
  if (json.errors?.length) {
    const summary = json.errors
      .map(e => `  at ${(e.path || []).join('.') || '<root>'}: ${e.message}`)
      .join('\n')
    throw new Error(`GraphQL errors from ${ENDPOINT}:\n${summary}`)
  }
  return json.data
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const slugId = (slug, fallback) => slug || fallback
const text   = (v) => (v == null ? '' : String(v))
const num    = (v) => (v == null || v === '' ? null : Number(v))

function image(node) {
  if (!node) return null
  const src = node.sourceUrl || node.node?.sourceUrl
  if (!src) return null
  return { src, alt: node.altText ?? node.node?.altText ?? '' }
}

// Repeater image rows shaped {image: {node:{sourceUrl,altText}}, alt, afterParagraph}
function repeaterImage(row) {
  const node = row?.image?.node
  if (!node?.sourceUrl) return null
  return {
    src: node.sourceUrl,
    alt: row.alt || node.altText || '',
    after: num(row.afterParagraph),
  }
}

// ── Type-specific queries + transforms ──────────────────────────────────────

async function loadShips() {
  const data = await gql(`
    query Ships {
      ships(first: 100, where: { status: PUBLISH, orderby: { field: TITLE, order: ASC } }) {
        nodes {
          databaseId
          slug
          title
          shipFields {
            type
            port
            region
            lat
            lng
            speed
            yearBuilt
            passengers
          }
        }
      }
    }
  `)
  return data.ships.nodes.map(n => {
    const f = n.shipFields || {}
    return {
      id: n.databaseId,
      name: text(n.title),
      type: text(f.type),
      lat: num(f.lat),
      lng: num(f.lng),
      port: text(f.port),
      speed: num(f.speed),
      year: num(f.yearBuilt),
      region: text(f.region) || 'thuiswateren',
      passengers: num(f.passengers),
    }
  })
}

async function loadBlogPosts() {
  const data = await gql(`
    query BlogPosts {
      blogPosts(first: 100, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
        nodes {
          databaseId
          slug
          title
          date
          featuredImage { node { sourceUrl altText } }
          blogPostFields {
            titleEn
            excerpt
            excerptEn
            body { text }
            bodyEn { text }
            category
            categoryEn
            authorName
            authorPhoto { node { sourceUrl altText } }
            readTime
            bodyImages {
              image { node { sourceUrl altText } }
              alt
              afterParagraph
            }
          }
        }
      }
    }
  `)
  return data.blogPosts.nodes.map(n => {
    const f = n.blogPostFields || {}
    const cover = image(n.featuredImage?.node)
    const author = image(f.authorPhoto?.node)
    return {
      id: n.databaseId,
      slug: slugId(n.slug, String(n.databaseId)),
      title: text(n.title),
      title_en: text(f.titleEn) || text(n.title),
      date: n.date ? new Date(n.date).toISOString().slice(0, 10) : '',
      category: text(f.category),
      category_en: text(f.categoryEn) || text(f.category),
      author: text(f.authorName),
      authorPhoto: author?.src || '',
      readTime: text(f.readTime),
      coverImage: cover ? { src: cover.src, alt: cover.alt } : null,
      images: (f.bodyImages || []).map(repeaterImage).filter(Boolean),
      excerpt: text(f.excerpt),
      excerpt_en: text(f.excerptEn) || text(f.excerpt),
      body: (f.body || []).map(p => text(p?.text)).filter(Boolean),
      body_en: (f.bodyEn || []).map(p => text(p?.text)).filter(Boolean),
    }
  })
}

async function loadTeam() {
  const data = await gql(`
    query Team {
      teamMembers(first: 100, where: { status: PUBLISH, orderby: { field: MENU_ORDER, order: ASC } }) {
        nodes {
          databaseId
          title
          featuredImage { node { sourceUrl altText } }
          teamMemberFields {
            role
            roleEn
            location
            since
            bio
            bioEn
            expertise
            expertiseEn
          }
        }
      }
    }
  `)
  return data.teamMembers.nodes.map(n => {
    const f = n.teamMemberFields || {}
    const photo = image(n.featuredImage?.node)
    return {
      id: n.databaseId,
      name: text(n.title),
      role: text(f.role),
      role_en: text(f.roleEn) || text(f.role),
      location: text(f.location),
      since: text(f.since),
      photo: photo?.src || '',
      bio: text(f.bio),
      bio_en: text(f.bioEn) || text(f.bio),
      expertise: text(f.expertise),
      expertise_en: text(f.expertiseEn) || text(f.expertise),
    }
  })
}

async function loadHarbours() {
  const data = await gql(`
    query InfoBoards {
      infoBoards(first: 200, where: { status: PUBLISH, orderby: { field: TITLE, order: ASC } }) {
        nodes {
          databaseId
          title
          infoBoardFields {
            lat
            lng
            status
            ships
            notes
            notesEn
            dateLabel
          }
        }
      }
    }
  `)
  return data.infoBoards.nodes.map(n => {
    const f = n.infoBoardFields || {}
    return {
      id: n.databaseId,
      name: text(n.title),
      lat: num(f.lat),
      lng: num(f.lng),
      status: text(f.status) || 'kandidaat',
      ships: num(f.ships) ?? 0,
      notes: text(f.notes),
      notes_en: text(f.notesEn) || text(f.notes),
      date: text(f.dateLabel),
    }
  })
}

async function loadMediaItems() {
  const data = await gql(`
    query MediaItems {
      mediaItems(first: 200, where: { status: PUBLISH, orderby: { field: MENU_ORDER, order: ASC } }) {
        nodes {
          databaseId
          title
          mediaItemFields {
            mediaType
            titleEn
            description
            descriptionEn
            category
            tag
            tagEn
            fileFormat
            file { node { sourceUrl } }
            externalUrl
          }
        }
      }
    }
  `)
  return data.mediaItems.nodes.map(n => {
    const f = n.mediaItemFields || {}
    const fileUrl = f.file?.node?.sourceUrl || ''
    return {
      id: n.databaseId,
      type: text(f.mediaType),
      title: text(n.title),
      title_en: text(f.titleEn) || text(n.title),
      description: text(f.description),
      description_en: text(f.descriptionEn) || text(f.description),
      category: text(f.category),
      tag: text(f.tag),
      tag_en: text(f.tagEn) || text(f.tag),
      format: text(f.fileFormat),
      url: text(f.externalUrl) || fileUrl,
    }
  })
}

async function loadUnescoSteps() {
  const data = await gql(`
    query UnescoSteps {
      unescoSteps(first: 200, where: { status: PUBLISH, orderby: { field: MENU_ORDER, order: ASC } }) {
        nodes {
          databaseId
          title
          unescoStepFields {
            stepNumber
            locationName
            coordinates
            status
          }
        }
      }
    }
  `)
  return data.unescoSteps.nodes.map(n => {
    const f = n.unescoStepFields || {}
    const [lat, lng] = String(f.coordinates || '').split(',').map(s => Number(s.trim()))
    return {
      id: n.databaseId,
      step: num(f.stepNumber),
      name: text(n.title),
      location: text(f.locationName),
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
      status: text(f.status) || 'upcoming',
    }
  })
}

// ── Driver ──────────────────────────────────────────────────────────────────

const TYPES = [
  { name: 'ships',         file: 'ships.json',         load: loadShips },
  { name: 'blog-posts',    file: 'blog-posts.json',    load: loadBlogPosts },
  { name: 'team',          file: 'team.json',          load: loadTeam },
  { name: 'harbours',      file: 'harbours.json',      load: loadHarbours },
  { name: 'media-items',   file: 'media-items.json',   load: loadMediaItems },
  { name: 'unesco-steps',  file: 'unesco-steps.json',  load: loadUnescoSteps },
]

async function main() {
  console.log(`Loading content from ${ENDPOINT}`)
  await mkdir(OUT_DIR, { recursive: true })

  for (const t of TYPES) {
    const items = await t.load()
    const out = resolve(OUT_DIR, t.file)
    await writeFile(out, JSON.stringify(items, null, 2) + '\n', 'utf8')
    console.log(`  ✓ ${t.name}: ${items.length}`)
  }

  console.log('Done. Run `npm run build:static` next.')
}

main().catch(err => {
  console.error('\nload-content failed:\n')
  console.error(err.message || err)
  process.exit(1)
})
