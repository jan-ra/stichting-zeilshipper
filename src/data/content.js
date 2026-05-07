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
  { id: 13, name: "De Goede Verwachting", type: "Topzeilschoener", lat: 52.64, lng: 5.06, port: "Enkhuizen", speed: 5.5, year: 1908, region: "thuiswateren", passengers: 28 },
  { id: 14, name: "Insulinde", type: "Volschip", lat: 52.95, lng: 4.80, port: "Den Helder", speed: 6.1, year: 1914, region: "europa", passengers: 36 },
  { id: 15, name: "Mercator", type: "Bark", lat: 51.23, lng: 2.92, port: "Oostende", speed: 7.2, year: 1932, region: "europa", passengers: 40 },
  { id: 16, name: "Amazone", type: "Barkentijn", lat: 53.55, lng: 9.99, port: "Hamburg", speed: 6.8, year: 1887, region: "europa", passengers: 32 },
  { id: 17, name: "Prins Willem", type: "Schoenerbrik", lat: 52.52, lng: 5.47, port: "Lelystad", speed: 4.3, year: 1921, region: "thuiswateren", passengers: 20 },
  { id: 18, name: "De Heer Abrahamsz", type: "Aak", lat: 52.51, lng: 6.09, port: "Zwolle", speed: 2.5, year: 1938, region: "thuiswateren", passengers: 8 },
  { id: 19, name: "Helena", type: "Klipperaak", lat: 52.77, lng: 5.29, port: "Medemblik", speed: 3.1, year: 1902, region: "thuiswateren", passengers: 10 },
  { id: 20, name: "Johanna", type: "Stevenaak", lat: 51.69, lng: 5.30, port: "'s-Hertogenbosch", speed: 2.8, year: 1925, region: "thuiswateren", passengers: 8 },
  { id: 21, name: "Mars", type: "Brig", lat: 55.68, lng: 12.57, port: "Kopenhagen", speed: 8.1, year: 1878, region: "europa", passengers: 30 },
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
    id: 1, name: "Sven Timmann", role: "Voorzitter", role_en: "Chairman", location: "Hamburg / Nederland", since: "2021",
    photo: "/team/sven.jpg",
    bio: "Geboren in Hamburg aan de Elbe, duurde het niet lang voordat ik als tiener mijn liefde voor zeilen ontdekte. Eerst op rubberboten en later op jeugdkotters verkende ik met vrienden de meren en rivieren van Noord-Duitsland. In de zomer gingen deze reizen tot in Denemarken.",
    bio_en: "Born in Hamburg on the Elbe, it didn't take long before I discovered my love of sailing as a teenager. First on rubber dinghies and later on youth ketches, I explored the lakes and rivers of northern Germany with friends. In summer, these trips extended as far as Denmark.",
    expertise: "Zeilvaart, bestuur, internationale netwerken",
    expertise_en: "Sailing, governance, international networks",
  },
  {
    id: 2, name: "Jan Willem Zandstra", role: "Secretaris", role_en: "Secretary", location: "Nederland", since: "2021",
    photo: "/team/jan-willem.jpg",
    bio: "Mijn naam is Jan Willem Zandstra en ik ben schipper en eigenaar van de zeilklipper 'Eenhoorn'. Zo'n 15 jaar geleden ben ik toevallig op een zeilschip terecht gekomen nadat het werken in de projectontwikkeling onmogelijk werd vanwege een wereldwijde financiële crisis.",
    bio_en: "My name is Jan Willem Zandstra and I am skipper and owner of the sailing clipper 'Eenhoorn'. About 15 years ago I ended up on a sailing ship by chance after working in property development became impossible due to a global financial crisis.",
    expertise: "Scheepvaart, scheepsbeheer, Bruine Vloot",
    expertise_en: "Shipping, vessel management, Bruine Vloot",
  },
  {
    id: 3, name: "Sylvelin (Zippi) Rinnen", role: "Bestuurslid", role_en: "Board member", location: "Nederland", since: "2021",
    photo: "/team/zippi.jpg",
    bio: "Als bestuurslid van Stichting Zeilschipper zet Sylvelin zich in voor het behoud van het immaterieel erfgoed van de Schipper Bruine Vloot. Haar brede ervaring en betrokkenheid bij de maritieme gemeenschap vormen een waardevolle bijdrage aan het bestuur.",
    bio_en: "As a board member of Stichting Zeilschipper, Sylvelin is committed to preserving the intangible cultural heritage of the Bruine Vloot skipper. Her broad experience and involvement in the maritime community are a valuable contribution to the board.",
    expertise: "Bestuur, maritiem erfgoed",
    expertise_en: "Governance, maritime heritage",
  },
  {
    id: 4, name: "Cockie Schilperoort", role: "Vrijwilliger", role_en: "Volunteer", location: "Muiden", since: "2023",
    photo: "/team/cockie.jpg",
    bio: "Ik ben, toen ik 20 was, in contact gekomen met de Bruine Vloot doordat ik een relatie kreeg met een schipper op een tjalk in Muiden. Wilde ik hem zien 's zomers dan 'moest' ik wel mee aan boord. Ik had helemaal geen zeilervaring en in het begin vond ik het erg spannend allemaal.",
    bio_en: "I first came into contact with the Bruine Vloot when I was 20 through a relationship with a skipper on a tjalk in Muiden. If I wanted to see him in summer, I 'had to' come along on board. I had no sailing experience whatsoever and at first I found it all quite nerve-wracking.",
    expertise: "Gemeenschapsopbouw, communicatie",
    expertise_en: "Community building, communications",
  },
  {
    id: 5, name: "Marja Goud", role: "Vrijwilliger", role_en: "Volunteer", location: "Nederland", since: "2023",
    photo: "/team/marja.jpg",
    bio: "Tijdens mijn studie museologie is mijn interesse gewekt voor historische schepen. Dat deze schepen zo zichtbaar zijn in het landschap en in het dagelijks leven in Nederland is iets om te koesteren. Heel anders dan erfgoed binnen de muren van een museum.",
    bio_en: "My interest in historic ships was sparked during my museology studies. The fact that these vessels are so visible in the Dutch landscape and daily life is something to be cherished — very different from heritage locked behind museum walls.",
    expertise: "Museologie, erfgoedbeheer",
    expertise_en: "Museology, heritage management",
  },
  {
    id: 6, name: "Maaike de Jong", role: "Vrijwilliger", role_en: "Volunteer", location: "Nederland", since: "2023",
    photo: "/team/maaike.jpg",
    bio: "Ik combineer een academische achtergrond in hoger onderwijs en duurzaamheid met een passie voor maritiem erfgoed. Als stuurman op traditionele zeilschepen tot 500 GT vaar ik wereldwijd en zet ik mij in voor het levend houden van de kennis en praktijk van de Bruine Vloot.",
    bio_en: "I combine an academic background in higher education and sustainability with a passion for maritime heritage. As a mate on traditional sailing vessels up to 500 GT, I sail worldwide and am committed to keeping the knowledge and practice of the Bruine Vloot alive.",
    expertise: "Duurzaamheid, nautisch onderwijs, Bruine Vloot",
    expertise_en: "Sustainability, nautical education, Bruine Vloot",
  },
];

