/**
 * Seed script — full dataset for development and staging.
 *
 * Usage:
 *   cd cms
 *   npm run minio:up      # must be running — S3 handles file uploads
 *   npm run seed
 *
 * Safe to re-run: clears each collection before inserting.
 * Does not touch: users.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { getPayload } from 'payload'

import config from '../payload.config'

const payload = await getPayload({ config })

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const PUBLIC    = path.join(REPO_ROOT, 'site', 'public')
const VIDEOS    = path.join(REPO_ROOT, 'cms', 'seed-assets', 'videos')

// ── Helpers ───────────────────────────────────────────────────────────────────

async function reseed(collection: string, records: object[]) {
  const { docs } = await payload.find({ collection: collection as any, limit: 1000, pagination: false })
  for (const doc of docs) await payload.delete({ collection: collection as any, id: doc.id })
  for (const data of records) await payload.create({ collection: collection as any, data })
  console.log(`  ✓ ${collection}: ${records.length}`)
}

/**
 * Create documents with NL content (default locale), then patch the EN locale.
 * Fields ending in `_en` are stripped from the NL create and applied as an EN
 * update — matching the localized fields declared in each collection.
 */
async function reseedLocalized(collection: string, records: Array<Record<string, any>>) {
  const { docs } = await payload.find({ collection: collection as any, limit: 1000, pagination: false })
  for (const doc of docs) await payload.delete({ collection: collection as any, id: doc.id })

  for (const record of records) {
    const nlData: Record<string, any> = {}
    const enData: Record<string, any> = {}

    for (const [key, value] of Object.entries(record)) {
      if (key.endsWith('_en')) {
        enData[key.slice(0, -3)] = value
      } else {
        nlData[key] = value
      }
    }

    const doc = await payload.create({ collection: collection as any, data: nlData, locale: 'nl' })

    if (Object.keys(enData).length > 0) {
      await payload.update({ collection: collection as any, id: doc.id as number, data: enData, locale: 'en' })
    }
  }

  console.log(`  ✓ ${collection}: ${records.length}`)
}

function mimeType(filename: string) {
  if (filename.endsWith('.webp')) return 'image/webp'
  if (filename.endsWith('.png'))  return 'image/png'
  if (filename.endsWith('.mp4'))  return 'video/mp4'
  if (filename.endsWith('.jxl'))  return 'image/jxl'
  return 'image/jpeg'
}

async function uploadImage(relPath: string, alt: string) {
  const abs  = path.join(PUBLIC, relPath)
  const name = path.basename(abs)
  const data = fs.readFileSync(abs)
  const size = data.byteLength
  return payload.create({
    collection: 'media',
    data: { alt },
    file: { data, name, size, mimetype: mimeType(name) },
  })
}

async function uploadVideo(filename: string) {
  const abs  = path.join(VIDEOS, filename)
  const name = path.basename(abs)
  const data = fs.readFileSync(abs)
  const size = data.byteLength
  console.log(`    ↑ ${filename} (${(size / 1_000_000).toFixed(0)} MB)`)
  return payload.create({
    collection: 'media',
    data: { alt: '' },
    file: { data, name, size, mimetype: 'video/mp4' },
  })
}

// Strip _en keys → NL payload
function nlVersion(data: any): any {
  if (Array.isArray(data)) return data.map(nlVersion)
  if (data && typeof data === 'object') {
    const out: any = {}
    for (const [k, v] of Object.entries(data)) {
      if (!k.endsWith('_en')) out[k] = nlVersion(v)
    }
    return out
  }
  return data
}

// Replace key with key_en value where present → EN payload
function enVersion(data: any): any {
  if (Array.isArray(data)) return data.map(enVersion)
  if (data && typeof data === 'object') {
    const out: any = {}
    for (const k of Object.keys(data)) {
      if (k.endsWith('_en')) continue
      const enKey = `${k}_en`
      out[k] = enKey in data ? enVersion((data as any)[enKey]) : enVersion((data as any)[k])
    }
    return out
  }
  return data
}

// Copy `id` fields from savedData into targetData for matching array items
// so that the EN updateGlobal call updates existing items rather than replacing them.
function injectIds(targetData: any, savedData: any): any {
  if (Array.isArray(targetData) && Array.isArray(savedData)) {
    return targetData.map((item, i) => {
      const saved = savedData[i]
      if (!saved) return item
      const withId = saved.id != null ? { id: saved.id, ...item } : { ...item }
      return injectIds(withId, saved)
    })
  }
  if (targetData && typeof targetData === 'object' && savedData && typeof savedData === 'object') {
    const out: any = { ...targetData }
    for (const k of Object.keys(targetData)) {
      if (savedData[k] != null) out[k] = injectIds(targetData[k], savedData[k])
    }
    return out
  }
  return targetData
}

async function seedGlobal(slug: string, data: Record<string, any>) {
  // Pass 1: NL locale — creates array items with their IDs
  await (payload as any).updateGlobal({ slug, data: nlVersion(data), locale: 'nl' })
  // Fetch back to capture those IDs
  const saved = await (payload as any).findGlobal({ slug, locale: 'nl' })
  // Pass 2: EN locale — inject saved IDs so Payload updates existing items in place
  await (payload as any).updateGlobal({ slug, data: injectIds(enVersion(data), saved), locale: 'en' })
  console.log(`  ✓ global/${slug}`)
}

// ── Upload all photos first ────────────────────────────────────────────────────

console.log('Seeding Payload…\n')
console.log('  Uploading photos…')

// Clear existing media
const { docs: existingMedia } = await payload.find({ collection: 'media', limit: 1000, pagination: false })
for (const doc of existingMedia) await payload.delete({ collection: 'media', id: doc.id })

const photos: Record<string, number> = {}

const teamPhotos = [
  { file: 'team/sven.jpg',              alt: 'Sven' },
  { file: 'team/jan-willem.jpg',        alt: 'Jan-Willem' },
  { file: 'team/cockie.jpg',            alt: 'Cockie' },
  { file: 'team/zippi.jpg',             alt: 'Zippi' },
  { file: 'team/marja.jpg',             alt: 'Marja' },
  { file: 'team/maaike.jpg',            alt: 'Maaike' },
  { file: 'team/peter-fokkens.webp',    alt: 'Peter Fokkens' },
]

const blogPhotos = [
  { file: 'blog/bruine-vloot/het_vloot_vertrekt.jpg', alt: 'De vloot vertrekt' },
  { file: 'blog/bruine-vloot/op_het_ijsselmeer.jpg',  alt: 'Op het IJsselmeer' },
]

const shipPhotos = [
  { file: 'shippics/ortolan.jpg',           alt: 'Ortolan' },
  { file: 'shippics/isis.jpg',              alt: 'Isis' },
  { file: 'shippics/morgana.jpg',           alt: 'Morgana' },
  { file: 'shippics/kleine_jager.webp',     alt: 'Kleine Jager' },
  { file: 'shippics/Vliegende-Draek.jpg',   alt: 'Vliegende Draak' },
  { file: 'shippics/mon_desir.jpg',         alt: 'Mon Desir' },
  { file: 'shippics/fortuna.jpg',           alt: 'Fortuna' },
  { file: 'shippics/allure.jpg',            alt: 'Allure' },
  { file: 'shippics/ambiance.jxl',          alt: 'Ambiance' },
  { file: 'shippics/Oosterschelde.jpg',     alt: 'Oosterschelde' },
  { file: 'shippics/Tecla.webp',            alt: 'Tecla' },
  { file: 'shippics/europa.webp',           alt: 'Europa' },
  { file: 'shippics/eenhoorn.jpg',          alt: 'Eenhoorn' },
]

const homepagePhotos = [
  { file: 'pics/sven-homepage.webp',       alt: 'Zeilschip op zee' },
  { file: 'pics/jordie-1.webp',            alt: 'Jordie 1' },
  { file: 'pics/sven-2.webp',              alt: 'Sven 2' },
  { file: 'pics/jordie-6.webp',            alt: 'Jordie 6' },
  { file: 'pics/sven-4.webp',              alt: 'Sven 4' },
  { file: 'pics/jordi-morales.webp',       alt: 'Jordi Morales' },
  { file: 'pics/sven-7.webp',              alt: 'Sven 7' },
  { file: 'pics/jordie-5.jpg',             alt: 'Jordie 5' },
  { file: 'pics/sven-5.webp',              alt: 'Sven 5' },
  { file: 'pics/jordie-3.jpg',             alt: 'Jordie 3' },
  { file: 'pics/sven-1.webp',              alt: 'Sven 1' },
  { file: 'pics/sven-3.webp',              alt: 'Sven 3' },
  { file: 'pics/jordie-2.webp',            alt: 'Jordie — chapter photo 1' },
  { file: 'pics/jordie-4.webp',            alt: 'Jordie — chapter photo 2' },
  { file: 'pics/sven-6.webp',              alt: 'Sven — chapter photo 3' },
  { file: 'waterschatten-thumbnail.jpg',   alt: 'Waterschatten' },
]

for (const { file, alt } of [...teamPhotos, ...blogPhotos, ...shipPhotos, ...homepagePhotos]) {
  const doc = await uploadImage(file, alt)
  photos[file] = doc.id as number
  process.stdout.write(`    ↑ ${file}\n`)
}

// ── UNESCO Steps ──────────────────────────────────────────────────────────────

