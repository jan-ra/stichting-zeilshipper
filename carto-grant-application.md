# CARTO Grants for Good — Application Draft
### Stichting Zeilschipper

Fields marked **[CONFIRM]** need your input; everything else is drawn from the site content, the CMS data and the codebase.

---

## About you

| Field | Answer |
|---|---|
| Applicant First Name | **[CONFIRM]** e.g. Sven |
| Applicant Last Name | **[CONFIRM]** e.g. Timmann |
| Main Contact Email | info@zeilschipper.nl, or a personal address **[CONFIRM]** |
| Job Title | **[CONFIRM]** Chair of the Board / Secretary / Technical lead. All roles are unpaid. |

Board and volunteers on record: Sven Timmann (Chair, Hamburg / Netherlands), Jan Willem Zandstra (Secretary), Sylvelin "Zippi" Rinnen (Board member), plus volunteers Maaike de Jong, Marja Goud and Cockie Schilperoort.

---

## About your organization

| Field | Answer |
|---|---|
| Organization Name | Stichting Zeilschipper |
| Organization Website | https://zeilschipper.nl |
| City | Amsterdam (Aambeeldstraat 20, 1021 KB) |
| Country | Netherlands |

### Organization's Mission (200 words) — 196 words

Stichting Zeilschipper is a small Dutch foundation, set up in June 2025 by a handful of people who sail these ships themselves. We work to safeguard the craft of the *schipper Bruine Vloot*, the skipper of the traditional Dutch sailing fleet, as living intangible cultural heritage.

For more than sixty years, skippers have taken guests out on historic wooden and steel sailing ships: across the Wadden Sea, the IJsselmeer and the Dutch inland waterways, and from those same home ports out to the Baltic, the Mediterranean, Cape Horn and Antarctica. Around 5,500 skippers and crew work roughly 365 ships, which together logged 46,754 sailing days in 2024.

Almost none of the knowledge that makes this possible is written down. Reading a tide, judging the weather, trimming sail, keeping a hundred-year-old hull alive, looking after thirty strangers at sea: you learn it on deck, from the skipper, the same way everyone before you did.

That chain breaks easily. The pandemic came close to taking the sector out, and the first generation, the people who started in the 1960s and 1970s, is getting old.

So we document the craft, make it visible, and push for recognition. The Dutch national inventory in 2024. UNESCO after that.

### Links to previous projects (up to three)

1. **Interactive fleet globe**, https://zeilschipper.nl/vloot : every ship in the fleet on a 3D globe, with its live AIS position and a rolling seven-day track, filterable by ship type, home port and region.
2. **Information boards harbour map**, https://zeilschipper.nl/informatieborden : the network of heritage information boards across sixteen Dutch harbours, mapped by placement status (completed, submitted, candidate).
3. **Road to UNESCO**, https://zeilschipper.nl/unesco : the nomination dossier criterion by criterion, with the 2020 to 2029 timeline running from the Pampus gathering to the UNESCO decision.

All three are free, public, and carry no advertising, tracking or paywall.

### Previous CARTO uses if applicable (200 words) — 187 words

Only in development, never in production, and it still bothers us.

We built both maps, the fleet globe and the harbour map, on CARTO's dark label-free raster basemap (`dark_nolabels`). It was simply the right one. The whole site is dark and deliberately quiet so that the ships and the harbours are the only things that glow, and CARTO's dark style was the only basemap we found that got out of the way and let that work.

Then we hit a wall that had nothing to do with cartography. Our site is a static bundle with no server behind it, so it cannot keep an API key secret, and we needed a provider that authenticates by domain instead. We swapped the basemap out before launch and lost the label-free variant along with it. The live maps now carry place names that none of us wanted, and we notice every time we open the fleet page.

Beyond basemaps we have never touched the platform. Everything spatial we do is hand-written JavaScript over static JSON files, because that is what six volunteers with no budget can actually build.

---

## You need

### How do you plan to use CARTO? (500 words) — 489 words

We are sitting on a genuinely spatial dataset that we cannot do justice to.

**What we have.** Every night a scheduled job asks a commercial AIS provider where our fleet is, merges each fix into a rolling seven-day track per vessel, and writes the result to object storage. That is 190 ships, 184 of them currently reporting. Alongside it we hold the fleet register itself: ship name, rig type, year of build (1875 to 2003), passenger capacity, home port. And the harbour layer: sixteen harbours with coordinates, information board status, and how many ships berth at each.

