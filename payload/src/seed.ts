/**
 * Seed script — full dataset for development and staging.
 *
 * Usage:
 *   cd payload
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

const ROOT   = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const PUBLIC = path.join(ROOT, 'public')

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
  const abs  = path.join(ROOT, filename)
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
]

const blogPhotos = [
  { file: 'blog/bruine-vloot/het_vloot_vertrekt.jpg', alt: 'De vloot vertrekt' },
  { file: 'blog/bruine-vloot/op_het_ijsselmeer.jpg',  alt: 'Op het IJsselmeer' },
]

for (const { file, alt } of [...teamPhotos, ...blogPhotos]) {
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
  { name: 'De Twee Gebroeders', type: 'Tjalk', lat: 52.7080, lng: 5.2960, port: 'Enkhuizen', speed: 5, year: 1912, region: 'thuiswateren', passengers: 12 },
]

// ── Team Members ──────────────────────────────────────────────────────────────

const teamMembers = [
  {
    name: 'Sven',
    role: 'Oprichter & voorzitter',
    role_en: 'Founder & chairman',
    location: 'Amsterdam',
    since: '2021',
    photo: photos['team/sven.jpg'],
    bio: 'Oprichter van Stichting Zeilschipper en drijvende kracht achter het UNESCO-dossier. Na een loopbaan in cultureel management richtte hij in 2021 de stichting op, overtuigd dat het ambacht van de Bruine Vloot-schipper internationale erkenning verdient.',
    bio_en: 'Founder of Stichting Zeilschipper and driving force behind the UNESCO nomination. After a career in cultural management he founded the foundation in 2021, convinced that the craft of the Bruine Vloot skipper deserves international recognition.',
    expertise: 'Erfgoedbeleid, fondsenwerving, UNESCO-dossiervorming',
    expertise_en: 'Heritage policy, fundraising, UNESCO nomination process',
  },
  {
    name: 'Jan-Willem',
    role: 'Bestuurslid',
    role_en: 'Board member',
    location: 'Nederland',
    since: '2021',
    photo: photos['team/jan-willem.jpg'],
    bio: '',
    bio_en: '',
    expertise: '',
    expertise_en: '',
  },
  {
    name: 'Cockie',
    role: 'Bestuurslid',
    role_en: 'Board member',
    location: 'Nederland',
    since: '2021',
    photo: photos['team/cockie.jpg'],
    bio: '',
    bio_en: '',
    expertise: '',
    expertise_en: '',
  },
  {
    name: 'Zippi',
    role: 'Bestuurslid',
    role_en: 'Board member',
    location: 'Nederland',
    since: '2021',
    photo: photos['team/zippi.jpg'],
    bio: '',
    bio_en: '',
    expertise: '',
    expertise_en: '',
  },
  {
    name: 'Marja',
    role: 'Bestuurslid',
    role_en: 'Board member',
    location: 'Nederland',
    since: '2021',
    photo: photos['team/marja.jpg'],
    bio: '',
    bio_en: '',
    expertise: '',
    expertise_en: '',
  },
  {
    name: 'Maaike',
    role: 'Bestuurslid',
    role_en: 'Board member',
    location: 'Nederland',
    since: '2021',
    photo: photos['team/maaike.jpg'],
    bio: '',
    bio_en: '',
    expertise: '',
    expertise_en: '',
  },
]

// ── Info Boards ───────────────────────────────────────────────────────────────

const infoBoards = [
  // Completed
  { name: 'Harlingen',            lat: 53.1748, lng: 5.4158,  status: 'afgerond',  ships: 14, notes: 'Bord geplaatst aan de Noorderhaven, naast de historische scheepswerf. Officieel onthuld op 15 juni 2024 in aanwezigheid van de wethouder cultuur.',                             notes_en: 'Board placed at Noorderhaven, next to the historic shipyard. Officially unveiled on 15 June 2024.',                                              date: 'Afgerond juni 2024' },
  { name: 'Enkhuizen',            lat: 52.7082, lng: 5.2960,  status: 'afgerond',  ships: 22, notes: 'Bord geplaatst op de Buitenhaven, direct naast het Zuiderzeemuseum. Gefinancierd door Gemeente Enkhuizen en het Zuiderzeemuseum gezamenlijk.',                                  notes_en: 'Board placed at Buitenhaven, adjacent to the Zuiderzeemuseum. Jointly funded by the Municipality of Enkhuizen and the Zuiderzeemuseum.',          date: 'Afgerond september 2024' },
  { name: 'Amsterdam — NDSM',     lat: 52.4024, lng: 4.8991,  status: 'afgerond',  ships: 31, notes: 'Bord geplaatst op de historische NDSM-scheepswerf, een van de drukst bezochte aanlegplaatsen van de Bruine Vloot in Noord-Holland.',                                           notes_en: 'Board placed at the historic NDSM shipyard, one of the most visited moorings of the Bruine Vloot in North Holland.',                              date: 'Afgerond oktober 2024' },
  // Submitted
  { name: 'Hoorn',                lat: 52.6431, lng: 5.0607,  status: 'ingediend', ships: 18, notes: 'Locatie goedgekeurd: Binnenhaven bij het Westfries Museum. Subsidieaanvraag ingediend bij Gemeente Hoorn, besluit verwacht Q2 2025.',                                           notes_en: 'Location approved: Binnenhaven near the Westfries Museum. Grant application submitted, decision expected Q2 2025.',                               date: 'Ingediend november 2024' },
  { name: 'Medemblik',            lat: 52.7686, lng: 5.1125,  status: 'ingediend', ships: 11, notes: 'Gemeente akkoord met locatie nabij het Stoomgemaal Vier Noorder Koggen. Plaatsing gepland zodra subsidie is toegekend.',                                                        notes_en: 'Municipality agreed on location near the Stoomgemaal. Placement planned once subsidy is granted.',                                                date: 'Ingediend december 2024' },
  { name: 'Stavoren',             lat: 52.8844, lng: 5.3649,  status: 'ingediend', ships: 9,  notes: 'Historisch eindpunt van de Hanzevaart. Gemeente Súdwest-Fryslân heeft principe-akkoord gegeven voor plaatsing bij de buitenhaven.',                                            notes_en: 'Historic end point of the Hanse route. Municipality has given agreement in principle for placement at the outer harbour.',                         date: 'Ingediend januari 2025' },
  { name: 'Urk',                  lat: 52.6637, lng: 5.6020,  status: 'ingediend', ships: 7,  notes: 'Gesprekken met vissersvereniging en gemeente verlopen positief. Locatie wordt beoordeeld bij de historische haven bij de vuurtoren.',                                           notes_en: 'Talks with the fishing association and municipality are progressing well. Location being assessed near the lighthouse.',                           date: 'Ingediend januari 2025' },
  { name: 'Lelystad — Bataviawerf', lat: 52.5185, lng: 5.4714, status: 'ingediend', ships: 5, notes: 'Samenwerking met de Bataviawerf biedt uitgelezen context. Plaatsingsvoorstel ligt voor bij directie van de werf.',                                                              notes_en: 'Partnership with the Bataviawerf offers an ideal context. Placement proposal under review by the yard\'s management.',                            date: 'Ingediend februari 2025' },
  // Candidates
  { name: 'Makkum',               lat: 53.0567, lng: 5.4019,  status: 'kandidaat', ships: 8,  notes: 'Traditionele jachthaven met sterke Bruine Vloot-aanwezigheid. Eerste contact met gemeente opgenomen; haalbaarheidsonderzoek loopt.',                                            notes_en: 'Traditional marina with strong Bruine Vloot presence. First contact made with municipality; feasibility study under way.',                         date: 'Kandidaat' },
  { name: 'Lemmer',               lat: 52.8469, lng: 5.7084,  status: 'kandidaat', ships: 12, notes: 'Lemmer is thuishaven van meerdere historische tjalken. Locatiestudie gepland voor zomer 2025.',                                                                                notes_en: 'Lemmer is home port for several historic tjalks. Location study planned for summer 2025.',                                                        date: 'Kandidaat' },
  { name: 'Den Helder',           lat: 52.9562, lng: 4.7602,  status: 'kandidaat', ships: 6,  notes: 'Historische marinestad. Gesprekken met het Marinemuseum Den Helder over gezamenlijk initiatief.',                                                                               notes_en: 'Historic naval town. Talks with the Naval Museum Den Helder about a joint initiative.',                                                           date: 'Kandidaat' },
  { name: 'Kampen',               lat: 52.5553, lng: 5.9104,  status: 'kandidaat', ships: 5,  notes: 'Historische IJsselstad. Contact gelegd met Stedelijk Museum Kampen.',                                                                                                          notes_en: 'Historic IJssel city. Contact made with the Stedelijk Museum Kampen.',                                                                            date: 'Kandidaat' },
  { name: 'Vollenhove',           lat: 52.6742, lng: 5.9550,  status: 'kandidaat', ships: 4,  notes: 'Klein historisch vissersstadje aan het Zwarte Meer. Gemeente staat positief tegenover het initiatief.',                                                                         notes_en: 'Small historic fishing town on the Zwarte Meer. Municipality is positive about the initiative.',                                                  date: 'Kandidaat' },
  { name: 'Muiden',               lat: 52.3365, lng: 5.0725,  status: 'kandidaat', ships: 9,  notes: 'Druk bezochte jachthaven bij het Muiderslot. Hoge zichtbaarheid voor dagjesmensen en toeristen.',                                                                              notes_en: 'Busy marina near the Muiderslot castle. High visibility for day-trippers and tourists.',                                                          date: 'Kandidaat' },
  { name: 'Monnickendam',         lat: 52.4573, lng: 5.0295,  status: 'kandidaat', ships: 7,  notes: 'Historisch Waterland-dorp. Locatieoverleg gepland met gemeente Waterland.',                                                                                                    notes_en: 'Historic Waterland village. Location discussion planned with the Municipality of Waterland.',                                                     date: 'Kandidaat' },
  { name: 'Dordrecht',            lat: 51.8069, lng: 4.6681,  status: 'kandidaat', ships: 8,  notes: 'Oudste stad van Holland, rijk scheepvaartverleden. Gesprekken met het Dordrechts Museum positief verlopen.',                                                                    notes_en: 'Oldest city of Holland, rich maritime past. Initial talks with the Dordrechts Museum have been positive.',                                        date: 'Kandidaat' },
  { name: 'Rotterdam — Veerhaven', lat: 51.9074, lng: 4.4738, status: 'kandidaat', ships: 11, notes: 'De Veerhaven is een van de drukst bezochte historische havengebieden van Rotterdam.',                                                                                           notes_en: 'The Veerhaven is one of the most visited historic harbour areas in Rotterdam.',                                                                   date: 'Kandidaat' },
  { name: 'Schokland',            lat: 52.6400, lng: 5.8344,  status: 'kandidaat', ships: 2,  notes: 'Voormalig eiland, nu UNESCO Werelderfgoed. Bijzondere symbolische waarde voor een informatiebord over varend erfgoed.',                                                         notes_en: 'Former island, now a UNESCO World Heritage Site. Unique symbolic value for a sailing heritage information board.',                                 date: 'Kandidaat' },
  { name: 'Sneek',                lat: 53.0335, lng: 5.6598,  status: 'kandidaat', ships: 6,  notes: 'Friesland\'s bekendste watersportstad. Overleg met Waterpoort-organisatie opgestart.',                                                                                          notes_en: 'Friesland\'s best-known watersports city. Discussions with the Waterpoort organisation initiated.',                                              date: 'Kandidaat' },
  { name: 'Giethoorn',            lat: 52.7381, lng: 6.0794,  status: 'kandidaat', ships: 3,  notes: 'Internationaal bekende toeristische bestemming. Gemeente Steenwijkerland positief.',                                                                                            notes_en: 'Internationally known tourist destination. Municipality of Steenwijkerland is positive.',                                                         date: 'Kandidaat' },
]

// ── Blog Posts ────────────────────────────────────────────────────────────────

const blogPosts = [
  {
    title: 'Bruine Vloot',
    slug: 'bruine-vloot',
    date: '2026-01-20T00:00:00.000Z',
    category: 'Erfgoed',
    author: 'Peter Fokkens',
    readTime: '5 min',
    coverImage: photos['blog/bruine-vloot/het_vloot_vertrekt.jpg'],
    excerpt: 'Het IJsselmeer ligt er wat grijs bij, maar we zijn niet de enigen op het water. Een dag op de Bruine Vloot — een reis terug in de tijd, met schipper Noor aan het roer.',
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
    images: [
      { image: photos['blog/bruine-vloot/op_het_ijsselmeer.jpg'], alt: 'Op het IJsselmeer', after: 5 },
    ],
  },
]

// ── Media items (videos + podcast) ───────────────────────────────────────────

console.log('  Uploading videos…')

// Clear existing media items first, then existing media docs for videos
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
    description: 'De film laat zien waarom de Nederlandse chartervaart zo bijzonder is. Met sfeervolle beelden van traditionele zeilschepen, vakmanschap aan boord en op de wal, en het varen op IJsselmeer en Waddenzee, toont de film hoe uniek deze vloot is. Tegelijk vraagt hij aandacht voor de kwetsbare positie van de sector, zeker in tijden van crisis.',
    category: 'video',
    tag: 'Erfgoed',
    format: 'MP4',
    file: videos['Waterschatten-een-impressie-van-de-chartervaart.mp4'],
  },
  {
    type: 'video',
    title: 'Marijke de Jong',
    description: 'Scheepsbouwkundige Marijke de Jong als ontwerper en adviseur voor de zeilende chartervaart. Ze vertelt over veilig en mooi schepen bouwen, haar werk voor rederijen en de Enkhuizer Zeevaartschool en waarom goed ontwerp essentieel is om de historische vloot toekomst te geven.',
    category: 'video',
    tag: 'Vakmanschap',
    format: 'MP4',
    file: videos['Marijke-de-Jong-tuigage-stabiliteitsberekeningen-docent.mp4'],
  },
  {
    type: 'video',
    title: 'Renée, schipper van de Bontekoe',
    description: 'Renée vertelt over haar leven en werk als schipper op een traditioneel zeilschip. De video benadrukt haar passie, vakmanschap en de vrijheid op het water.',
    category: 'video',
    tag: 'Portret',
    format: 'MP4',
    file: videos['Renee-schipper-van-de-Bontekoe.mp4'],
  },
  {
    type: 'video',
    title: 'De vloot en de haven. Niet uit te drukken in geld!',
    description: 'De Bruine Vloot en historische havens versterken elkaar. De schepen zorgen voor sfeer, levendig toerisme, lokale werkgelegenheid, onderwijs en cultureel erfgoed. Zonder vloot geen échte haven — en dat is in geld niet te vangen.',
    category: 'video',
    tag: 'Erfgoed',
    format: 'MP4',
    file: videos['De-vloot-en-de-haven_-niet-uit-de-drukken-in-geld.mp4'],
  },
  {
    type: 'video',
    title: 'De Bruine Vloot en de havens',
    description: 'Hoe belangrijk de traditionele zeilschepen zijn voor de Nederlandse havens. Schippers en andere betrokkenen vertellen over de sfeer, het erfgoed en de economische waarde die deze schepen meebrengen aan levendige, aantrekkelijke havensteden.',
    category: 'video',
    tag: 'Erfgoed',
    format: 'MP4',
    file: videos['De-Bruine-Vloot-en-de-havens.mp4'],
  },
  {
    type: 'video',
    title: 'Patrick, zeilmaker',
    description: 'Patrick, zeilmaker voor de historische chartervloot, toont zijn ambacht van zeilen ontwerpen, repareren en onderhouden. Zijn passie en vakmanschap zijn cruciaal voor het behoud van varend erfgoed.',
    category: 'video',
    tag: 'Vakmanschap',
    format: 'MP4',
    file: videos['Patrick-zeilmaker.mp4'],
  },
  {
    type: 'video',
    title: 'Tess op zee',
    description: 'Tess vertelt over haar ervaringen als bemanningslid op een traditioneel zeilschip. Een persoonlijk portret van het leven op het water en de liefde voor de Bruine Vloot.',
    category: 'video',
    tag: 'Portret',
    format: 'MP4',
    file: videos['Tess-op-zee.mp4'],
  },
  {
    type: 'podcast',
    title: 'Roefgesprekken',
    description: 'Podcast met verhalen van zeevarenden: kapiteins, stuurmannen en vrouwen, schepenskoks, matrozen en anderen werkzaam op een schip. Een initiatief van Peter Fokkens voor Stichting Zeilschipper.',
    category: 'podcast',
    tag: 'Podcast',
    format: 'MP3',
    externalUrl: 'https://www.stichtingzeilschipper.nl/podcasts/roefgesprekken/',
  },
]

// ── Run ───────────────────────────────────────────────────────────────────────

await reseedLocalized('unesco-steps', unescoSteps)
await reseed('partners', partners)
await reseed('ships', ships)
await reseedLocalized('team-members', teamMembers)
await reseedLocalized('info-boards', infoBoards)
await reseedLocalized('blog-posts', blogPosts)
await reseed('media-items', mediaItems)

console.log('\nDone. Run `npm run load-from-payload` next to update the static JSON files.')

process.exit(0)