const unescoSteps = [
  { year: '2020', label: 'Meer dan 150 schepen bijeen bij Pampus',  label_en: 'More than 150 ships gathered at Pampus',       done: true,  active: false, order: 1 },
  { year: '2021', label: 'Stichting Zeilschipper opgericht',        label_en: 'Stichting Zeilschipper founded',               done: true,  active: false, order: 2 },
  { year: '2022', label: 'Start kennisdocumentatie',                label_en: 'Start of knowledge documentation',             done: true,  active: false, order: 3 },
  { year: '2023', label: 'Opname Inventaris Immaterieel Erfgoed',   label_en: 'Inclusion in Intangible Heritage Inventory',   done: true,  active: false, order: 4 },
  { year: '2024', label: 'Eerste informatieborden geplaatst',       label_en: 'First information boards placed',              done: true,  active: false, order: 5 },
  { year: '2025', label: 'Indiening bij Ministerie OCW',            label_en: 'Submission to Ministry of Education',          done: false, active: true,  order: 6 },
  { year: '2026–27', label: 'UNESCO-nominatie & besluit',           label_en: 'UNESCO nomination & decision',                 done: false, active: false, order: 7 },
]

// ── Partners ──────────────────────────────────────────────────────────────────

const partners = [
  'Vereniging Bruine Vloot',
  'Rijksdienst voor het Cultureel Erfgoed',
  'Ministerie van OCW',
  'Gemeente Harlingen',
  'Gemeente Enkhuizen',
  'Gemeente Hoorn',
  'Zuiderzeemuseum',
  'Scheepvaartmuseum Amsterdam',
  'Universiteit van Amsterdam',
  'Rijksuniversiteit Groningen',
  'Waddenzee Werelderfgoed',
  'Fries Museum',
  'Norsk Maritimt Museum',
  'Museet for Søfart (DK)',
  'Stichting Varend Erfgoed NL',
  'International Sail Training Association',
].map((name, i) => ({ name, order: i + 1 }))

// ── Ships ─────────────────────────────────────────────────────────────────────

const ships = [
  { name: 'Ortolan',         type: 'Klipper', lat: 53.03899,  lng: 4.85089,   port: 'Texel',        speed: 4.5, year: 1920, region: 'thuiswateren', passengers: 12, image: photos['shippics/ortolan.jpg'] },
  { name: 'Isis',            type: 'Klipper', lat: 53.34328,  lng: 5.34124,   port: 'Terschelling', speed: 4.2, year: 1912, region: 'thuiswateren', passengers: 16, image: photos['shippics/isis.jpg'] },
  { name: 'Morgana',         type: 'Klipper', lat: 53.35583,  lng: 5.21507,   port: 'Terschelling', speed: 4.8, year: 1908, region: 'thuiswateren', passengers: 14, image: photos['shippics/morgana.jpg'] },
  { name: 'Kleine Jager',    type: 'Klipper', lat: 52.51335,  lng: 5.05877,   port: 'Lelystad',     speed: 3.8, year: 1915, region: 'thuiswateren', passengers: 10, image: photos['shippics/kleine_jager.webp'] },
  { name: 'Vliegende Draak', type: 'Klipper', lat: 53.17471,  lng: 5.43197,   port: 'Harlingen',    speed: 5.2, year: 1907, region: 'thuiswateren', passengers: 18, image: photos['shippics/Vliegende-Draek.jpg'] },
  { name: 'Mon Desir',       type: 'Klipper', lat: 52.87908,  lng: 5.36648,   port: 'Stavoren',     speed: 4.0, year: 1918, region: 'thuiswateren', passengers: 12, image: photos['shippics/mon_desir.jpg'] },
  { name: 'Fortuna',         type: 'Klipper', lat: 52.69574,  lng: 5.28760,   port: 'Enkhuizen',    speed: 3.5, year: 1897, region: 'thuiswateren', passengers: 16, image: photos['shippics/fortuna.jpg'] },
  { name: 'Allure',          type: 'Klipper', lat: 52.51774,  lng: 5.43720,   port: 'Lelystad',     speed: 4.6, year: 1922, region: 'thuiswateren', passengers: 14, image: photos['shippics/allure.jpg'] },
  { name: 'Ambiance',        type: 'Klipper', lat: 52.69844,  lng: 5.29000,   port: 'Enkhuizen',    speed: 4.3, year: 1914, region: 'thuiswateren', passengers: 12, image: photos['shippics/ambiance.jxl'] },
  { name: 'Oosterschelde',   type: 'Bark',    lat: 17.13423,  lng: -62.63443, port: 'Sint Kitts',   speed: 7.5, year: 1918, region: 'wereld',       passengers: 24, image: photos['shippics/Oosterschelde.jpg'] },
  { name: 'Tecla',           type: 'Klipper', lat: -0.89810,  lng: -89.60861, port: 'Galápagos',    speed: 5.8, year: 1915, region: 'wereld',       passengers: 20, image: photos['shippics/Tecla.webp'] },
  { name: 'Europa',          type: 'Bark',    lat: -12.04159, lng: -77.14067, port: 'Lima',         speed: 6.1, year: 1911, region: 'wereld',       passengers: 28, image: photos['shippics/europa.webp'] },
  { name: 'Eenhoorn',        type: 'Klipper', lat: 52.69662,  lng: 5.28880,   port: 'Enkhuizen',    speed: 4.4, year: 1910, region: 'thuiswateren', passengers: 16, image: photos['shippics/eenhoorn.jpg'] },
]

// ── Team Members ──────────────────────────────────────────────────────────────

const teamMembers = [
  {
    name: 'Sven Timmann',
    role: 'Voorzitter',
    role_en: 'Chairman',
    location: 'Hamburg / Nederland',
    since: '2021',
    photo: photos['team/sven.jpg'],
    bio: 'Geboren in Hamburg aan de Elbe, duurde het niet lang voordat ik als tiener mijn liefde voor zeilen ontdekte. Eerst op rubberboten en later op jeugdkotters verkende ik met vrienden de meren en rivieren van Noord-Duitsland. In de zomer gingen deze reizen tot in Denemarken.',
    bio_en: "Born in Hamburg on the Elbe, it didn't take long before I discovered my love of sailing as a teenager. First on rubber dinghies and later on youth ketches, I explored the lakes and rivers of northern Germany with friends. In summer, these trips extended as far as Denmark.",
    expertise: 'Zeilvaart, bestuur, internationale netwerken',
    expertise_en: 'Sailing, governance, international networks',
  },
  {
    name: 'Jan Willem Zandstra',
    role: 'Secretaris',
    role_en: 'Secretary',
    location: 'Nederland',
    since: '2021',
    photo: photos['team/jan-willem.jpg'],
    bio: "Mijn naam is Jan Willem Zandstra en ik ben schipper en eigenaar van de zeilklipper 'Eenhoorn'. Zo'n 15 jaar geleden ben ik toevallig op een zeilschip terecht gekomen nadat het werken in de projectontwikkeling onmogelijk werd vanwege een wereldwijde financiële crisis.",
    bio_en: "My name is Jan Willem Zandstra and I am skipper and owner of the sailing clipper 'Eenhoorn'. About 15 years ago I ended up on a sailing ship by chance after working in property development became impossible due to a global financial crisis.",
    expertise: 'Scheepvaart, scheepsbeheer, Bruine Vloot',
    expertise_en: 'Shipping, vessel management, Bruine Vloot',
  },
  {
    name: 'Sylvelin (Zippi) Rinnen',
    role: 'Bestuurslid',
    role_en: 'Board member',
    location: 'Nederland',
    since: '2021',
    photo: photos['team/zippi.jpg'],
    bio: 'Als bestuurslid van Stichting Zeilschipper zet Sylvelin zich in voor het behoud van het immaterieel erfgoed van de Schipper Bruine Vloot. Haar brede ervaring en betrokkenheid bij de maritieme gemeenschap vormen een waardevolle bijdrage aan het bestuur.',
    bio_en: 'As a board member of Stichting Zeilschipper, Sylvelin is committed to preserving the intangible cultural heritage of the Bruine Vloot skipper. Her broad experience and involvement in the maritime community are a valuable contribution to the board.',
    expertise: 'Bestuur, maritiem erfgoed',
    expertise_en: 'Governance, maritime heritage',
  },
  {
    name: 'Cockie Schilperoort',
    role: 'Vrijwilliger',
    role_en: 'Volunteer',
    location: 'Muiden',
    since: '2023',
    photo: photos['team/cockie.jpg'],
    bio: "Ik ben, toen ik 20 was, in contact gekomen met de Bruine Vloot doordat ik een relatie kreeg met een schipper op een tjalk in Muiden. Wilde ik hem zien 's zomers dan 'moest' ik wel mee aan boord. Ik had helemaal geen zeilervaring en in het begin vond ik het erg spannend allemaal.",
    bio_en: "I first came into contact with the Bruine Vloot when I was 20 through a relationship with a skipper on a tjalk in Muiden. If I wanted to see him in summer, I 'had to' come along on board. I had no sailing experience whatsoever and at first I found it all quite nerve-wracking.",
    expertise: 'Gemeenschapsopbouw, communicatie',
    expertise_en: 'Community building, communications',
  },
  {
    name: 'Marja Goud',
    role: 'Vrijwilliger',
    role_en: 'Volunteer',
    location: 'Nederland',
    since: '2023',
    photo: photos['team/marja.jpg'],
    bio: 'Tijdens mijn studie museologie is mijn interesse gewekt voor historische schepen. Dat deze schepen zo zichtbaar zijn in het landschap en in het dagelijks leven in Nederland is iets om te koesteren. Heel anders dan erfgoed binnen de muren van een museum.',
    bio_en: 'My interest in historic ships was sparked during my museology studies. The fact that these vessels are so visible in the Dutch landscape and daily life is something to be cherished — very different from heritage locked behind museum walls.',
    expertise: 'Museologie, erfgoedbeheer',
    expertise_en: 'Museology, heritage management',
  },
  {
    name: 'Maaike de Jong',
    role: 'Vrijwilliger',
    role_en: 'Volunteer',
    location: 'Nederland',
    since: '2023',
    photo: photos['team/maaike.jpg'],
    bio: 'Ik combineer een academische achtergrond in hoger onderwijs en duurzaamheid met een passie voor maritiem erfgoed. Als stuurman op traditionele zeilschepen tot 500 GT vaar ik wereldwijd en zet ik mij in voor het levend houden van de kennis en praktijk van de Bruine Vloot.',
    bio_en: 'I combine an academic background in higher education and sustainability with a passion for maritime heritage. As a mate on traditional sailing vessels up to 500 GT, I sail worldwide and am committed to keeping the knowledge and practice of the Bruine Vloot alive.',
    expertise: 'Duurzaamheid, nautisch onderwijs, Bruine Vloot',
    expertise_en: 'Sustainability, nautical education, Bruine Vloot',
  },
]

