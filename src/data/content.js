// Static mock data — replaced by WordPress REST API responses when VITE_WP_API_URL is set

export const SHIPS = [
  { id: 1, name: "De Twee Gebroeders", type: "Tjalk", lat: 53.18, lng: 5.40, port: "Harlingen", speed: 4.2, year: 1912, region: "thuiswateren", passengers: 12 },
  { id: 2, name: "Vrouwe Maria", type: "Klipper", lat: 52.95, lng: 4.76, port: "Den Helder", speed: 3.8, year: 1898, region: "thuiswateren", passengers: 18 },
  { id: 3, name: "Aurora", type: "Schoener", lat: 57.20, lng: 20.10, port: "Stockholm", speed: 5.1, year: 1924, region: "europa", passengers: 24 },
  { id: 4, name: "De Hoop", type: "Klipper", lat: 40.65, lng: 14.25, port: "Napels", speed: 4.7, year: 1905, region: "europa", passengers: 16 },
  { id: 5, name: "Adelaar", type: "Schoener", lat: 43.30, lng: -9.80, port: "La Coruña", speed: 6.2, year: 1902, region: "europa", passengers: 22 },
  { id: 6, name: "Noorderzon", type: "Galjas", lat: 35.90, lng: 14.51, port: "Malta", speed: 4.4, year: 1918, region: "europa", passengers: 20 },
  { id: 7, name: "Cornelia", type: "Tjalk", lat: -62.10, lng: -57.90, port: "Antarctica passage", speed: 5.8, year: 1906, region: "wereld", passengers: 14 },
  { id: 8, name: "Zeearend", type: "Schoener", lat: 25.30, lng: -70.10, port: "Atlantische Oceaan", speed: 7.3, year: 1920, region: "wereld", passengers: 20 },
  { id: 9, name: "De Vriendschap", type: "Botter", lat: 53.30, lng: 6.05, port: "Delfzijl", speed: 3.2, year: 1934, region: "thuiswateren", passengers: 10 },
  { id: 10, name: "Anna", type: "Tjalk", lat: 52.38, lng: 4.90, port: "Amsterdam", speed: 2.8, year: 1909, region: "thuiswateren", passengers: 12 },
  { id: 11, name: "Fortuna", type: "Klipper", lat: 51.90, lng: 4.48, port: "Rotterdam", speed: 3.5, year: 1897, region: "thuiswateren", passengers: 16 },
  { id: 12, name: "De Zeemeeuw", type: "Galjas", lat: 53.00, lng: 8.80, port: "Bremen", speed: 4.9, year: 1915, region: "europa", passengers: 18 },
];

export const ARCS = [
  { startLat: 53.18, startLng: 5.40, endLat: 57.20, endLng: 20.10 },
  { startLat: 52.95, startLng: 4.76, endLat: 40.65, endLng: 14.25 },
  { startLat: 53.30, startLng: 6.05, endLat: 43.30, endLng: -9.80 },
  { startLat: 52.38, startLng: 4.90, endLat: 25.30, endLng: -70.10 },
  { startLat: 52.38, startLng: 4.90, endLat: -62.10, endLng: -57.90 },
  { startLat: 53.00, startLng: 8.80, endLat: 35.90, endLng: 14.51 },
];

export const TEAM = [
  {
    id: 1, name: "Sven Timmann", role: "Voorzitter", location: "Hamburg / Nederland", since: "2021",
    bio: "Geboren in Hamburg aan de Elbe, duurde het niet lang voordat ik als tiener mijn liefde voor zeilen ontdekte. Eerst op rubberboten en later op jeugdkotters verkende ik met vrienden de meren en rivieren van Noord-Duitsland. In de zomer gingen deze reizen tot in Denemarken.",
    expertise: "Zeilvaart, bestuur, internationale netwerken",
  },
  {
    id: 2, name: "Jan Willem Zandstra", role: "Secretaris", location: "Nederland", since: "2021",
    bio: "Mijn naam is Jan Willem Zandstra en ik ben schipper en eigenaar van de zeilklipper 'Eenhoorn'. Zo'n 15 jaar geleden ben ik toevallig op een zeilschip terecht gekomen nadat het werken in de projectontwikkeling onmogelijk werd vanwege een wereldwijde financiële crisis.",
    expertise: "Scheepvaart, scheepsbeheer, Bruine Vloot",
  },
  {
    id: 3, name: "Sylvelin (Zippi) Rinnen", role: "Bestuurslid", location: "Nederland", since: "2021",
    bio: "Als bestuurslid van Stichting Zeilschipper zet Sylvelin zich in voor het behoud van het immaterieel erfgoed van de Schipper Bruine Vloot. Haar brede ervaring en betrokkenheid bij de maritieme gemeenschap vormen een waardevolle bijdrage aan het bestuur.",
    expertise: "Bestuur, maritiem erfgoed",
  },
  {
    id: 4, name: "Cockie Schilperoort", role: "Vrijwilliger", location: "Muiden", since: "2023",
    bio: "Ik ben, toen ik 20 was, in contact gekomen met de Bruine Vloot doordat ik een relatie kreeg met een schipper op een tjalk in Muiden. Wilde ik hem zien 's zomers dan 'moest' ik wel mee aan boord. Ik had helemaal geen zeilervaring en in het begin vond ik het erg spannend allemaal.",
    expertise: "Gemeenschapsopbouw, communicatie",
  },
  {
    id: 5, name: "Marja Goud", role: "Vrijwilliger", location: "Nederland", since: "2023",
    bio: "Tijdens mijn studie museologie is mijn interesse gewekt voor historische schepen. Dat deze schepen zo zichtbaar zijn in het landschap en in het dagelijks leven in Nederland is iets om te koesteren. Heel anders dan erfgoed binnen de muren van een museum.",
    expertise: "Museologie, erfgoedbeheer",
  },
  {
    id: 6, name: "Maaike de Jong", role: "Vrijwilliger", location: "Nederland", since: "2023",
    bio: "Ik combineer een academische achtergrond in hoger onderwijs en duurzaamheid met een passie voor maritiem erfgoed. Als stuurman op traditionele zeilschepen tot 500 GT vaar ik wereldwijd en zet ik mij in voor het levend houden van de kennis en praktijk van de Bruine Vloot.",
    expertise: "Duurzaamheid, nautisch onderwijs, Bruine Vloot",
  },
];