**What we cannot do with it.** Our entire spatial stack is bespoke code over static JSON files. A hand-rolled screen-space clusterer. A hand-rolled camera-fitting routine. DOM markers drawn on top of a WebGL globe. It renders beautifully and it analyses nothing. We cannot ask where the fleet actually goes, how the sailing grounds have shifted over the years, which harbours hold the network together and which are incidental, or how heritage sailing overlaps the protected waters of the Wadden Sea. Every one of those is an evidence requirement for a UNESCO nomination, and right now we answer them with anecdote and a good story.

**What we would build.**

1. **A fleet activity atlas.** Keep the nightly fixes instead of discarding them after a week, and use CARTO to aggregate the accumulated tracks into density surfaces and H3 grids by season, rig type and year. That turns "skippers sail the Wadden Sea" into a mapped, defensible statement of where this heritage is actually practised, which is the strongest single piece of evidence a nomination dossier can carry.

2. **The harbour network layer.** Put the twenty-harbour information board programme up against berth counts, municipal boundaries and local context, so we can show a partner municipality what their harbour contributes to a national network, and choose the remaining placements on evidence rather than on who answered our email first.

3. **Heritage and environment overlays.** Intersect fleet activity with the Wadden Sea World Heritage boundaries and the Natura 2000 areas. Wind-powered passenger sailing is about as low-carbon as tourism gets, and it happens inside one of Europe's most sensitive marine ecosystems. Being able to show that relationship on a map serves the nature managers we share the water with as much as it serves us.

4. **A public map that is actually a map.** Replace the static bundle with CARTO-backed layers so the fleet page becomes something you can explore: filter by rig, by decade of build, by home port, by season. A school, a museum or a journalist should be able to look at this fleet the way we do.

5. **Oral history, geolocated.** Our next project records the first-generation skippers, the ones who started in the 1960s and 1970s, while they are still with us. Putting those testimonies on the map, the routes they describe, the yards they refitted at, the harbours that no longer take them, makes the archive navigable by place. Which is how sailors remember anything.

### Will this project be commercialized?

**No.** Stichting Zeilschipper is a non-profit foundation with no commercial activity at all. The website is free, carries no advertising, no tracking and no paywall, and any maps or data we produce would be published openly as part of the heritage dossier. We sell nothing. The charter businesses whose heritage we document are separate parties and are not our customers.

### What is the focus of your work?

**Other: cultural heritage**, overlapping strongly with **Environmental** and **Society**.

We safeguard intangible cultural heritage, a living craft handed from one person to the next. That work sits directly on environmental ground: this is wind-powered passenger sailing inside the Wadden Sea World Heritage area, one of the few genuinely low-carbon forms of tourism left in the region. It is social too. The craft is open to anyone regardless of nationality, age, background, gender or education, and you learn it by doing, not by paying for a degree.

### How will your work with CARTO impact the world in a positive way? (500 words) — 481 words

The heritage that disappears is the heritage nobody could see.

Intangible heritage is hard to defend precisely because it is intangible. A cathedral has a footprint on a map. The knowledge of how to bring a hundred-year-old klipper across the Wadden shallows on a falling tide has none. When that knowledge comes under pressure, from regulation written for modern shipping, from ports converting working berths into housing, from a pandemic, from a first generation with no successors, its practitioners have nothing to point at. They have stories. Stories lose to spreadsheets, every time.

Location intelligence changes that. Our fleet already broadcasts its own evidence: every ship carries AIS, and every night we capture where it went. Turned into a spatial archive rather than a rolling week, that becomes the thing this craft has never had. A measured, year-on-year record of where the heritage is practised, by how many vessels, in which seasons, and how that footprint is changing.

**It carries the dossier.** The Dutch state has to submit the nomination on the community's behalf, and the ministry weighs evidence, not enthusiasm. A map showing sixty years of continuous practice across a defined region, with the harbour network that sustains it, is an argument no anecdote can match. We are working towards submission to the Ministry of Education, Culture and Science in 2028 and a UNESCO decision around 2029. What we can prove spatially between now and then will shape how that goes.