// ── Info Boards ───────────────────────────────────────────────────────────────

const infoBoards = [
  // Completed
  { name: 'Harlingen',              lat: 53.1748, lng: 5.4158,  status: 'afgerond',  ships: 14, notes: 'Bord geplaatst aan de Noorderhaven, naast de historische scheepswerf. Officieel onthuld op 15 juni 2024 in aanwezigheid van de wethouder cultuur.',                             notes_en: 'Board placed at Noorderhaven, next to the historic shipyard. Officially unveiled on 15 June 2024.',                                              date: 'Afgerond juni 2024' },
  { name: 'Enkhuizen',              lat: 52.7082, lng: 5.2960,  status: 'afgerond',  ships: 22, notes: 'Bord geplaatst op de Buitenhaven, direct naast het Zuiderzeemuseum. Gefinancierd door Gemeente Enkhuizen en het Zuiderzeemuseum gezamenlijk.',                                  notes_en: 'Board placed at Buitenhaven, adjacent to the Zuiderzeemuseum. Jointly funded by the Municipality of Enkhuizen and the Zuiderzeemuseum.',          date: 'Afgerond september 2024' },
  { name: 'Amsterdam — NDSM',       lat: 52.4024, lng: 4.8991,  status: 'afgerond',  ships: 31, notes: 'Bord geplaatst op de historische NDSM-scheepswerf, een van de drukst bezochte aanlegplaatsen van de Bruine Vloot in Noord-Holland.',                                           notes_en: 'Board placed at the historic NDSM shipyard, one of the most visited moorings of the Bruine Vloot in North Holland.',                              date: 'Afgerond oktober 2024' },
  // Submitted
  { name: 'Hoorn',                  lat: 52.6431, lng: 5.0607,  status: 'ingediend', ships: 18, notes: 'Locatie goedgekeurd: Binnenhaven bij het Westfries Museum. Subsidieaanvraag ingediend bij Gemeente Hoorn, besluit verwacht Q2 2025.',                                           notes_en: 'Location approved: Binnenhaven near the Westfries Museum. Grant application submitted, decision expected Q2 2025.',                               date: 'Ingediend november 2024' },
  { name: 'Medemblik',              lat: 52.7686, lng: 5.1125,  status: 'ingediend', ships: 11, notes: 'Gemeente akkoord met locatie nabij het Stoomgemaal Vier Noorder Koggen. Plaatsing gepland zodra subsidie is toegekend.',                                                        notes_en: 'Municipality agreed on location near the Stoomgemaal. Placement planned once subsidy is granted.',                                                date: 'Ingediend december 2024' },
  { name: 'Stavoren',               lat: 52.8844, lng: 5.3649,  status: 'ingediend', ships: 9,  notes: 'Historisch eindpunt van de Hanzevaart. Gemeente Súdwest-Fryslân heeft principe-akkoord gegeven voor plaatsing bij de buitenhaven.',                                            notes_en: 'Historic end point of the Hanse route. Municipality has given agreement in principle for placement at the outer harbour.',                         date: 'Ingediend januari 2025' },
  { name: 'Urk',                    lat: 52.6637, lng: 5.6020,  status: 'ingediend', ships: 7,  notes: 'Gesprekken met vissersvereniging en gemeente verlopen positief. Locatie wordt beoordeeld bij de historische haven bij de vuurtoren.',                                           notes_en: 'Talks with the fishing association and municipality are progressing well. Location being assessed near the lighthouse.',                           date: 'Ingediend januari 2025' },
  { name: 'Lelystad — Bataviawerf', lat: 52.5185, lng: 5.4714,  status: 'ingediend', ships: 5,  notes: "Samenwerking met de Bataviawerf biedt uitgelezen context. Plaatsingsvoorstel ligt voor bij directie van de werf.",                                                              notes_en: "Partnership with the Bataviawerf offers an ideal context. Placement proposal under review by the yard's management.",                             date: 'Ingediend februari 2025' },
  // Candidates
  { name: 'Makkum',                 lat: 53.0567, lng: 5.4019,  status: 'kandidaat', ships: 8,  notes: 'Traditionele jachthaven met sterke Bruine Vloot-aanwezigheid. Eerste contact met gemeente opgenomen; haalbaarheidsonderzoek loopt.',                                            notes_en: 'Traditional marina with strong Bruine Vloot presence. First contact made with municipality; feasibility study under way.',                         date: 'Kandidaat' },
  { name: 'Lemmer',                 lat: 52.8469, lng: 5.7084,  status: 'kandidaat', ships: 12, notes: 'Lemmer is thuishaven van meerdere historische tjalken. Locatiestudie gepland voor zomer 2025.',                                                                                notes_en: 'Lemmer is home port for several historic tjalks. Location study planned for summer 2025.',                                                        date: 'Kandidaat' },
  { name: 'Den Helder',             lat: 52.9562, lng: 4.7602,  status: 'kandidaat', ships: 6,  notes: 'Historische marinestad. Gesprekken met het Marinemuseum Den Helder over gezamenlijk initiatief.',                                                                               notes_en: 'Historic naval town. Talks with the Naval Museum Den Helder about a joint initiative.',                                                           date: 'Kandidaat' },
  { name: 'Kampen',                 lat: 52.5553, lng: 5.9104,  status: 'kandidaat', ships: 5,  notes: 'Historische IJsselstad. Contact gelegd met Stedelijk Museum Kampen.',                                                                                                          notes_en: 'Historic IJssel city. Contact made with the Stedelijk Museum Kampen.',                                                                            date: 'Kandidaat' },
  { name: 'Vollenhove',             lat: 52.6742, lng: 5.9550,  status: 'kandidaat', ships: 4,  notes: 'Klein historisch vissersstadje aan het Zwarte Meer. Gemeente staat positief tegenover het initiatief.',                                                                         notes_en: 'Small historic fishing town on the Zwarte Meer. Municipality is positive about the initiative.',                                                  date: 'Kandidaat' },
  { name: 'Muiden',                 lat: 52.3365, lng: 5.0725,  status: 'kandidaat', ships: 9,  notes: 'Druk bezochte jachthaven bij het Muiderslot. Hoge zichtbaarheid voor dagjesmensen en toeristen.',                                                                              notes_en: 'Busy marina near the Muiderslot castle. High visibility for day-trippers and tourists.',                                                          date: 'Kandidaat' },
  { name: 'Monnickendam',           lat: 52.4573, lng: 5.0295,  status: 'kandidaat', ships: 7,  notes: 'Historisch Waterland-dorp. Locatieoverleg gepland met gemeente Waterland.',                                                                                                    notes_en: 'Historic Waterland village. Location discussion planned with the Municipality of Waterland.',                                                     date: 'Kandidaat' },
  { name: 'Dordrecht',              lat: 51.8069, lng: 4.6681,  status: 'kandidaat', ships: 8,  notes: 'Oudste stad van Holland, rijk scheepvaartverleden. Gesprekken met het Dordrechts Museum positief verlopen.',                                                                    notes_en: 'Oldest city of Holland, rich maritime past. Initial talks with the Dordrechts Museum have been positive.',                                        date: 'Kandidaat' },
  { name: 'Rotterdam — Veerhaven',  lat: 51.9074, lng: 4.4738,  status: 'kandidaat', ships: 11, notes: 'De Veerhaven is een van de drukst bezochte historische havengebieden van Rotterdam.',                                                                                           notes_en: 'The Veerhaven is one of the most visited historic harbour areas in Rotterdam.',                                                                   date: 'Kandidaat' },
  { name: 'Schokland',              lat: 52.6400, lng: 5.8344,  status: 'kandidaat', ships: 2,  notes: 'Voormalig eiland, nu UNESCO Werelderfgoed. Bijzondere symbolische waarde voor een informatiebord over varend erfgoed.',                                                         notes_en: 'Former island, now a UNESCO World Heritage Site. Unique symbolic value for a sailing heritage information board.',                                 date: 'Kandidaat' },
  { name: 'Sneek',                  lat: 53.0335, lng: 5.6598,  status: 'kandidaat', ships: 6,  notes: "Friesland's bekendste watersportstad. Overleg met Waterpoort-organisatie opgestart.",                                                                                          notes_en: "Friesland's best-known watersports city. Discussions with the Waterpoort organisation initiated.",                                               date: 'Kandidaat' },
  { name: 'Giethoorn',              lat: 52.7381, lng: 6.0794,  status: 'kandidaat', ships: 3,  notes: 'Internationaal bekende toeristische bestemming. Gemeente Steenwijkerland positief.',                                                                                            notes_en: 'Internationally known tourist destination. Municipality of Steenwijkerland is positive.',                                                         date: 'Kandidaat' },
]