export const HARBOURS = [
  { id: 1, name: "Zuiderzeemuseum", lat: 52.7062, lng: 5.2809, status: "afgerond", ships: 35, notes: "Informatiebord geplaatst bij het Zuiderzeemuseum in Enkhuizen.", date: "Afgerond 2023" },
  { id: 2, name: "Enkhuizen", lat: 52.7035, lng: 5.2953, status: "ingediend", ships: 38, notes: "Aanvraag ingediend bij gemeente Enkhuizen.", date: "Ingediend 2024" },
  { id: 3, name: "Hoorn", lat: 52.6425, lng: 5.0604, status: "ingediend", ships: 52, notes: "Ingediend bij gemeente Hoorn, in behandeling.", date: "Ingediend 2024" },
  { id: 4, name: "Harlingen", lat: 53.1741, lng: 5.4151, status: "kandidaat", ships: 45, notes: "Harlingen als thuishaven van veel Bruine Vloot schepen.", date: "Kandidaat" },
  { id: 5, name: "Terschelling", lat: 53.3620, lng: 5.2179, status: "kandidaat", ships: 18, notes: "In gesprek met gemeente Terschelling en havenbeheer.", date: "Kandidaat" },
  { id: 6, name: "Vlieland", lat: 53.2968, lng: 5.0601, status: "kandidaat", ships: 12, notes: "In gesprek met VVV Vlieland en havenbeheer.", date: "Kandidaat" },
  { id: 7, name: "Oudeschild", lat: 53.0413, lng: 4.8113, status: "kandidaat", ships: 27, notes: "Vissershaven op Texel, populaire ankerplaats voor Bruine Vloot.", date: "Kandidaat" },
  { id: 8, name: "Stavoren", lat: 52.8820, lng: 5.3624, status: "kandidaat", ships: 17, notes: "Oudste havenstad van Friesland.", date: "Kandidaat" },
  { id: 9, name: "Monnickendam", lat: 52.4567, lng: 5.0394, status: "kandidaat", ships: 24, notes: "Historische havenstad aan het Markermeer.", date: "Kandidaat" },
  { id: 10, name: "Kampen", lat: 52.5573, lng: 5.9110, status: "kandidaat", ships: 23, notes: "Historische Hanzestad aan de IJssel.", date: "Kandidaat" },
  { id: 11, name: "Medemblik", lat: 52.7690, lng: 5.1167, status: "kandidaat", ships: 21, notes: "Onderdeel Westfriese erfgoedroute.", date: "Kandidaat" },
  { id: 12, name: "Lelystad", lat: 52.5185, lng: 5.4714, status: "kandidaat", ships: 19, notes: "Nieuwe haven, thuisbasis voor diverse historische schepen.", date: "Kandidaat" },
  { id: 13, name: "Makkum", lat: 53.0556, lng: 5.3957, status: "kandidaat", ships: 14, notes: "Friese havenplaats aan de Waddenzee.", date: "Kandidaat" },
  { id: 14, name: "Workum", lat: 52.9792, lng: 5.4453, status: "kandidaat", ships: 11, notes: "Karakteristieke Friese havenplaats.", date: "Kandidaat" },
  { id: 15, name: "Lemmer", lat: 52.8449, lng: 5.7147, status: "kandidaat", ships: 22, notes: "Haven aan het IJsselmeer, populair doorgangspunt.", date: "Kandidaat" },
  { id: 16, name: "Urk", lat: 52.6640, lng: 5.5976, status: "kandidaat", ships: 35, notes: "Sterk lokaal draagvlak via visserijgemeenschap.", date: "Kandidaat" },
  { id: 17, name: "Muiden", lat: 52.3333, lng: 5.0667, status: "kandidaat", ships: 30, notes: "Populaire ligplaats voor Bruine Vloot nabij Amsterdam.", date: "Kandidaat" },
  { id: 18, name: "Volendam", lat: 52.4942, lng: 5.0700, status: "kandidaat", ships: 16, notes: "Toeristische havenplaats aan het Markermeer.", date: "Kandidaat" },
  { id: 19, name: "Hindelopen", lat: 52.9397, lng: 5.3965, status: "kandidaat", ships: 10, notes: "Historische havenplaats aan de Waddenzee.", date: "Kandidaat" },
  { id: 20, name: "Ameland", lat: 53.4551, lng: 5.7606, status: "kandidaat", ships: 9, notes: "Waddeneiland, contact gelegd met haven Nes.", date: "Kandidaat" },
  { id: 21, name: "Amsterdam", lat: 52.3737, lng: 4.9033, status: "kandidaat", ships: 67, notes: "NDSM-werf en historische IJ-oevers.", date: "Kandidaat" },
];

