// Finds the Google Maps place for each practice location and writes
// data/place-matches.json. Only the place ID is stored, as Google's terms
// allow; names and addresses returned by Google are compared in memory and
// then discarded.
//
// Needs GOOGLE_MAPS_API_KEY in the environment (for example in .env.local,
// loaded with: node --env-file=.env.local scripts/match-places.mjs).
// Uses Places API Text Search with Pro fields: one request per location,
// inside Google's monthly free allowance for this dataset's size.
//
// A match counts as "exact" only when Google's street number, street and
// ZIP equal the registry's AND the place name shares a word with the
// practice name or says "pediatric". Medical buildings hold many offices,
// so an address match alone is recorded as "fuzzy", and fuzzy matches never
// show a rating.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
const read = (name) => JSON.parse(readFileSync(join(DATA, `${name}.json`), "utf8"));

const KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!KEY) {
  console.error("GOOGLE_MAPS_API_KEY is not set. Nothing was changed.");
  process.exit(1);
}

const TODAY = new Date().toISOString().slice(0, 10);
const FIELDS = "places.id,places.displayName,places.formattedAddress";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const WORDS = [
  [/\bstreet\b/g, "st"], [/\bavenue\b/g, "ave"], [/\broad\b/g, "rd"], [/\bdrive\b/g, "dr"],
  [/\bplace\b/g, "pl"], [/\bplaza\b/g, "plz"], [/\bboulevard\b/g, "blvd"], [/\blane\b/g, "ln"],
  [/\bcourt\b/g, "ct"], [/\bhighway\b/g, "hwy"], [/\broute\b/g, "rte"], [/\bnorth\b/g, "n"],
  [/\bsouth\b/g, "s"], [/\beast\b/g, "e"], [/\bwest\b/g, "w"], [/\bone\b/g, "1"],
];
function streetKey(line) {
  let s = line.toLowerCase().replace(/#\s*\S+/g, " ").replace(/[.,]/g, " ");
  s = s.replace(/\b(ste|suite|fl|floor|unit|bldg|building|rm|room|apt)\b.*$/, "");
  for (const [re, to] of WORDS) s = s.replace(re, to);
  return s.replace(/\s+/g, " ").trim();
}

const STOP = new Set(["llc", "pc", "pa", "md", "inc", "the", "of", "and", "group", "medical", "health", "associates", "center", "care"]);
const significant = (s) =>
  new Set((s ?? "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)));

async function search(location) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": KEY, "X-Goog-FieldMask": FIELDS },
    body: JSON.stringify({
      textQuery: `${location.practiceName ?? "pediatrician"}, ${location.street}, ${location.city}, NJ ${location.zip}`,
      locationBias: { circle: { center: { latitude: location.lat, longitude: location.lon }, radius: 200 } },
      pageSize: 5,
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()).places ?? [];
}

const locations = read("practice-locations");
const matches = [];
let exact = 0, fuzzy = 0, none = 0;

for (const location of locations) {
  const wantStreet = streetKey(location.street);
  let best = null;
  for (const place of await search(location)) {
    const [streetPart, , stateZip] = (place.formattedAddress ?? "").split(",").map((s) => s.trim());
    const zip = (stateZip ?? "").match(/\d{5}/)?.[0];
    if (!streetPart || zip !== location.zip || streetKey(streetPart) !== wantStreet) continue;
    const name = place.displayName?.text ?? "";
    const shared = [...significant(location.practiceName)].some((w) => significant(name).has(w));
    const confidence = shared || /pediatric/i.test(name) ? "exact" : "fuzzy";
    if (!best || (confidence === "exact" && best.confidence !== "exact")) best = { place, confidence };
  }
  if (!best) { none++; } else {
    if (best.confidence === "exact") exact++;
    else fuzzy++;
    matches.push({
      locationId: location.id,
      placeId: best.place.id,
      confidence: best.confidence,
      checkedOn: TODAY,
      method: best.confidence === "exact"
        ? "Street number, street and ZIP agree, and the place name matches the practice name or says pediatric"
        : "Street number, street and ZIP agree, but the name does not confirm it is this practice",
    });
  }
  await sleep(120);
}

writeFileSync(join(DATA, "place-matches.json"), JSON.stringify(matches, null, 2) + "\n");
console.log(`${locations.length} locations: ${exact} exact, ${fuzzy} fuzzy (not shown), ${none} not found.`);