// ── Blog Posts ────────────────────────────────────────────────────────────────

const blogPosts = [
  {
    title: 'Bruine Vloot',
    title_en: 'Bruine Vloot',
    slug: 'bruine-vloot',
    date: '2026-01-20T00:00:00.000Z',
    category: 'Erfgoed',
    category_en: 'Heritage',
    author: 'Peter Fokkens',
    authorPhoto: photos['team/peter-fokkens.webp'],
    readTime: '5 min',
    coverImage: photos['blog/bruine-vloot/het_vloot_vertrekt.jpg'],
    excerpt: 'Het IJsselmeer ligt er wat grijs bij, maar we zijn niet de enigen op het water. Een dag op de Bruine Vloot — een reis terug in de tijd, met schipper Noor aan het roer.',
    excerpt_en: 'The IJsselmeer looks somewhat grey, but we are not alone on the water. A day on the Bruine Vloot — a journey back in time, with skipper Noor at the helm.',
    body: [
      { text: 'Het IJsselmeer ligt er wat grijs bij, maar we zijn niet de enigen op het water. De zon schijnt wel, maar er dreigt een grote, donkere bui. Die geeft het IJsselmeer een bijzonder aanzien. Gelukkig zijn er verderop weer wat blauwe plekken tussen de donderwolken. In het lage ochtendlicht is het water donkerder dan anders, en de korte golven lichten met een speciaal zilver op. Daarboven krijgen de zeilen van de charterschepen om ons heen een speciale kleur, bijna alsof ze doorschijnend zijn.' },
      { text: 'Er is geen jacht in de buurt, en we wanen ons honderd jaar terug in de tijd, onderweg van Holland naar Friesland, met lading in, in konvooi de Zuiderzee over. Ik sta op het achterdek, waar schipper Noor de koers verlegt naar het Noorden.' },
      { text: '\'Als ik in een of ander ver buitenland zou zijn, me afvragend met welke speciale tradities van dat land ik beslist kennis zou willen maken, en ik zou zoiets als dit vinden in de Lonely Planet, dan zou ik er dagen voor omreizen om het mee te maken,\' zeg ik, \'Maar hier in Nederland hoor je eigenlijk zelden iets over de Bruine Vloot. Ja, in coronatijd, toen bleek hoe moeilijk jullie het kregen en iedereen besefte dat we dat varend erfgoed toch wel erg graag willen behouden. Maar verder doet iedereen alsof het de gewoonste zaak van de wereld is, of ze weten niet eens dat er zoiets als een bruine vloot bestaat.\'' },
      { text: 'Noor knikt. \'Nou, vergeet niet dat er in de afgelopen jaren ook een paar ongelukken breed in het nieuws zijn geweest. Dat was, net als corona, voor ons ook geen feest, al heeft het de vloot er wel toe gebracht om qua veiligheid de puntjes weer eens op de \'i\' te zetten. Er was in bijna dertig jaar praktisch nooit iets gebeurd, dan is het goed om weer even wakker geschud te worden.\'' },
      { text: 'Ik kijk naar de bollende zeilen. \'Ja, dat zal ongetwijfeld. In dat opzicht is het goed dat er volop aandacht is voor de veiligheid. Maar heb jij nou het gevoel dat jullie zo bekend zijn in dit land? Terwijl, dit is toch net alsof je weer honderd jaar terug bent in de geschiedenis? En hoe mooi is het niet op het water, zelfs op een grijze dag als deze?\'' },
      { text: 'Noor kijkt me aan. \'Je verwoordt precies wat ik altijd aan mijn gasten probeer over te brengen,\' antwoordt ze. \'Als je nu goed om je heen kijkt, een klein beetje door je oogharen misschien, dan zie je wat dit land groot en bijzonder heeft gemaakt; zeilende vracht- en vissersschepen, het vervoer over water, met enkel natuurlijke hulpbronnen, de wind, en als je niet meer tegen de wind op kon, wachtte je op beter weer. Ik zeg niet dat het beter was dan nu, maar ik heb gemerkt dat ik mij aan boord veel bewuster ben van de elementen, en daardoor ook bewuster omga met mijn omgeving, niet alleen met het schip en het milieu, maar ook met de mensen.\'' },
      { text: 'Ik blijf nog lang op het achterdek, en dat ligt niet alleen aan het feit dat onder de indruk ben van Noor. Ze is zelfverzekerd en straalt een kundigheid uit die haar natuurlijke autoriteit verleent, waardoor ze al haar energie kan steken in het uitstralen van iets anders, authenticiteit, warmte, maar zonder dat het klef wordt. Er komen meer mensen naar achteren, en de gesprekken gaan voort, vloeien naadloos over van schoonheid en traditie naar meer persoonlijke zaken, en dan blijkt dat daar weinig verschil tussen zit; wie bezig is met een vak dat zo verweven is met de elementen, en met de zorg voor zoiets kostbaars als een historisch schip, heeft bijna automatisch ook zorg voor het milieu, en voor mensen.' },
      { text: 'Aan het eind van de dag, na het hele IJsselmeer gezien te hebben, zeilen we Workum binnen. Noor heeft speciaal gekozen voor deze haven, omdat \'t Soal bezeild is. Met alleen nog grootzeil en fok drijven we op de stad aan. Vlak voor het havenkommetje strijken we, en Robin zet de motor aan. Op haar gemak draait ze het schip, zodat we goed tien minuten later met de kop naar buiten liggen, samen met nog drie schepen van de bruine vloot. Aan de overkant van het water liggen een paar mooie jachten, maar alle foto\'s van voorbijkomende wandelaars worden van onze schepen gemaakt.' },
    ],
    body_en: [
      { text: 'The IJsselmeer looks somewhat grey, but we are not alone on the water. The sun is shining, but a large, dark squall is threatening. It gives the IJsselmeer a remarkable character. Fortunately, there are patches of blue further on between the storm clouds. In the low morning light the water is darker than usual, and the short waves shimmer with a special silver. Above them, the sails of the charter ships around us take on a special colour, almost as if they were translucent.' },
      { text: 'There is not a yacht in sight, and we feel transported a hundred years back in time, sailing from Holland to Friesland, laden with cargo, crossing the Zuiderzee in convoy. I stand on the after deck, where skipper Noor adjusts course toward the North.' },
      { text: "'If I were somewhere far abroad, wondering which special traditions of that country I absolutely had to experience, and I found something like this in the Lonely Planet, I would travel days out of my way to be here,' I say. 'But here in the Netherlands you rarely hear anything about the Bruine Vloot. Yes, during the pandemic it became clear how difficult things were for you, and everyone realised how much we want to preserve this sailing heritage. But otherwise everyone treats it as the most ordinary thing in the world — or they don't even know something like a Bruine Vloot exists.'" },
      { text: "Noor nods. 'Well, don't forget that in recent years a couple of accidents also made the news widely. That was, just like the pandemic, no fun for us either — though it did prompt the fleet to cross the t's and dot the i's on safety again. Almost nothing had gone wrong in nearly thirty years, so it was good to get a wake-up call.'" },
      { text: "I look at the billowing sails. 'Yes, no doubt about that. In that respect it's good that safety receives full attention. But do you feel that you are well known in this country? Because this feels like being transported a hundred years back in history. And how beautiful it is on the water, even on a grey day like today.'" },
      { text: "Noor looks at me. 'You are putting into words exactly what I always try to convey to my guests,' she replies. 'If you look carefully around you now — squint a little perhaps — you see what made this country great and special: sailing cargo and fishing ships, transport by water, using only natural resources, the wind, and when you could no longer sail into the wind, you waited for better weather. I'm not saying it was better than now, but I've noticed that on board I'm far more aware of the elements, and through that I'm also more mindful of my surroundings — not just the ship and the environment, but people too.'" },
      { text: "I stay on the after deck for a long time, and that is not only because I am impressed by Noor. She is confident and radiates a competence that grants her natural authority, freeing all her energy to project something else — authenticity, warmth, without it becoming cloying. More people come aft, and the conversations continue, flowing seamlessly from beauty and tradition to more personal matters; it turns out there is little difference between the two. Anyone engaged in a craft so intertwined with the elements, and with caring for something as precious as a historic ship, almost automatically also cares for the environment and for people." },
      { text: "At the end of the day, after seeing the entire IJsselmeer, we sail into Workum. Noor has deliberately chosen this harbour because 't Soal can be sailed into. Under mainsail and jib alone we drift toward the town. Just before the harbour entrance we strike the sails and Robin starts the engine. Unhurried, she turns the ship, so that a good ten minutes later we are lying bow-out together with three other Bruine Vloot vessels. On the far side of the water are some handsome yachts, but every passing walker points a camera at our ships." },
    ],
    images: [
      { image: photos['blog/bruine-vloot/op_het_ijsselmeer.jpg'], alt: 'Op het IJsselmeer', after: 5 },
    ],
  },
]

// ── Media items (videos + podcast) ───────────────────────────────────────────

console.log('  Uploading videos…')

// Clear existing media items first
const { docs: existingItems } = await payload.find({ collection: 'media-items', limit: 1000, pagination: false })
for (const doc of existingItems) await payload.delete({ collection: 'media-items', id: doc.id })