export const BLOG_POSTS = [
  { id: 1, title: "Bruine Vloot", date: "20 januari 2026", category: "Erfgoed", author: "Sven", excerpt: "De Bruine Vloot bestaat uit zo'n 400 historische zeilschepen die worden ingezet voor passagiersvervoer op binnenwater en zee. Deze vloot is uniek in omvang en vakmanschap, met een eigen cultuur gekenmerkt door hoge zeilvaardigheid.", readTime: "5 min", slug: "bruine-vloot" },
];

export const MEDIA_ITEMS = [
  // Video's erfgoed
  { id: 1, type: "video", title: "Waterschatten", description: "Promotiefilm van de BBZ die heel goed gebruikt kan worden om de Bruine Vloot, haar bemanning en de bijbehorende beroepsvelden voor te stellen.", category: "video", tag: "Vloot", format: "MP4" },
  { id: 2, type: "video", title: "Renée, schipper van de Bontekoe", description: "Schipper Renée vertelt over haar leven aan boord van een schip van de Bruine Vloot.", category: "video", tag: "Schipper", format: "MP4" },
  { id: 3, type: "video", title: "Tess op zee", description: "Matroos Tess vertelt over haar leven aan boord van een schip op zee.", category: "video", tag: "Matroos", format: "MP4" },
  { id: 4, type: "video", title: "Patrick, zeilmaker", description: "Patrick toont zijn ambacht van zeilen ontwerpen, repareren en onderhouden. Zijn passie en vakmanschap zijn cruciaal voor het behoud van het immaterieel erfgoed.", category: "video", tag: "Zeilmaker", format: "MP4" },
  { id: 5, type: "video", title: "Patrick, zeilmaker", description: "Patrick, een zeilmaker voor de historische chartervloot, toont zijn ambacht van zeilen ontwerpen, repareren en onderhouden.", category: "video", tag: "Havens", format: "MP4" },
  { id: 6, type: "video", title: "Marijke de Jong", description: "De film portretteert scheepsbouwkundige Marijke de Jong als ontwerper en adviseur voor de zeilende chartervaart.", category: "video", tag: "Tuigage", format: "MP4" },
  // Foto's erfgoed
  { id: 7, type: "photo", title: "Fotocollectie", description: "Een verzameling foto's uit de erfgoedsector voor vrij gebruik. Neem contact op voor meer of specifieke beelden.", category: "foto", tag: "Foto", format: "ZIP" },
  // Complete projecten
  { id: 8, type: "project", title: "Het kleinste kamertje", description: "Film over het Zuiderzeemuseum in NL, DE en EN, inclusief teksten en instructies voor de speurtocht. Neem contact op voor hogere resoluties.", category: "project", tag: "Museum", format: "ZIP" },
  // Teksten erfgoed
  { id: 9, type: "text", title: "Borgingsplan Kien", description: "Het borgingsplan Schipper Bruine Vloot als tekst om te downloaden.", category: "tekst", tag: "Borgingsplan", format: "PDF" },
  // Webpagina's erfgoed
  { id: 10, type: "text", title: "Schipper Bruine Vloot", description: "Tekst over het immaterieel erfgoed Schipper Bruine Vloot en zijn betekenis. Beschikbaar in het Nederlands en het Duits.", category: "tekst", tag: "Erfgoed", format: "PDF" },
  // Podcasts
  { id: 11, type: "podcast", title: "Roefgesprekken", description: "Podcast met verhalen van zeevarenden: kapiteins, stuurmannen en vrouwen, scheepskoks, matrozen en anderen werkzaam op een schip.", category: "podcast", tag: "Podcast", format: "MP3" },
];
