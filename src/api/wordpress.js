/**
 * WordPress REST API client
 *
 * Set VITE_WP_API_URL in .env to connect to a headless WordPress instance.
 * Without it, all functions return static mock data from src/data/content.js.
 *
 * Expected WordPress setup:
 *   - Custom post types: ship, harbour, team_member, media_item (via CPT UI)
 *   - ACF fields exposed via ACF to REST API plugin
 *   - Standard WP posts for blog
 *
 * Example .env:
 *   VITE_WP_API_URL=https://cms.zeilschipper.nl/wp-json
 */

import * as mock from '../data/content.js'

const WP_API = import.meta.env.VITE_WP_API_URL || null

async function wpFetch(endpoint) {
  const res = await fetch(`${WP_API}${endpoint}`)
  if (!res.ok) throw new Error(`WP API error: ${res.status} ${endpoint}`)
  return res.json()
}

// ── Ships ─────────────────────────────────────────────────────────────────────

export async function getShips() {
  if (!WP_API) return mock.SHIPS
  // WP: GET /wp/v2/ships?per_page=100&_fields=id,acf
  const posts = await wpFetch('/wp/v2/ships?per_page=100')
  return posts.map(p => ({
    id: p.id,
    name: p.acf.name,
    type: p.acf.type,
    lat: parseFloat(p.acf.lat),
    lng: parseFloat(p.acf.lng),
    port: p.acf.port,
    speed: parseFloat(p.acf.speed),
    year: parseInt(p.acf.year),
    region: p.acf.region,
    passengers: parseInt(p.acf.passengers),
  }))
}

export async function getArcs() {
  if (!WP_API) return mock.ARCS
  // Arcs are derived from ship routes stored as a custom field on a settings page
  // GET /wp/v2/pages?slug=vloot-instellingen
  const pages = await wpFetch('/wp/v2/pages?slug=vloot-instellingen')
  return pages[0]?.acf?.arcs ?? mock.ARCS
}

// ── Team ──────────────────────────────────────────────────────────────────────

export async function getTeam() {
  if (!WP_API) return mock.TEAM
  // WP: GET /wp/v2/team_member?per_page=100&orderby=menu_order&order=asc
  const posts = await wpFetch('/wp/v2/team_member?per_page=100&orderby=menu_order&order=asc')
  return posts.map(p => ({
    id: p.id,
    name: p.acf.name,
    role: p.acf.role,
    location: p.acf.location,
    since: p.acf.since,
    bio: p.acf.bio,
    expertise: p.acf.expertise,
    photo: p.acf.photo?.url || null,
  }))
}

// ── Harbours ──────────────────────────────────────────────────────────────────

export async function getHarbours() {
  if (!WP_API) return mock.HARBOURS
  // WP: GET /wp/v2/harbour?per_page=100&orderby=menu_order&order=asc
  const posts = await wpFetch('/wp/v2/harbour?per_page=100&orderby=menu_order&order=asc')
  return posts.map(p => ({
    id: p.id,
    name: p.acf.name,
    lat: parseFloat(p.acf.lat),
    lng: parseFloat(p.acf.lng),
    status: p.acf.status,       // 'afgerond' | 'ingediend' | 'kandidaat'
    ships: parseInt(p.acf.ships_nearby),
    notes: p.acf.notes,
    date: p.acf.date_label,
  }))
}

// ── Blog ──────────────────────────────────────────────────────────────────────

export async function getBlogPosts({ category } = {}) {
  if (!WP_API) {
    if (!category || category === 'Alles') return mock.BLOG_POSTS
    return mock.BLOG_POSTS.filter(p => p.category === category)
  }
  // WP: GET /wp/v2/posts?per_page=20&_embed&categories=<id>
  const catParam = category && category !== 'Alles' ? `&category_name=${encodeURIComponent(category)}` : ''
  const posts = await wpFetch(`/wp/v2/posts?per_page=20&_embed${catParam}`)
  return posts.map(p => ({
    id: p.id,
    title: p.title.rendered,
    date: new Date(p.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }),
    category: p._embedded?.['wp:term']?.[0]?.[0]?.name || '',
    excerpt: p.excerpt.rendered.replace(/<[^>]+>/g, ''),
    readTime: p.acf?.read_time || '4 min',
    slug: p.slug,
    featuredImage: p._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
  }))
}

// ── Media ─────────────────────────────────────────────────────────────────────

export async function getMediaItems() {
  if (!WP_API) return mock.MEDIA_ITEMS
  // WP: GET /wp/v2/media_item?per_page=100
  const posts = await wpFetch('/wp/v2/media_item?per_page=100')
  return posts.map(p => ({
    id: p.id,
    type: p.acf.media_type,     // 'video' | 'photo' | 'text' | 'podcast'
    title: p.acf.title,
    description: p.acf.description,
    category: p.acf.category,   // 'video' | 'foto' | 'tekst' | 'podcast'
    size: p.acf.file_size,
    format: p.acf.file_format,
    downloadUrl: p.acf.file?.url || null,
  }))
}