const videos: Record<string, number> = {}
const videoFiles = [
  'Waterschatten-een-impressie-van-de-chartervaart.mp4',
  'Marijke-de-Jong-tuigage-stabiliteitsberekeningen-docent.mp4',
  'Renee-schipper-van-de-Bontekoe.mp4',
  'De-vloot-en-de-haven_-niet-uit-de-drukken-in-geld.mp4',
  'De-Bruine-Vloot-en-de-havens.mp4',
  'Patrick-zeilmaker.mp4',
  'Tess-op-zee.mp4',
]
for (const filename of videoFiles) {
  const doc = await uploadVideo(filename)
  videos[filename] = doc.id as number
}

const mediaItems = [
  {
    type: 'video',
    title: 'Waterschatten, een impressie van de chartervaart',
    title_en: 'Water Treasures, an impression of the charter industry',
    description: 'De film laat zien waarom de Nederlandse chartervaart zo bijzonder is. Met sfeervolle beelden van traditionele zeilschepen, vakmanschap aan boord en op de wal, en het varen op IJsselmeer en Waddenzee, toont de film hoe uniek deze vloot is. Tegelijk vraagt hij aandacht voor de kwetsbare positie van de sector, zeker in tijden van crisis.',
    description_en: 'The film shows why Dutch charter sailing is so special. With atmospheric images of traditional sailing vessels, craftsmanship on board and ashore, and sailing on the IJsselmeer and Wadden Sea, the film shows how unique this fleet is. It also draws attention to the vulnerable position of the sector, especially in times of crisis.',
    category: 'video',
    tag: 'Erfgoed',
    tag_en: 'Heritage',
    format: 'MP4',
    file: videos['Waterschatten-een-impressie-van-de-chartervaart.mp4'],
  },
  {
    type: 'video',
    title: 'Marijke de Jong',
    title_en: 'Marijke de Jong',
    description: 'Scheepsbouwkundige Marijke de Jong als ontwerper en adviseur voor de zeilende chartervaart. Ze vertelt over veilig en mooi schepen bouwen, haar werk voor rederijen en de Enkhuizer Zeevaartschool en waarom goed ontwerp essentieel is om de historische vloot toekomst te geven.',
    description_en: 'Naval architect Marijke de Jong as a designer and adviser for the sailing charter industry. She talks about building safe and beautiful ships, her work for shipping companies and the Enkhuizer Nautical College, and why good design is essential to give the historic fleet a future.',
    category: 'video',
    tag: 'Vakmanschap',
    tag_en: 'Craftsmanship',
    format: 'MP4',
    file: videos['Marijke-de-Jong-tuigage-stabiliteitsberekeningen-docent.mp4'],
  },
  {
    type: 'video',
    title: 'Renée, schipper van de Bontekoe',
    title_en: 'Renée, skipper of the Bontekoe',
    description: 'Renée vertelt over haar leven en werk als schipper op een traditioneel zeilschip. De video benadrukt haar passie, vakmanschap en de vrijheid op het water.',
    description_en: 'Renée talks about her life and work as a skipper on a traditional sailing vessel. The video highlights her passion, craftsmanship and the freedom on the water.',
    category: 'video',
    tag: 'Portret',
    tag_en: 'Portrait',
    format: 'MP4',
    file: videos['Renee-schipper-van-de-Bontekoe.mp4'],
  },
  {
    type: 'video',
    title: 'De vloot en de haven. Niet uit te drukken in geld!',
    title_en: 'The fleet and the harbour. Beyond price!',
    description: 'De Bruine Vloot en historische havens versterken elkaar. De schepen zorgen voor sfeer, levendig toerisme, lokale werkgelegenheid, onderwijs en cultureel erfgoed. Zonder vloot geen échte haven — en dat is in geld niet te vangen.',
    description_en: 'The Bruine Vloot and historic harbours reinforce each other. The ships provide atmosphere, vibrant tourism, local employment, education and cultural heritage. Without the fleet there is no real harbour — and that cannot be expressed in money.',
    category: 'video',
    tag: 'Erfgoed',
    tag_en: 'Heritage',
    format: 'MP4',
    file: videos['De-vloot-en-de-haven_-niet-uit-de-drukken-in-geld.mp4'],
  },
  {
    type: 'video',
    title: 'De Bruine Vloot en de havens',
    title_en: 'The Bruine Vloot and the harbours',
    description: 'Hoe belangrijk de traditionele zeilschepen zijn voor de Nederlandse havens. Schippers en andere betrokkenen vertellen over de sfeer, het erfgoed en de economische waarde die deze schepen meebrengen aan levendige, aantrekkelijke havensteden.',
    description_en: 'How important the traditional sailing ships are to Dutch harbours. Skippers and others involved talk about the atmosphere, heritage and economic value these vessels bring to vibrant, attractive harbour towns.',
    category: 'video',
    tag: 'Erfgoed',
    tag_en: 'Heritage',
    format: 'MP4',
    file: videos['De-Bruine-Vloot-en-de-havens.mp4'],
  },
  {
    type: 'video',
    title: 'Patrick, zeilmaker',
    title_en: 'Patrick, sailmaker',
    description: 'Patrick, zeilmaker voor de historische chartervloot, toont zijn ambacht van zeilen ontwerpen, repareren en onderhouden. Zijn passie en vakmanschap zijn cruciaal voor het behoud van varend erfgoed.',
    description_en: 'Patrick, a sailmaker for the historic charter fleet, demonstrates his craft of designing, repairing and maintaining sails. His passion and craftsmanship are crucial to preserving floating heritage.',
    category: 'video',
    tag: 'Vakmanschap',
    tag_en: 'Craftsmanship',
    format: 'MP4',
    file: videos['Patrick-zeilmaker.mp4'],
  },
  {
    type: 'video',
    title: 'Tess op zee',
    title_en: 'Tess at sea',
    description: 'Tess vertelt over haar ervaringen als bemanningslid op een traditioneel zeilschip. Een persoonlijk portret van het leven op het water en de liefde voor de Bruine Vloot.',
    description_en: 'Tess talks about her experiences as a crew member on a traditional sailing vessel. A personal portrait of life on the water and the love for the Bruine Vloot.',
    category: 'video',
    tag: 'Portret',
    tag_en: 'Portrait',
    format: 'MP4',
    file: videos['Tess-op-zee.mp4'],
  },
  {
    type: 'podcast',
    title: 'Roefgesprekken',
    title_en: 'Roefgesprekken',
    description: 'Podcast met verhalen van zeevarenden: kapiteins, stuurmannen en vrouwen, schepenskoks, matrozen en anderen werkzaam op een schip. Een initiatief van Peter Fokkens voor Stichting Zeilschipper.',
    description_en: 'Podcast featuring stories from seafarers: captains, mates, ship cooks, sailors and others who work aboard a ship. An initiative by Peter Fokkens for Stichting Zeilschipper.',
    category: 'podcast',
    tag: 'Podcast',
    tag_en: 'Podcast',
    format: 'MP3',
    externalUrl: 'https://www.stichtingzeilschipper.nl/podcasts/roefgesprekken/',
  },
]

// ── Globals ───────────────────────────────────────────────────────────────────

const siteSettingsData = {
  orgName:       'Stichting Zeilschipper',
  brandSubtitle: 'Bruine Vloot',
  contactEmail:  'info@zeilschipper.nl',
  addressLine1:  'Aambeeldstraat 20',
  addressLine2:  '1021 KB Amsterdam',
  footerTagline:    'Wij werken aan UNESCO-erkenning van het ambacht van de schipper Bruine Vloot als immaterieel cultureel erfgoed van de mensheid.',
  footerTagline_en: 'We work towards UNESCO recognition of the craft of the Bruine Vloot skipper as intangible cultural heritage of humanity.',
}

const infoBoardsPageData = {
  title:       'Twintig havens, één verhaal',
  title_en:    'Twenty harbours, one story',
  description:    'In samenwerking met havengemeenten plaatsen wij informatieborden die het ambacht van de schipper Bruine Vloot vertellen. Elke locatie is een ankerpunt in het levende erfgoed.',
  description_en: 'In collaboration with harbour municipalities we place information boards that tell the story of the Bruine Vloot skipper. Each location is an anchor point in the living heritage.',
}

const teamPageData = {
  title:    'De mensen achter\nStichting Zeilschipper',
  title_en: 'The people behind\nStichting Zeilschipper',
  intro:    'Ons bestuur combineert praktische scheepvaartervaring met wetenschappelijke expertise en beleidservaring. Allemaal onbezoldigd, allemaal overtuigd van het belang van dit erfgoed.',
  intro_en: 'Our board combines practical maritime experience with scientific expertise and policy experience. All unpaid, all convinced of the importance of this heritage.',
  advisoryTitle:    'Een brede coalitie van experts',
  advisoryTitle_en: 'A broad coalition of experts',
  advisoryBody:    'Onze Raad van Advies bestaat uit maritiem historici, erfgoedspecialisten, zeilers en beleidsmakers die ons inhoudelijk adviseren. Neem contact op voor de volledige samenstelling.',
  advisoryBody_en: 'Our Advisory Board consists of maritime historians, heritage specialists, sailors and policy makers who advise us on content. Please contact us for the full composition.',
}

