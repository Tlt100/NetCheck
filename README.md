# NetCheck

**See which plans your local hospitals actually take.**

Live site: https://netcheck-nj.vercel.app

## What it does

Enter a New Jersey ZIP code and a distance. NetCheck lists individual health
plans sold in that county and shows, for each plan, which nearby hospitals are
in its network.

- **Results page:** plan cards with a network score ("In-network at 4 of 8
  hospitals within 15 miles"), filters for plan type, metal level and insurer,
  and a breakdown of plan types offered in the county.
- **Plan page:** every nearby hospital with its status, distance, source and
  last-checked date.
- **Hospital page:** address, distance, and each listed plan's status there.
- **Plan types explained:** HMO, EPO, PPO, POS and HDHP/HSA in plain language.
- **About the data:** every source, with the date it was read.
- **Maps:** hospitals or pediatric offices around the ZIP code, drawn with
  Leaflet on OpenStreetMap tiles (free, no key; attribution shown).
- **Medicare star ratings:** each hospital's 1-to-5 Overall Hospital Quality
  Star Rating from the same CMS file as its address.
- **Pediatricians (in progress):** pediatric offices near a ZIP code, the
  doctors at each address, and a live Google Maps rating per office. Network
  status for doctors has not been checked yet, so every doctor shows as "not
  yet verified".

NetCheck informs; the user decides. It does not sell insurance, enroll anyone,
recommend a plan, or give legal, financial or medical advice. It asks only for
a ZIP code and stores nothing.

## Version 1 scope

- ZIP codes in Middlesex and Mercer counties, New Jersey
- Hospitals only (no doctors), New Jersey only (no Pennsylvania hospitals)
- Individual marketplace plans for plan year 2027

## Where the data comes from

| Data | Source |
|---|---|
| Hospital names, addresses, CMS numbers | CMS Provider Data Catalog, Hospital General Information |
| Hospital coordinates | Census Geocoder; OpenStreetMap for the 10 addresses it could not match |
| ZIP centroids and counties | Census 2024 ZCTA gazetteer and 2020 ZCTA-to-county relationship file |
| Plan names, type, metal level, HSA flag | NJ Department of Banking and Insurance, 2027 individual plans and rates |
| Which network a plan uses, and whether it is tiered | Insurer plan pages (Horizon, AmeriHealth) |
| Network status | Insurer provider directories, checked by hand |

Every record in `data/` has a `sourceId` and a `lastChecked` date.
`data/sources.json` lists each source with its URL and the date it was read,
and the site shows the same list at `/about-the-data`.

New Jersey runs its own exchange (Get Covered NJ), so the federal marketplace
public use files are not used.

## Limitations

- **Small verified set.** The dataset has 8 plans, 61 hospitals and 43 verified
  network statuses (two Horizon networks at twelve hospitals and AmeriHealth
  Regional Preferred at nineteen, checked between 2026-11-13 and 2026-11-16). Every other plan and hospital pair shows as "not yet verified".
- **Not every plan.** Plans the state marks "not available in all counties",
  and insurers whose network name could not be sourced, are left out.
- **No tiers yet.** Tiered networks such as Horizon OMNIA are in-network at
  both tiers, but NetCheck has not recorded which tier a hospital is in.
- **Straight-line distance** from the center of the ZIP code area, not driving
  distance. ZIP codes used only for PO boxes are not supported.
- **Plans offered, not enrollment.** The plan type breakdown counts plans on
  sale. County enrollment by plan type is not public.
- **Directories can be wrong or out of date.** Network data can change.
  Confirm with the plan and the hospital before enrolling.

## Pediatricians and Google Maps ratings

- **Doctors** come from the monthly NPPES file (the federal NPI registry):
  active individual NPIs whose primary taxonomy is 208000000X (Pediatrics)
  and whose primary practice location is in a supported ZIP.
  `scripts/extract-pediatricians.mjs` streams the ~12 GB file and geocodes
  each address with the Census batch geocoder. The registry's online search
  was not used because it misses general pediatricians, and the CMS Doctors
  and Clinicians file lists only Medicare-enrolled doctors.
- **Ratings** come from the Google Places API. Google's terms allow storing
  only the place ID, so `data/place-matches.json` holds IDs and nothing else
  (the validator rejects any other field), and the rating and review count
  are fetched fresh each time an office page opens. They are labelled
  "Google Maps" with a link to the listing, as Google's attribution rules
  require. Stars are hidden below 10 reviews.
- **Matching an office to Google** (`scripts/match-places.mjs`) counts as
  exact only when the street number, street and ZIP agree and the place name
  matches the practice. Medical buildings hold many offices, so an address
  match alone is `fuzzy` and shows no rating.
- **No plan-level rating scores.** Google's terms forbid creating content
  from its data, so NetCheck shows each office's own rating and does not
  compute figures such as "offices rated 4+ per plan".
- **Setup:** set `GOOGLE_MAPS_API_KEY` and `GOOGLE_RATINGS_ENABLED=true` in
  Vercel and `.env.local`, then run
  `node --env-file=.env.local scripts/match-places.mjs`. Without them the
  office pages say ratings are not switched on.

## How plan matching works

Hospitals, insurers and the state often name the same plan differently, and
the same insurer can sell plans with different networks. NetCheck handles this
with three tables:

1. **`plans.json`** gives each plan a stable ID and points it at one network.
2. **`networks.json`** is where status attaches. Status is stored per network
   and hospital, never per insurer.
3. **`name-mappings.json`** links each raw name found in a source to a network
   or plan, with a confidence and the source it came from.

| Confidence | Meaning | Can it produce a status? |
|---|---|---|
| `exact` | Raw name equals the normalized name | Yes |
| `manual` | A person confirmed the link | Yes |
| `fuzzy` | Similar name, not confirmed | No |
| `unmatched` | No candidate found | No |

Two rules keep guesses out:

- **A missing record means unknown.** `network-status.json` can only say
  `in-network` or `out-of-network`. There is no "unknown" value to enter by
  mistake; the site shows "not yet verified" when no record exists.
- **Only trusted mappings count.** `scripts/validate-data.mjs` runs before
  every build and fails it if a status relies on a `fuzzy` or `unmatched`
  mapping, or if any record lacks a source or a date.

Example from the current data: Horizon's directory lists three OMNIA labels
("OMNIA", "OMNIA NJ", "OMNIA WITH BLUEHPN") and does not say which one the
individual plans use. All three are mapped to the OMNIA network as `manual`,
and a hospital's status was recorded only because every label agreed.

So far the mappings are entered by hand. There is no automatic name matcher
yet; it will arrive with the price transparency file parser (see Roadmap).

## Project layout

```
data/                     one JSON file per table
scripts/validate-data.mjs data integrity checks, run before every build
src/lib/types.ts          the data schema
src/lib/data/             repository interface and its JSON implementation
src/lib/geo.ts            distance and ZIP helpers
src/lib/scoring.ts        network score per plan
src/lib/filters.ts        filters, sorting, plan type breakdown
src/app/                  pages: home, results, plans, hospitals, explainer, data
src/components/           plan card, forms, status badge, source label
tests/                    unit tests for the loader, scoring and filters
```

Pages read data only through the `Repository` interface, so the JSON files can
be replaced by a database without changing the pages.

## Running it

```
npm install
npm run dev            # local site at http://localhost:3000
npm test               # unit tests
npm run validate-data  # data integrity checks
npm run build          # validates data, then builds
```

Built with Next.js and TypeScript, deployed on Vercel.

## Roadmap

- Verify pediatricians' network status, then add OB-GYN and other specialties

- Parse one hospital price transparency machine-readable file and feed
  `name-mappings.json`, with an automatic matcher for `exact` and `fuzzy`
- Verify more hospitals and add Oscar, UnitedHealthcare and
  Ambetter statuses
- Record network tiers
- Add a script that rebuilds the hospital and ZIP tables from the CMS and
  Census files