**It gives sixteen harbour communities, soon twenty, a reason to hold the line.** Every historic harbour in the Netherlands is under pressure to turn working quays into something more profitable. Our information boards put the skipper's story on the quayside where residents and visitors are standing. Backing those boards with maps that show what the harbour actually contributes to a national heritage network turns local sentiment into a planning argument a municipality can act on.

**It makes the environmental case visible.** These ships carry thousands of passengers a season on wind alone, inside a World Heritage area where the tension between tourism and ecology is real and permanently argued over. Nobody currently has a clear picture of where heritage sailing goes and how it intersects protected zones. We would publish one. That serves the nature managers as much as it serves us, and it lets a low-carbon sector demonstrate its case instead of asserting it.

The method also travels. Traditional sailing communities exist all around the Baltic, the North Sea and the Mediterranean, facing the same slow erosion and equally invisible on a map. If a six-person volunteer foundation with no budget can turn an AIS feed into heritage evidence, that is a template anyone can copy.

Grant support would move our spatial work from a hand-built visualisation to real analysis. For us that is the difference between showing this heritage to people and proving it to the people who decide whether it survives.

### Average annual budget for software and technology

**[CONFIRM]** Suggested wording based on what the project actually spends:

> Under €2,000 per year. The foundation was set up in June 2025 and runs entirely on volunteers. Our recurring technology spend covers domain registration, a small cloud CMS instance, object storage, basemap tiles and an AIS position API. All development is donated time. There is no paid engineering budget.

Adjust the figure if the AIS subscription or other costs push it higher.

---

## Supporting facts (for reference while filling the form)

**Organisation**
- Stichting Zeilschipper, founded June 2025, Amsterdam (Aambeeldstraat 20, 1021 KB)
- Volunteer-run, no paid staff
- Partners: BBZ (Belangenvereniging voor Beroepschartervaart), Zuiderzeemuseum, Het Scheepvaartmuseum Amsterdam, Enkhuizer Zeevaartschool, EOC Scheepsverzekeringen, Scheepswerf Geertman, Scheepsreparatie Friesland

**Heritage timeline**
- Jun 2020: 150+ ships gather at Pampus
- Sep 2021: working group formed to register the craft with KIEN
- May 2022: listed in the Netwerk Immaterieel Erfgoed (KIEN)
- Dec 2023 / 5 Oct 2024: formal inclusion in the Inventaris Immaterieel Erfgoed Nederland, a legal prerequisite for a Dutch UNESCO nomination
- Jun 2025: Stichting Zeilschipper established
- 2026: first information boards placed, heritage exhibition
- 2028: submission to the Ministry of Education, Culture and Science (OCW)
- 2029: UNESCO nomination and decision

**Fleet dataset**
- 190 ships tracked, 184 with live positions and a rolling 7-day track
- Build years 1875 to 2003, 5,905 total passenger capacity
- Rig types: tweemastklipper (68), tjalk (23), klipper (12), klipperaak (8), driemastschoener (5), stevenaak (4), tweemastschoener (4), driemastklipper (4), and others
- Sector-wide: ~5,500 skippers and crew, ~365 ships, 46,754 sailing days in 2024, 60+ years of practice

**Harbour network (16 mapped, target 20)**
- Completed: Enkhuizen (22 ships)
- Submitted: Hoorn (18), Medemblik (11), Stavoren (9), Urk (7), Lelystad Bataviahaven (5)
- Candidate: Amsterdam NDSM (31), Harlingen (14), Lemmer (12), Muiden (9), Makkum (8), Monnickendam (7), Sneek (6), Den Helder (6), Kampen (5), Vollenhove (4)

**Technical stack**
- Static Vite + React front end on Cloudflare Workers, Payload CMS on Fly.io, media and position data on Cloudflare R2
- 3D fleet globe: globe.gl / three.js with custom DOM markers and a hand-written screen-space clusterer
- Harbour map: Leaflet
- Basemap: CARTO `dark_nolabels` during development, Stadia Maps in production (switched for domain-based auth, since a static bundle cannot hold an API key)
- Positions: nightly GitHub Actions cron, MyShipTracking bulk AIS API, merged 7-day history, written to R2

**Other projects**
- Oral History: recording first-generation skippers (1960s and 70s) for an accredited museum collection. No scholarly research on this professional group exists.
- Master-apprentice knowledge transfer: fifteen aspiring skippers per year
- Roefgesprekken podcast (Lisa Bloemers for Stichting Zeilschipper)