const mediaPageData = {
  title:       'Downloadcentrum',
  title_en:    'Download Centre',
  description:    "Video's, persfoto's, teksten en podcasts voor pers, onderzoekers en geïnteresseerden. Alle materialen zijn vrij beschikbaar voor niet-commercieel gebruik met bronvermelding.",
  description_en: "Videos, press photos, texts and podcasts for press, researchers and the interested public. All materials are freely available for non-commercial use with attribution.",
  promotionLabel:    'Promotiefilm · Vloot',
  promotionLabel_en: 'Promotional film · Fleet',
  featuredTitle:    'Waterschatten',
  featuredTitle_en: 'Waterschatten',
  featuredBody:    'Een door de BBZ gemaakte promotiefilm die heel goed gebruikt kan worden om de Bruine Vloot, haar bemanning en de bijbehorende beroepsvelden voor te stellen.',
  featuredBody_en: 'A promotional film made by the BBZ that can be used very effectively to introduce the Bruine Vloot, its crew and the associated professional fields.',
  featuredThumbnail: photos['waterschatten-thumbnail.jpg'],
  podcastTitle:    'Roefgesprekken',
  podcastTitle_en: 'Roefgesprekken',
  podcastBody:    'Podcast met verhalen van zeevarenden: kapiteins, stuurmannen en vrouwen, scheepskoks, matrozen en anderen werkzaam op een schip.',
  podcastBody_en: 'Podcast featuring stories from seafarers: captains, mates, ship cooks, sailors and others working on a ship.',
  pressTitle:    'Journalisten & onderzoekers',
  pressTitle_en: 'Journalists & researchers',
  pressBody:    'Voor exclusief beeldmateriaal, interviews of toegang tot het volledige kennisarchief kunt u contact opnemen via pers@zeilschipper.nl',
  pressBody_en: 'For exclusive visuals, interviews or access to the full knowledge archive, please contact pers@zeilschipper.nl',
}

const unescoPageData = {
  heroTitle:    'Waarom UNESCO-erkenning\nessentieel is',
  heroTitle_en: 'Why UNESCO recognition\nis essential',
  heroPara:    'UNESCO-erkenning als Immaterieel Cultureel Erfgoed van de Mensheid geeft het ambacht internationale bescherming, vergroot de financieringsmogelijkheden en verplicht Nederland tot actief beleid voor kennisbehoud.',
  heroPara_en: 'UNESCO recognition as Intangible Cultural Heritage of Humanity gives the craft international protection, expands financing opportunities and obliges the Netherlands to pursue active policies for knowledge preservation.',
  criteria: [
    {
      code: 'R.1', status: 'sterk',
      title:    'Het element is immaterieel cultureel erfgoed',
      title_en: 'The element is intangible cultural heritage',
      body:    'Het ambacht van de schipper Bruine Vloot omvat traditionele navigatietechnieken, zeilvaardigheid, tij- en weerkennis, scheepsonderhoud en de sociale organisatie van het leven aan boord. Deze kennis wordt mondeling en praktisch overgedragen en leeft in een actieve gemeenschap van circa 280 schippers en duizenden bemanningsleden.',
      body_en: 'The craft of the Bruine Vloot skipper encompasses traditional navigation techniques, sailing skills, tidal and weather knowledge, ship maintenance and the social organisation of life on board. This knowledge is transmitted orally and practically and lives within an active community of approximately 280 skippers and thousands of crew members.',
      evidence: [
        { text: 'Ethnografische documentatie (2021–2024)',            text_en: 'Ethnographic documentation (2021–2024)' },
        { text: 'Videodossier "Handen aan het Roer"',                  text_en: 'Video dossier "Handen aan het Roer"' },
        { text: 'Opname Inventaris Immaterieel Erfgoed NL (2024)',     text_en: 'Inclusion in Intangible Heritage Inventory NL (2024)' },
      ],
    },
    {
      code: 'R.2', status: 'sterk',
      title:    'Opname bevordert zichtbaarheid en bewustwording',
      title_en: 'Inscription promotes visibility and awareness',
      body:    'UNESCO-erkenning zal de internationale zichtbaarheid van het ambacht vergroten, de status van schippers verhogen en financiering voor kennisoverdracht vergemakkelijken. Nederland heeft een rijke traditie van UNESCO-erfgoedprogramma\'s waarop wij kunnen voortbouwen.',
      body_en: "UNESCO recognition will increase the craft's international visibility, raise the status of skippers and facilitate funding for knowledge transfer. The Netherlands has a rich tradition of UNESCO heritage programmes to build upon.",
      evidence: [
        { text: 'Analyse impact eerdere NL-nominaties',  text_en: 'Impact analysis of previous NL nominations' },
        { text: 'Verklaring Ministerie OCW',             text_en: 'Statement from Ministry of Education' },
        { text: 'Mediabereik: 2,4M impressies/jaar',     text_en: 'Media reach: 2.4M impressions/year' },
      ],
    },
    {
      code: 'R.3', status: 'sterk',
      title:    'Beschermingsmaatregelen zijn getroffen',
      title_en: 'Safeguarding measures have been taken',
      body:    'De stichting hanteert een meester-gezel-systeem voor kennisoverdracht, beheert een digitaal kennisarchief, publiceert informatieborden in twintig havens en coördineert een jaarlijks opleidingsprogramma voor vijftien aspirant-schippers.',
      body_en: 'The foundation employs a master-apprentice system for knowledge transfer, manages a digital knowledge archive, publishes information boards in twenty harbours and coordinates an annual training programme for fifteen aspiring skippers.',
      evidence: [
        { text: 'Opleidingsplan 2024–2029',                      text_en: 'Training plan 2024–2029' },
        { text: 'Digitaal kennisarchief (RCE-gecertificeerd)',    text_en: 'Digital knowledge archive (RCE-certified)' },
        { text: 'Netwerk van twintig informatieborden',           text_en: 'Network of twenty information boards' },
      ],
    },
    {
      code: 'R.4', status: 'goed',
      title:    'Gemeenschap, groep of individuen hebben ingestemd',
      title_en: 'Community, group or individuals have given consent',
      body:    'De Vereniging Bruine Vloot (VBV, 320 leden), het merendeel van de schippers en de betrokken havengemeenten hebben formeel ingestemd met de nominatie via ondertekende steunverklaringen.',
      body_en: 'The Vereniging Bruine Vloot (VBV, 320 members), the majority of skippers and the involved harbour municipalities have formally consented to the nomination through signed support declarations.',
      evidence: [
        { text: 'Steunverklaring VBV (320 leden)',               text_en: 'Support declaration VBV (320 members)' },
        { text: '187 individuele schipper-handtekeningen',        text_en: '187 individual skipper signatures' },
        { text: 'Gemeenteraadsbesluiten 8 havengemeenten',        text_en: 'Municipal council resolutions from 8 harbour municipalities' },
      ],
    },
    {
      code: 'R.5', status: 'afgerond',
      title:    'Het element staat op de nationale inventaris',
      title_en: 'The element is on the national inventory',
      body:    'Op 5 oktober 2024 heeft de Inventaris Immaterieel Erfgoed Nederland het ambacht van de schipper Bruine Vloot formeel opgenomen. Dit is een wettelijk vereiste voor UNESCO-nominatie vanuit Nederland.',
      body_en: 'On 5 October 2024, the Inventory of Intangible Heritage of the Netherlands formally included the craft of the Bruine Vloot skipper. This is a statutory requirement for UNESCO nomination from the Netherlands.',
      evidence: [
        { text: 'Opnamebesluit Inventaris IEN (5 okt 2024)',  text_en: 'Inclusion decision Inventory IEN (5 Oct 2024)' },
        { text: 'Publicatie Staatscourant nr. 48291',          text_en: 'Publication Government Gazette no. 48291' },
        { text: 'Bevestiging RCE 12 okt 2024',                 text_en: 'Confirmation RCE 12 Oct 2024' },
      ],
    },
  ],
}