export const HARBOURS = [
  { id: 1, name: "Zuiderzeemuseum", lat: 52.7062, lng: 5.2809, status: "afgerond", ships: 35, notes: "Informatiebord geplaatst bij het Zuiderzeemuseum in Enkhuizen.", notes_en: "Information board placed at the Zuiderzeemuseum in Enkhuizen.", date: "Afgerond 2023" },
  { id: 2, name: "Enkhuizen", lat: 52.7035, lng: 5.2953, status: "ingediend", ships: 38, notes: "Aanvraag ingediend bij gemeente Enkhuizen.", notes_en: "Application submitted to the municipality of Enkhuizen.", date: "Ingediend 2024" },
  { id: 3, name: "Hoorn", lat: 52.6425, lng: 5.0604, status: "ingediend", ships: 52, notes: "Ingediend bij gemeente Hoorn, in behandeling.", notes_en: "Submitted to the municipality of Hoorn, currently under review.", date: "Ingediend 2024" },
  { id: 4, name: "Harlingen", lat: 53.1741, lng: 5.4151, status: "kandidaat", ships: 45, notes: "Harlingen als thuishaven van veel Bruine Vloot schepen.", notes_en: "Harlingen serves as the home port for many Bruine Vloot vessels.", date: "Kandidaat" },
  { id: 5, name: "Terschelling", lat: 53.3620, lng: 5.2179, status: "kandidaat", ships: 18, notes: "In gesprek met gemeente Terschelling en havenbeheer.", notes_en: "In conversation with the municipality of Terschelling and harbour management.", date: "Kandidaat" },
  { id: 6, name: "Vlieland", lat: 53.2968, lng: 5.0601, status: "kandidaat", ships: 12, notes: "In gesprek met VVV Vlieland en havenbeheer.", notes_en: "In conversation with Vlieland tourism office and harbour management.", date: "Kandidaat" },
  { id: 7, name: "Oudeschild", lat: 53.0413, lng: 4.8113, status: "kandidaat", ships: 27, notes: "Vissershaven op Texel, populaire ankerplaats voor Bruine Vloot.", notes_en: "Fishing harbour on Texel, a popular anchorage for Bruine Vloot vessels.", date: "Kandidaat" },
  { id: 8, name: "Stavoren", lat: 52.8820, lng: 5.3624, status: "kandidaat", ships: 17, notes: "Oudste havenstad van Friesland.", notes_en: "The oldest harbour town in Friesland.", date: "Kandidaat" },
  { id: 9, name: "Monnickendam", lat: 52.4567, lng: 5.0394, status: "kandidaat", ships: 24, notes: "Historische havenstad aan het Markermeer.", notes_en: "Historic harbour town on the Markermeer.", date: "Kandidaat" },
  { id: 10, name: "Kampen", lat: 52.5573, lng: 5.9110, status: "kandidaat", ships: 23, notes: "Historische Hanzestad aan de IJssel.", notes_en: "Historic Hanseatic city on the IJssel river.", date: "Kandidaat" },
  { id: 11, name: "Medemblik", lat: 52.7690, lng: 5.1167, status: "kandidaat", ships: 21, notes: "Onderdeel Westfriese erfgoedroute.", notes_en: "Part of the West Frisian heritage route.", date: "Kandidaat" },
  { id: 12, name: "Lelystad", lat: 52.5185, lng: 5.4714, status: "kandidaat", ships: 19, notes: "Nieuwe haven, thuisbasis voor diverse historische schepen.", notes_en: "Modern harbour serving as home base for various historic vessels.", date: "Kandidaat" },
  { id: 13, name: "Makkum", lat: 53.0556, lng: 5.3957, status: "kandidaat", ships: 14, notes: "Friese havenplaats aan de Waddenzee.", notes_en: "Frisian harbour town on the Wadden Sea.", date: "Kandidaat" },
  { id: 14, name: "Workum", lat: 52.9792, lng: 5.4453, status: "kandidaat", ships: 11, notes: "Karakteristieke Friese havenplaats.", notes_en: "A distinctive Frisian harbour town.", date: "Kandidaat" },
  { id: 15, name: "Lemmer", lat: 52.8449, lng: 5.7147, status: "kandidaat", ships: 22, notes: "Haven aan het IJsselmeer, populair doorgangspunt.", notes_en: "Harbour on the IJsselmeer, a popular transit point.", date: "Kandidaat" },
  { id: 16, name: "Urk", lat: 52.6640, lng: 5.5976, status: "kandidaat", ships: 35, notes: "Sterk lokaal draagvlak via visserijgemeenschap.", notes_en: "Strong local support through the fishing community.", date: "Kandidaat" },
  { id: 17, name: "Muiden", lat: 52.3333, lng: 5.0667, status: "kandidaat", ships: 30, notes: "Populaire ligplaats voor Bruine Vloot nabij Amsterdam.", notes_en: "Popular mooring for Bruine Vloot vessels close to Amsterdam.", date: "Kandidaat" },
  { id: 18, name: "Volendam", lat: 52.4942, lng: 5.0700, status: "kandidaat", ships: 16, notes: "Toeristische havenplaats aan het Markermeer.", notes_en: "Tourist harbour town on the Markermeer.", date: "Kandidaat" },
  { id: 19, name: "Hindelopen", lat: 52.9397, lng: 5.3965, status: "kandidaat", ships: 10, notes: "Historische havenplaats aan de Waddenzee.", notes_en: "Historic harbour town on the Wadden Sea.", date: "Kandidaat" },
  { id: 20, name: "Ameland", lat: 53.4551, lng: 5.7606, status: "kandidaat", ships: 9, notes: "Waddeneiland, contact gelegd met haven Nes.", notes_en: "Wadden island; contact established with the harbour at Nes.", date: "Kandidaat" },
  { id: 21, name: "Amsterdam", lat: 52.3737, lng: 4.9033, status: "kandidaat", ships: 67, notes: "NDSM-werf en historische IJ-oevers.", notes_en: "NDSM wharf and the historic IJ waterfront.", date: "Kandidaat" },
];

