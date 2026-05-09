import SHIPS from './generated/ships.json'
import BLOG_POSTS from './generated/blog-posts.json'
import TEAM from './generated/team.json'
import HARBOURS from './generated/harbours.json'
import MEDIA_ITEMS from './generated/media-items.json'
import UNESCO_STEPS from './generated/unesco-steps.json'
import PARTNERS from './generated/partners.json'

// Visualisation overlays for the globe — derived from ship home ports, not
// editorial content, so they stay alongside the data layer rather than coming
// from the CMS.
export const ARCS = [
  { startLat: 53.18, startLng: 5.40, endLat: 57.20, endLng: 20.10 },
  { startLat: 52.95, startLng: 4.76, endLat: 40.65, endLng: 14.25 },
  { startLat: 53.30, startLng: 6.05, endLat: 43.30, endLng: -9.80 },
  { startLat: 52.38, startLng: 4.90, endLat: 25.30, endLng: -70.10 },
  { startLat: 52.38, startLng: 4.90, endLat: -62.10, endLng: -57.90 },
  { startLat: 53.00, startLng: 8.80, endLat: 35.90, endLng: 14.51 },
]

export { SHIPS, BLOG_POSTS, TEAM, HARBOURS, MEDIA_ITEMS, UNESCO_STEPS, PARTNERS }