const homePageData = {
  heroBadge:    'Stichting Zeilschipper — UNESCO-nominatie',
  heroBadge_en: 'Stichting Zeilschipper — UNESCO Nomination',
  heroTitle:    'Voor velen meer dan een beroep —\nhet is een levensstijl',
  heroTitle_en: 'For many more than a profession —\nit is a lifestyle',
  heroPara1:    'Deze website is een initiatief van een groep mensen die zich inzet voor het behoud van het beroep zeilschipper, ook wel Schipper Bruine Vloot genoemd.',
  heroPara1_en: 'This website is an initiative of a group of people committed to preserving the profession of sailing skipper, also known as Schipper Bruine Vloot.',
  heroPara2:    'Een zeilschipper vaart samen met passagiers op traditionele zeilschepen voor recreatieve en educatieve doeleinden — op de Nederlandse binnenwateren, de Waddenzee en wereldwijd op zee. Schippers kiezen het vak uit liefde voor het varen, voor de traditionele schepen en voor de omgang met mensen.',
  heroPara2_en: 'A sailing skipper sails with passengers on traditional sailing ships for recreational and educational purposes — on the Dutch inland waterways, the Wadden Sea and worldwide at sea. Skippers choose the profession out of love for sailing, for traditional ships and for working with people.',
  ctaPrimary:    'Steun het dossier',
  ctaPrimary_en: 'Support the dossier',
  ctaSecondary:    'Bekijk de vloot',
  ctaSecondary_en: 'View the fleet',
  scrollHint:    'Scroll voor de reis',
  scrollHint_en: 'Scroll for the journey',
  scrollPhotos: [
    { photo: photos['pics/sven-homepage.webp'] },
    { photo: photos['pics/jordie-1.webp'] },
    { photo: photos['pics/sven-2.webp'] },
    { photo: photos['pics/jordie-6.webp'] },
    { photo: photos['pics/sven-4.webp'] },
    { photo: photos['pics/jordi-morales.webp'] },
    { photo: photos['pics/sven-7.webp'] },
    { photo: photos['pics/jordie-5.jpg'] },
    { photo: photos['pics/sven-5.webp'] },
    { photo: photos['pics/jordie-3.jpg'] },
    { photo: photos['pics/sven-1.webp'] },
    { photo: photos['pics/sven-3.webp'] },
  ],
  chapters: [
    {
      title: 'Nederland', title_en: 'Netherlands',
      sub:   'Nederlandse wateren', sub_en: 'Dutch Waters',
      body:    'De Waddenzee, het IJsselmeer en de binnenwateren zijn de wieg van de Bruine Vloot. Hier leerden generaties schippers lezen: het tij, de wind, de bodem. Kennis die nergens anders verworven kan worden.',
      body_en: 'The Wadden Sea, the IJsselmeer and the inland waterways are the cradle of the Bruine Vloot. Here generations of skippers learned to read: the tide, the wind, the seabed. Knowledge that cannot be acquired anywhere else.',
      photo: photos['pics/jordie-2.webp'], photoPosition: 'center 70%',
    },
    {
      title: 'Europa', title_en: 'Europe',
      sub:   'Europese wateren', sub_en: 'European Waters',
      body:    'Van de Baltische Zee tot de Middellandse Zee bevaren Bruine Vloot schippers routes die al eeuwen bestaan. De kennis zit niet op kaarten — die zit in handen en geheugen.',
      body_en: 'From the Baltic Sea to the Mediterranean, Bruine Vloot skippers sail routes that have existed for centuries. The knowledge is not on charts — it lives in hands and memory.',
      photo: photos['pics/jordie-4.webp'], photoPosition: 'center center',
    },
    {
      title: 'De wereld', title_en: 'The world',
      sub:   'Wereldwateren', sub_en: 'Worldwide',
      body:    'Trans-Atlantisch. Kaap Hoorn. Antarctica. Schippers van de Bruine Vloot hebben de zwaarste wateren ter wereld bedwongen met schepen van hout en staal die soms meer dan een eeuw oud zijn.',
      body_en: 'Trans-Atlantic. Cape Horn. Antarctica. Bruine Vloot skippers have conquered the world\'s harshest waters in ships of wood and steel sometimes more than a century old.',
      photo: photos['pics/sven-6.webp'], photoPosition: 'center center',
    },
    {
      title: 'Terug naar de haven', title_en: 'Back to port',
      sub:   'Thuishaven', sub_en: 'Return to Port',
      body:    'En dan is er de thuiskomst — in een van de tientallen historische havens verspreid over Nederland. Plekken waar informatieborden staan, waar kennisoverdracht plaatsvindt, waar de volgende schipper zijn eerste les krijgt op de kade.',
      body_en: 'And then there is the homecoming — in one of the dozens of historic harbours spread across the Netherlands. Places where information boards stand, where knowledge is transferred, where the next skipper receives their first lesson on the quayside.',
      photo: null, photoPosition: 'center center',
    },
  ],
  statsCaption:    'Het ecosysteem van het immaterieel erfgoed Schipper Bruine Vloot in cijfers.',
  statsCaption_en: 'The ecosystem of the intangible heritage Schipper Bruine Vloot in numbers.',
  stats: [
    { value: 5500,  prefix: '~ ', suffix: '*', label: 'Schippers & Matrozen', label_en: 'Skippers & Sailors' },
    { value: 365,   prefix: '~ ', suffix: '',  label: 'Schepen',              label_en: 'Ships' },
    { value: 60,    prefix: '> ', suffix: '*', label: 'Bestaansjaren',         label_en: 'Years of existence' },
    { value: 47000, prefix: '',   suffix: '',  label: 'Vaardagen (2024)',       label_en: 'Sailing days (2024)' },
  ],
  pillarsTitle:    'Wat maakt de schipper\ntot immaterieel erfgoed?',
  pillarsTitle_en: 'What makes the skipper\nintangible heritage?',
  pillars: [
    {
      n: '01',
      title:    'De schipper als spil',
      title_en: 'The skipper as central figure',
      body:    'De schipper van de Bruine Vloot stuurt niet alleen het schip — hij ontvangt gasten, instrueert de bemanning, draagt kennis over, onderhoudt het schip en bewaakt continu de veiligheid. Daarbij staat hij in verbinding met een compleet ecosysteem van bemanningsleden, werven en zeil- en mastenmakers, met de schipper als centrale schakel.',
      body_en: 'The Bruine Vloot skipper does not only steer the ship — they receive guests, instruct the crew, transfer knowledge, maintain the ship and continuously monitor safety. In doing so, they are connected to a complete ecosystem of crew members, shipyards and sail and mast makers, with the skipper as the central link.',
    },
    {
      n: '02',
      title:    'Veel kennis & vaardigheden',
      title_en: 'Extensive knowledge & skills',
      body:    "Van traditionele navigatie en zeiltrimmen tot meteorologie, scheepsonderhoud en crisismanagement op open water. Vrijwel elke schipper begon als maat of 'deckie' — het vak wordt geleerd van dag één, in de praktijk. Via collega's, experts en zeilevenementen zoals de Strontrace en de Beurtveer worden kennis en vaardigheden steeds verder verdiept.",
      body_en: "From traditional navigation and sail trimming to meteorology, ship maintenance and crisis management on open water. Almost every skipper began as a mate or 'deckie' — the trade is learned from day one, in practice. Through colleagues, experts and sailing events such as the Strontrace and the Beurtveer, knowledge and skills are continually deepened.",
    },
    {
      n: '03',
      title:    'Kennisoverdracht',
      title_en: 'Knowledge transfer',
      body:    'Een goede schipper investeert actief in de volgende generatie: hij legt uit, corrigeert en begeleidt. De tienduizenden passagiers die jaarlijks meevaren worden regelmatig betrokken bij het zeilen — ze hijsen zeilen, bedienen zwaarden, lopen wacht — altijd onder toezicht van de schipper. Zo groeit het begrip voor dit levende erfgoed.',
      body_en: 'A good skipper actively invests in the next generation: explaining, correcting and guiding. The tens of thousands of passengers who sail along each year are regularly involved in sailing — hoisting sails, operating centreboards, standing watch — always under the supervision of the skipper. This grows understanding of this living heritage.',
    },
  ],
  unescoSectionBadge:    'Road to UNESCO',
  unescoSectionBadge_en: 'Road to UNESCO',
  unescoSectionTitle:    'Wij bouwen het sterkste dossier dat de Bruine Vloot ooit heeft gehad',
  unescoSectionTitle_en: 'We are building the strongest dossier the Bruine Vloot has ever had',
  unescoSectionBody:    'Tijdens de Corona-epidemie bleek hoe kwetsbaar de situatie was. In juni 2020 kwamen meer dan 150 schepen samen bij Pampus — de steun die volgde maakte duidelijk dat dit erfgoed ertoe doet. In 2023 werd het ambacht opgenomen in de Inventaris Immaterieel Erfgoed Nederland. Ons ultieme doel is erkenning door UNESCO.',
  unescoSectionBody_en: 'During the Corona pandemic it became clear how vulnerable the situation was. In June 2020 more than 150 ships gathered at Pampus — the support that followed made clear that this heritage matters. In 2023 the craft was included in the Inventory of Intangible Heritage of the Netherlands. Our ultimate goal is recognition by UNESCO.',
  unescoSectionCta:    'Bekijk het traject →',
  unescoSectionCta_en: 'View the process →',
  projectsBadge:       'Projecten',
  projectsBadge_en:    'Projects',
  projectsTitle:       'Wat wij doen',
  projectsTitle_en:    'What we do',
  projectsReadMore:    'Lees meer →',
  projectsReadMore_en: 'Read more →',
  projects: [
    {
      n: '01', action: 'unesco',
      title:    'UNESCO-nomineringsdossier',
      title_en: 'UNESCO Nomination Dossier',
      body:    'Documentatie, wetenschappelijke onderbouwing en internationale lobby voor opname op de Representatieve Lijst van Immaterieel Cultureel Erfgoed.',
      body_en: 'Documentation, scientific substantiation and international lobbying for inclusion on the Representative List of Intangible Cultural Heritage.',
    },
    {
      n: '02', action: 'informatieborden',
      title:    'Informatieborden-netwerk',
      title_en: 'Information Boards Network',
      body:    'In twintig Nederlandse havens plaatsen wij borden die het verhaal van de schipper Bruine Vloot vertellen aan omwonenden en bezoekers.',
      body_en: 'In twenty Dutch harbours we place boards that tell the story of the Bruine Vloot skipper to residents and visitors.',
    },
    {
      n: '03', action: 'team',
      title:    'Kennisoverdracht & opleiding',
      title_en: 'Knowledge transfer & training',
      body:    'Via het meester-gezel-systeem koppelen wij aspirant-schippers aan ervaren mentors. Jaarlijks vijftien nieuwe deelnemers in een intensief programma.',
      body_en: 'Through the master-apprentice system we connect aspiring skippers with experienced mentors. Fifteen new participants per year in an intensive programme.',
    },
  ],
  oralBadge:    'Project',
  oralBadge_en: 'Project',
  oralTitle:    'Oral History',
  oralTitle_en: 'Oral History',
  oralPara1:    'Stichting Zeilschipper wil een aantal eerste generatie Bruine Vloot schippers interviewen en deze interviews laten opnemen in een museumcollectie.',
  oralPara1_en: 'Stichting Zeilschipper aims to interview a number of first-generation Bruine Vloot skippers and have these interviews included in a museum collection.',
  oralPara2:    'Er heeft nooit historisch onderzoek plaatsgevonden naar deze beroepsgroep die al ruim vijftig jaar bestaat. Hoe is de sector ontstaan? Hoe zag de dagelijkse praktijk eruit? Wat bewoog schippers om dit vak te kiezen?',
  oralPara2_en: 'No historical research has ever been conducted on this professional group that has existed for over fifty years. How did the sector originate? What did daily practice look like? What motivated skippers to choose this profession?',
  oralPara3:    'Aangezien veel schippers die in de jaren 1960 en 1970 begonnen nu al op hoge leeftijd zijn, is het vastleggen van hun verhalen en ervaring urgent.',
  oralPara3_en: 'Since many skippers who began in the 1960s and 1970s are now of advanced age, documenting their stories and experience is urgent.',
  oralNote:    'Samenwerkingspartners en mogelijkheden worden momenteel onderzocht.',
  oralNote_en: 'Collaboration partners and opportunities are currently being explored.',
  oralItems: [
    {
      n: '01',
      title:    'Interviews eerste generatie',
      title_en: 'First-generation interviews',
      body:    'Diepte-interviews met schippers die begonnen in de jaren 1960 en 1970 — over het ontstaan van de sector, de dagelijkse praktijk en de persoonlijke drijfveren om dit vak uit te oefenen.',
      body_en: 'In-depth interviews with skippers who began in the 1960s and 1970s — about the origin of the sector, daily practice and the personal motivations for choosing this profession.',
    },
    {
      n: '02',
      title:    'Onderzoekspotentie',
      title_en: 'Research potential',
      body:    'Er zijn wel publieksboeken over de Bruine Vloot verschenen, maar wetenschappelijk onderzoek naar deze beroepsgroep ontbreekt. De oral history vormt een unieke primaire bron voor toekomstig onderzoek.',
      body_en: 'Popular books about the Bruine Vloot have been published, but scientific research on this professional group is absent. The oral history forms a unique primary source for future research.',
    },
    {
      n: '03',
      title:    'Museumcollectie',
      title_en: 'Museum collection',
      body:    'De interviews worden opgenomen in een erkende museumcollectie voor duurzame bewaring en toegankelijkheid voor onderzoekers, schippers en geïnteresseerden.',
      body_en: 'The interviews will be included in an accredited museum collection for sustainable preservation and accessibility for researchers, skippers and interested parties.',
    },
  ],
  mediaSpotlightBadge:     'Media spotlight',
  mediaSpotlightBadge_en:  'Media spotlight',
  mediaSpotlightTitle:     'Waterschatten',
  mediaSpotlightTitle_en:  'Waterschatten',
  mediaSpotlightBody:      'Een door de BBZ gemaakte promotiefilm die heel goed gebruikt kan worden om de Bruine Vloot, haar bemanning en de bijbehorende beroepsvelden voor te stellen.',
  mediaSpotlightBody_en:   'A promotional film made by the BBZ that can be used very effectively to introduce the Bruine Vloot, its crew and the associated professional fields.',
  mediaSpotlightCta:       'Alle media →',
  mediaSpotlightCta_en:    'All media →',
  mediaSpotlightThumbnail: photos['waterschatten-thumbnail.jpg'],
  newsBadge:    'Nieuws',
  newsBadge_en: 'News',
  newsTitle:    'Laatste berichten',
  newsTitle_en: 'Latest posts',
  newsAllCta:    'Alle berichten →',
  newsAllCta_en: 'All posts →',
  helpBadge:    'Doe mee',
  helpBadge_en: 'Get involved',
  helpTitle:    'Hoe u kunt bijdragen',
  helpTitle_en: 'How you can contribute',
  helpBody:    'UNESCO-erkenning vereist brede maatschappelijke steun. Elke bijdrage telt — of het nu een steunbrief is, een donatie, of het delen van dit verhaal.',
  helpBody_en: 'UNESCO recognition requires broad societal support. Every contribution counts — whether it is a support letter, a donation, or sharing this story.',
  helpButtons: [
    { label: 'Schrijf een steunbrief', label_en: 'Write a support letter' },
    { label: 'Word donateur',          label_en: 'Become a donor' },
    { label: 'Deel het verhaal',       label_en: 'Share the story' },
  ],
}