export const BLOG_POSTS = [
  {
    id: 1,
    title: "Bruine Vloot",
    title_en: "Bruine Vloot",
    date: "20 januari 2026",
    category: "Erfgoed",
    category_en: "Heritage",
    author: "Peter Fokkens",
    authorPhoto: "/team/peter-fokkens.webp",
    readTime: "5 min",
    slug: "bruine-vloot",
    coverImage: { src: "/blog/bruine-vloot/het_vloot_vertrekt.jpg", alt: "De vloot vertrekt" },
    images: [
      { src: "/blog/bruine-vloot/op_het_ijsselmeer.jpg", alt: "Op het IJsselmeer", after: 5 },
    ],
    excerpt: "Het IJsselmeer ligt er wat grijs bij, maar we zijn niet de enigen op het water. De zon schijnt wel, maar er dreigt een grote, donkere bui. Die geeft het IJsselmeer een bijzonder aanzien.",
    excerpt_en: "The IJsselmeer looks somewhat grey, but we are not alone on the water. The sun is shining, but a large, dark squall is threatening. It gives the IJsselmeer a remarkable character.",
    body: [
      "Het IJsselmeer ligt er wat grijs bij, maar we zijn niet de enigen op het water. De zon schijnt wel, maar er dreigt een grote, donkere bui. Die geeft het IJsselmeer een bijzonder aanzien. Gelukkig zijn er verderop weer wat blauwe plekken tussen de donderwolken. In het lage ochtendlicht is het water donkerder dan anders, en de korte golven lichten met een speciaal zilver op. Daarboven krijgen de zeilen van de charterschepen om ons heen een speciale kleur, bijna alsof ze doorschijnend zijn.",
      "Er is geen jacht in de buurt, en we wanen ons honderd jaar terug in de tijd, onderweg van Holland naar Friesland, met lading in, in konvooi de Zuiderzee over. Ik sta op het achterdek, waar schipper Noor de koers verlegt naar het Noorden.",
      "'Als ik in een of ander ver buitenland zou zijn, me afvragend met welke speciale tradities van dat land ik beslist kennis zou willen maken, en ik zou zoiets als dit vinden in de Lonely Planet, dan zou ik er dagen voor omreizen om het mee te maken,' zeg ik, 'Maar hier in Nederland hoor je eigenlijk zelden iets over de Bruine Vloot. Ja, in coronatijd, toen bleek hoe moeilijk jullie het kregen en iedereen besefte dat we dat varend erfgoed toch wel erg graag willen behouden. Maar verder doet iedereen alsof het de gewoonste zaak van de wereld is, of ze weten niet eens dat er zoiets als een bruine vloot bestaat.'",
      "Noor knikt. 'Nou, vergeet niet dat er in de afgelopen jaren ook een paar ongelukken breed in het nieuws zijn geweest. Dat was, net als corona, voor ons ook geen feest, al heeft het de vloot er wel toe gebracht om qua veiligheid de puntjes weer eens op de 'i' te zetten. Er was in bijna dertig jaar praktisch nooit iets gebeurd, dan is het goed om weer even wakker geschud te worden.'",
      "Ik kijk naar de bollende zeilen. 'Ja, dat zal ongetwijfeld. In dat opzicht is het goed dat er volop aandacht is voor de veiligheid. Maar heb jij nou het gevoel dat jullie zo bekend zijn in dit land? Terwijl, dit is toch net alsof je weer honderd jaar terug bent in de geschiedenis? En hoe mooi is het niet op het water, zelfs op een grijze dag als deze?'",
      "Noor kijkt me aan. 'Je verwoordt precies wat ik altijd aan mijn gasten probeer over te brengen,' antwoordt ze. 'Als je nu goed om je heen kijkt, een klein beetje door je oogharen misschien, dan zie je wat dit land groot en bijzonder heeft gemaakt; zeilende vracht- en vissersschepen, het vervoer over water, met enkel natuurlijke hulpbronnen, de wind, en als je niet meer tegen de wind op kon, wachtte je op beter weer. Ik zeg niet dat het beter was dan nu, maar ik heb gemerkt dat ik mij aan boord veel bewuster ben van de elementen, en daardoor ook bewuster omga met mijn omgeving, niet alleen met het schip en het milieu, maar ook met de mensen.'",
      "Ik blijf nog lang op het achterdek, en dat ligt niet alleen aan het feit dat onder de indruk ben van Noor. Ze is zelfverzekerd en straalt een kundigheid uit die haar natuurlijke autoriteit verleent, waardoor ze al haar energie kan steken in het uitstralen van iets anders, authenticiteit, warmte, maar zonder dat het klef wordt. Er komen meer mensen naar achteren, en de gesprekken gaan voort, vloeien naadloos over van schoonheid en traditie naar meer persoonlijke zaken, en dan blijkt dat daar weinig verschil tussen zit; wie bezig is met een vak dat zo verweven is met de elementen, en met de zorg voor zoiets kostbaars als een historisch schip, heeft bijna automatisch ook zorg voor het milieu, en voor mensen.",
      "Aan het eind van de dag, na het hele IJsselmeer gezien te hebben, zeilen we Workum binnen. Noor heeft speciaal gekozen voor deze haven, omdat 't Soal bezeild is. Met alleen nog grootzeil en fok drijven we op de stad aan. Vlak voor het havenkommetje strijken we, en Robin zet de motor aan. Op haar gemak draait ze het schip, zodat we goed tien minuten later met de kop naar buiten liggen, samen met nog drie schepen van de bruine vloot. Aan de overkant van het water liggen een paar mooie jachten, maar alle foto's van voorbijkomende wandelaars worden van onze schepen gemaakt.",
    ],
    body_en: [
      "The IJsselmeer looks somewhat grey, but we are not alone on the water. The sun is shining, but a large, dark squall is threatening. It gives the IJsselmeer a remarkable character. Fortunately, there are patches of blue further on between the storm clouds. In the low morning light the water is darker than usual, and the short waves shimmer with a special silver. Above them, the sails of the charter ships around us take on a special colour, almost as if they were translucent.",
      "There is not a yacht in sight, and we feel transported a hundred years back in time, sailing from Holland to Friesland, laden with cargo, crossing the Zuiderzee in convoy. I stand on the after deck, where skipper Noor adjusts course toward the North.",
      "'If I were somewhere far abroad, wondering which special traditions of that country I absolutely had to experience, and I found something like this in the Lonely Planet, I would travel days out of my way to be here,' I say. 'But here in the Netherlands you rarely hear anything about the Bruine Vloot. Yes, during the pandemic it became clear how difficult things were for you, and everyone realised how much we want to preserve this sailing heritage. But otherwise everyone treats it as the most ordinary thing in the world — or they don't even know something like a Bruine Vloot exists.'",
      "Noor nods. 'Well, don't forget that in recent years a couple of accidents also made the news widely. That was, just like the pandemic, no fun for us either — though it did prompt the fleet to cross the t's and dot the i's on safety again. Almost nothing had gone wrong in nearly thirty years, so it was good to get a wake-up call.'",
      "I look at the billowing sails. 'Yes, no doubt about that. In that respect it's good that safety receives full attention. But do you feel that you are well known in this country? Because this feels like being transported a hundred years back in history. And how beautiful it is on the water, even on a grey day like today.'",
      "Noor looks at me. 'You are putting into words exactly what I always try to convey to my guests,' she replies. 'If you look carefully around you now — squint a little perhaps — you see what made this country great and special: sailing cargo and fishing ships, transport by water, using only natural resources, the wind, and when you could no longer sail into the wind, you waited for better weather. I'm not saying it was better than now, but I've noticed that on board I'm far more aware of the elements, and through that I'm also more mindful of my surroundings — not just the ship and the environment, but people too.'",
      "I stay on the after deck for a long time, and that is not only because I am impressed by Noor. She is confident and radiates a competence that grants her natural authority, freeing all her energy to project something else — authenticity, warmth, without it becoming cloying. More people come aft, and the conversations continue, flowing seamlessly from beauty and tradition to more personal matters; it turns out there is little difference between the two. Anyone engaged in a craft so intertwined with the elements, and with caring for something as precious as a historic ship, almost automatically also cares for the environment and for people.",
      "At the end of the day, after seeing the entire IJsselmeer, we sail into Workum. Noor has deliberately chosen this harbour because 't Soal can be sailed into. Under mainsail and jib alone we drift toward the town. Just before the harbour entrance we strike the sails and Robin starts the engine. Unhurried, she turns the ship, so that a good ten minutes later we are lying bow-out together with three other Bruine Vloot vessels. On the far side of the water are some handsome yachts, but every passing walker points a camera at our ships.",
    ],
  },
];