const navSettingsData = {
  homeLabel:          'Home',
  homeLabel_en:       'Home',
  fleetLabel:         'De schippers en de Vloot',
  fleetLabel_en:      'The Sailors and the Fleet',
  infoBordenLabel:    'Informatieborden',
  infoBordenLabel_en: 'Information Boards',
  unescoLabel:        'Road to UNESCO',
  unescoLabel_en:     'Road to UNESCO',
  teamLabel:          'Team',
  teamLabel_en:       'Team',
  mediaLabel:         'Media',
  mediaLabel_en:      'Media',
  blogLabel:          'Blog',
  blogLabel_en:       'Blog',
  ctaLabel:           'Steun ons dossier',
  ctaLabel_en:        'Support our dossier',
}

const fleetPageData = {
  bannerQuote:    'Een schip is meer dan hout en zeil — het zijn de mensen die het dragen.',
  bannerQuote_en: 'A ship is more than wood and sail — it is the people who carry it.',
  bannerSub:    'De posities op deze kaart tonen waar de bemanning zich bevindt — niet alleen het schip zelf.',
  bannerSub_en: 'The positions on this map show where the crew is located — not just the ship itself.',
}

const blogPageData = {
  badge:    'Nieuws & updates',
  badge_en: 'News & updates',
  title:    'Blog',
  title_en: 'Blog',
  newsletterBadge:    'Nieuwsbrief',
  newsletterBadge_en: 'Newsletter',
  newsletterTitle:    'Blijf op de hoogte',
  newsletterTitle_en: 'Stay informed',
  newsletterBody:    'Maandelijkse update over het UNESCO-traject, nieuwe informatieborden en vlootnieuws.',
  newsletterBody_en: 'Monthly update on the UNESCO process, new information boards and fleet news.',
}

const supportLetterPageData = {
  badge:    'Steun het UNESCO-dossier',
  badge_en: 'Support the UNESCO dossier',
  title:    'Schrijf een steunbrief',
  title_en: 'Write a support letter',
  intro:    'UNESCO-erkenning vereist brede maatschappelijke steun. Organisaties, gemeenten, schippers en individuen kunnen via dit formulier een steunverklaring indienen. Elke verklaring versterkt het dossier dat wij in 2025 indienen bij het Ministerie van OCW.',
  intro_en: 'UNESCO recognition requires broad societal support. Organisations, municipalities, skippers and individuals can submit a support declaration through this form. Every declaration strengthens the dossier we will submit to the Ministry of Education, Culture and Science in 2025.',
  pillars: [
    {
      n: '01',
      title:    'Breed draagvlak',
      title_en: 'Broad support',
      body:    'Het ministerie toetst of de nominatie gedragen wordt door de gemeenschap. Uw verklaring telt.',
      body_en: 'The ministry checks whether the nomination is supported by the community. Your declaration counts.',
    },
    {
      n: '02',
      title:    'Direct effect',
      title_en: 'Direct impact',
      body:    'Ingediende steunbrieven worden gebundeld en als bijlage toegevoegd aan het UNESCO-nominatiedossier.',
      body_en: 'Submitted support letters are bundled and added as an annex to the UNESCO nomination dossier.',
    },
    {
      n: '03',
      title:    'Gratis & vrijblijvend',
      title_en: 'Free & non-binding',
      body:    'Het indienen van een steunbrief kost niets en legt u geen verdere verplichtingen op.',
      body_en: 'Submitting a support letter is free of charge and places no further obligations on you.',
    },
  ],
  thankYouTitle:    'Bedankt voor uw steun',
  thankYouTitle_en: 'Thank you for your support',
  thankYouBody:    'Uw e-mailprogramma opent nu zodat u de steunbrief kunt versturen. Heeft u vragen? Neem contact op via info@zeilschipper.nl.',
  thankYouBody_en: 'Your email client will now open so you can send the support letter. Questions? Contact us at info@zeilschipper.nl.',
  backHomeLabel:    'Terug naar home',
  backHomeLabel_en: 'Back to home',
}

// ── Run ───────────────────────────────────────────────────────────────────────

await reseedLocalized('unesco-steps', unescoSteps)
await reseed('partners', partners)
await reseed('ships', ships)
await reseedLocalized('team-members', teamMembers)
await reseedLocalized('info-boards', infoBoards)
await reseedLocalized('blog-posts', blogPosts)
await reseedLocalized('media-items', mediaItems)

console.log('\n  Seeding globals…')
await seedGlobal('site-settings',      siteSettingsData)
await seedGlobal('info-boards-page',   infoBoardsPageData)
await seedGlobal('team-page',          teamPageData)
await seedGlobal('media-page',         mediaPageData)
await seedGlobal('unesco-page',        unescoPageData)
await seedGlobal('home-page',          homePageData)
await seedGlobal('nav-settings',       navSettingsData)
await seedGlobal('fleet-page',         fleetPageData)
await seedGlobal('blog-page',          blogPageData)
await seedGlobal('support-letter-page', supportLetterPageData)

console.log('\nDone. Run `npm run load-from-payload` next to update the static JSON files.')

process.exit(0)