export const MEDIA_ITEMS = [
  // Video's erfgoed
  { id: 1, type: "video", title: "Waterschatten", title_en: "Water Treasures", description: "Promotiefilm van de BBZ die heel goed gebruikt kan worden om de Bruine Vloot, haar bemanning en de bijbehorende beroepsvelden voor te stellen.", description_en: "Promotional film by the BBZ that can be used to introduce the Bruine Vloot, its crew and associated professions.", category: "video", tag: "Vloot", tag_en: "Fleet", format: "MP4" },
  { id: 2, type: "video", title: "Renée, schipper van de Bontekoe", title_en: "Renée, skipper of the Bontekoe", description: "Schipper Renée vertelt over haar leven aan boord van een schip van de Bruine Vloot.", description_en: "Skipper Renée talks about her life on board a Bruine Vloot vessel.", category: "video", tag: "Schipper", tag_en: "Skipper", format: "MP4" },
  { id: 3, type: "video", title: "Tess op zee", title_en: "Tess at sea", description: "Matroos Tess vertelt over haar leven aan boord van een schip op zee.", description_en: "Sailor Tess talks about her life on board a ship at sea.", category: "video", tag: "Matroos", tag_en: "Sailor", format: "MP4" },
  { id: 4, type: "video", title: "Patrick, zeilmaker", title_en: "Patrick, sailmaker", description: "Patrick toont zijn ambacht van zeilen ontwerpen, repareren en onderhouden. Zijn passie en vakmanschap zijn cruciaal voor het behoud van het immaterieel erfgoed.", description_en: "Patrick demonstrates his craft of designing, repairing and maintaining sails. His passion and craftsmanship are crucial to preserving intangible cultural heritage.", category: "video", tag: "Zeilmaker", tag_en: "Sailmaker", format: "MP4" },
  { id: 5, type: "video", title: "Patrick, zeilmaker", title_en: "Patrick, sailmaker", description: "Patrick, een zeilmaker voor de historische chartervloot, toont zijn ambacht van zeilen ontwerpen, repareren en onderhouden.", description_en: "Patrick, a sailmaker for the historic charter fleet, demonstrates his craft of designing, repairing and maintaining sails.", category: "video", tag: "Havens", tag_en: "Harbours", format: "MP4" },
  { id: 6, type: "video", title: "Marijke de Jong", title_en: "Marijke de Jong", description: "De film portretteert scheepsbouwkundige Marijke de Jong als ontwerper en adviseur voor de zeilende chartervaart.", description_en: "The film portraits naval architect Marijke de Jong as a designer and adviser for the sailing charter industry.", category: "video", tag: "Tuigage", tag_en: "Rigging", format: "MP4" },
  // Foto's erfgoed
  { id: 7, type: "photo", title: "Fotocollectie", title_en: "Photo collection", description: "Een verzameling foto's uit de erfgoedsector voor vrij gebruik. Neem contact op voor meer of specifieke beelden.", description_en: "A collection of photos from the heritage sector for free use. Contact us for more or specific images.", category: "foto", tag: "Foto", tag_en: "Photo", format: "ZIP" },
  // Complete projecten
  { id: 8, type: "project", title: "Het kleinste kamertje", title_en: "The smallest room", description: "Film over het Zuiderzeemuseum in NL, DE en EN, inclusief teksten en instructies voor de speurtocht. Neem contact op voor hogere resoluties.", description_en: "Film about the Zuiderzeemuseum in Dutch, German and English, including texts and instructions for the trail. Contact us for higher resolutions.", category: "project", tag: "Museum", tag_en: "Museum", format: "ZIP" },
  // Teksten erfgoed
  { id: 9, type: "text", title: "Borgingsplan Kien", title_en: "Safeguarding plan Kien", description: "Het borgingsplan Schipper Bruine Vloot als tekst om te downloaden.", description_en: "The Bruine Vloot skipper safeguarding plan available to download.", category: "tekst", tag: "Borgingsplan", tag_en: "Safeguarding plan", format: "PDF" },
  // Webpagina's erfgoed
  { id: 10, type: "text", title: "Schipper Bruine Vloot", title_en: "Bruine Vloot Skipper", description: "Tekst over het immaterieel erfgoed Schipper Bruine Vloot en zijn betekenis. Beschikbaar in het Nederlands en het Duits.", description_en: "Text on the intangible cultural heritage of the Bruine Vloot skipper and its significance. Available in Dutch and German.", category: "tekst", tag: "Erfgoed", tag_en: "Heritage", format: "PDF" },
  // Podcasts
  { id: 11, type: "podcast", title: "Roefgesprekken", title_en: "Cabin conversations", description: "Podcast met verhalen van zeevarenden: kapiteins, stuurmannen en vrouwen, scheepskoks, matrozen en anderen werkzaam op een schip.", description_en: "Podcast featuring stories from seafarers: captains, mates, cooks, sailors and others who work aboard a ship.", category: "podcast", tag: "Podcast", tag_en: "Podcast", format: "MP3" },
];
