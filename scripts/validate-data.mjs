// Checks the JSON files in /data against the rules in src/lib/types.ts.
// Run with: npm run validate-data
// Exits with code 1 if any rule is broken, so it can gate a build.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
const load = (name) =>
  JSON.parse(readFileSync(join(dataDir, `${name}.json`), "utf8"));

const sources = load("sources");
const insurers = load("insurers");
const networks = load("networks");
const plans = load("plans");
const hospitals = load("hospitals");
const statuses = load("network-status");
const mappings = load("name-mappings");
const zips = load("zips");

const errors = [];
const fail = (file, key, message) => errors.push(`${file} [${key}]: ${message}`);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const COUNTIES = ["Middlesex", "Mercer"];
const PLAN_TYPES = ["HMO", "EPO", "PPO", "POS"];
const METALS = ["Catastrophic", "Bronze", "Silver", "Gold", "Platinum"];
const STATUS_VALUES = ["in-network", "out-of-network"];
const CONFIDENCES = ["exact", "manual", "fuzzy", "unmatched"];
const TRUSTED = ["exact", "manual"];

function ids(file, rows) {
  const seen = new Set();
  for (const row of rows) {
    if (!row.id) fail(file, "?", "missing id");
    else if (seen.has(row.id)) fail(file, row.id, "duplicate id");
    seen.add(row.id);
  }
  return seen;
}

const sourceIds = ids("sources", sources);
const insurerIds = ids("insurers", insurers);
const networkIds = ids("networks", networks);
const planIds = ids("plans", plans);
const hospitalIds = ids("hospitals", hospitals);
const mappingById = new Map(mappings.map((m) => [m.id, m]));
ids("name-mappings", mappings);

const needSource = (file, key, id) => {
  if (!sourceIds.has(id)) fail(file, key, `unknown sourceId "${id}"`);
};
const needDate = (file, key, field, value) => {
  if (!ISO_DATE.test(value ?? ""))
    fail(file, key, `${field} must be YYYY-MM-DD`);
};
const needCoords = (file, key, row) => {
  // Rough New Jersey bounding box; catches swapped or missing coordinates.
  if (!(row.lat > 38.8 && row.lat < 41.4 && row.lon > -75.6 && row.lon < -73.8))
    fail(file, key, "lat/lon missing or outside New Jersey");
};

for (const s of sources) {
  needDate("sources", s.id, "retrievedOn", s.retrievedOn);
  if (!/^https:\/\//.test(s.url ?? "")) fail("sources", s.id, "url must be https");
}

for (const i of insurers) needSource("insurers", i.id, i.sourceId);

for (const n of networks) {
  if (!insurerIds.has(n.insurerId)) fail("networks", n.id, "unknown insurerId");
  if (typeof n.tiered !== "boolean" && n.tiered !== null)
    fail("networks", n.id, "tiered must be true, false, or null (not yet confirmed)");
  needSource("networks", n.id, n.sourceId);
  needDate("networks", n.id, "lastChecked", n.lastChecked);
}

const networkById = new Map(networks.map((n) => [n.id, n]));

for (const p of plans) {
  if (!insurerIds.has(p.insurerId)) fail("plans", p.id, "unknown insurerId");
  const network = networkById.get(p.networkId);
  if (!network) fail("plans", p.id, "unknown networkId");
  else if (network.insurerId !== p.insurerId)
    fail("plans", p.id, "network belongs to a different insurer");
  if (!PLAN_TYPES.includes(p.planType)) fail("plans", p.id, "invalid planType");
  if (!METALS.includes(p.metalLevel)) fail("plans", p.id, "invalid metalLevel");
  if (typeof p.hsaEligible !== "boolean") fail("plans", p.id, "hsaEligible must be true/false");
  if (!Number.isInteger(p.planYear)) fail("plans", p.id, "planYear must be a year");
  if (!Array.isArray(p.countiesOffered) || p.countiesOffered.length === 0)
    fail("plans", p.id, "countiesOffered must list at least one county");
  else if (p.countiesOffered.some((c) => !COUNTIES.includes(c)))
    fail("plans", p.id, "countiesOffered has an unsupported county");
  needSource("plans", p.id, p.sourceId);
  needDate("plans", p.id, "lastChecked", p.lastChecked);
}

for (const h of hospitals) {
  if (!/^\d{6}$/.test(h.id ?? "")) fail("hospitals", h.id, "id must be a 6-digit CCN");
  if (h.state !== "NJ") fail("hospitals", h.id, "only NJ hospitals in version 1");
  if (!/^\d{5}$/.test(h.zip ?? "")) fail("hospitals", h.id, "zip must be 5 digits");
  needCoords("hospitals", h.id, h);
  needSource("hospitals", h.id, h.sourceId);
  if (h.geocodeSourceId) needSource("hospitals", h.id, h.geocodeSourceId);
  if (h.cmsStarRating !== null && ![1, 2, 3, 4, 5].includes(h.cmsStarRating))
    fail("hospitals", h.id, "cmsStarRating must be 1-5 or null");
  needDate("hospitals", h.id, "lastChecked", h.lastChecked);
}

const pairs = new Set();
for (const s of statuses) {
  const key = `${s.networkId} / ${s.hospitalId}`;
  if (pairs.has(key)) fail("network-status", key, "duplicate network/hospital pair");
  pairs.add(key);
  const network = networkById.get(s.networkId);
  if (!network) fail("network-status", key, "unknown networkId");
  if (!hospitalIds.has(s.hospitalId)) fail("network-status", key, "unknown hospitalId");
  if (!STATUS_VALUES.includes(s.status))
    fail("network-status", key, 'status must be "in-network" or "out-of-network"; leave the record out if unknown');
  if (s.tier && network && network.tiered !== true)
    fail("network-status", key, "tier set on a network that is not tiered");
  if (s.tier && s.status !== "in-network")
    fail("network-status", key, "tier only applies to in-network records");
  needSource("network-status", key, s.sourceId);
  needDate("network-status", key, "lastChecked", s.lastChecked);
  if (s.mappingId) {
    const mapping = mappingById.get(s.mappingId);
    if (!mapping) fail("network-status", key, "unknown mappingId");
    else if (!TRUSTED.includes(mapping.confidence))
      fail("network-status", key, `status relies on a "${mapping.confidence}" mapping; only exact or manual are allowed`);
  }
}

for (const m of mappings) {
  if (!CONFIDENCES.includes(m.confidence)) fail("name-mappings", m.id, "invalid confidence");
  needSource("name-mappings", m.id, m.sourceId);
  if (m.networkId && m.planId) fail("name-mappings", m.id, "set networkId or planId, not both");
  if (m.networkId && !networkIds.has(m.networkId)) fail("name-mappings", m.id, "unknown networkId");
  if (m.planId && !planIds.has(m.planId)) fail("name-mappings", m.id, "unknown planId");
  const hasTarget = Boolean(m.networkId || m.planId);
  if (m.confidence === "unmatched" && hasTarget)
    fail("name-mappings", m.id, "unmatched mapping must not have a target");
  if (m.confidence !== "unmatched" && !hasTarget)
    fail("name-mappings", m.id, "mapping needs a networkId or planId");
  if (m.confidence === "manual") needDate("name-mappings", m.id, "reviewedOn", m.reviewedOn);
}

const seenZips = new Set();
for (const z of zips) {
  if (!/^\d{5}$/.test(z.zip ?? "")) fail("zips", z.zip, "zip must be 5 digits");
  if (seenZips.has(z.zip)) fail("zips", z.zip, "duplicate zip");
  seenZips.add(z.zip);
  if (!COUNTIES.includes(z.county)) fail("zips", z.zip, "unsupported county");
  needCoords("zips", z.zip, z);
  needSource("zips", z.zip, z.sourceId);
}

// ---------------- Doctors (version 2) ----------------
const clinicians = load("clinicians");
const practiceLocations = load("practice-locations");
const clinicianStatus = load("clinician-status");
const placeMatches = load("place-matches");
const SPECIALTIES = ["pediatrics"];

const locationIds = new Set();
for (const l of practiceLocations) {
  if (!/^loc-[0-9a-f]{10}$/.test(l.id ?? "")) fail("practice-locations", l.id, "id must look like loc-<10 hex>");
  if (locationIds.has(l.id)) fail("practice-locations", l.id, "duplicate id");
  locationIds.add(l.id);
  if (l.state !== "NJ") fail("practice-locations", l.id, "only NJ locations");
  if (!seenZips.has(l.zip)) fail("practice-locations", l.id, "zip is not a supported ZIP");
  if (!COUNTIES.includes(l.county)) fail("practice-locations", l.id, "unsupported county");
  needCoords("practice-locations", l.id, l);
  needSource("practice-locations", l.id, l.sourceId);
  needSource("practice-locations", l.id, l.geocodeSourceId);
  needDate("practice-locations", l.id, "lastChecked", l.lastChecked);
}

const npis = new Set();
for (const c of clinicians) {
  if (!/^\d{10}$/.test(c.npi ?? "")) fail("clinicians", c.npi, "npi must be 10 digits");
  if (npis.has(c.npi)) fail("clinicians", c.npi, "duplicate npi");
  npis.add(c.npi);
  if (!SPECIALTIES.includes(c.specialty)) fail("clinicians", c.npi, "unsupported specialty");
  if (!locationIds.has(c.locationId)) fail("clinicians", c.npi, "unknown locationId");
  needSource("clinicians", c.npi, c.sourceId);
  needDate("clinicians", c.npi, "lastChecked", c.lastChecked);
}

const clinicianPairs = new Set();
for (const s of clinicianStatus) {
  const key = `${s.networkId} / ${s.npi}`;
  if (clinicianPairs.has(key)) fail("clinician-status", key, "duplicate network/clinician pair");
  clinicianPairs.add(key);
  if (!networkById.has(s.networkId)) fail("clinician-status", key, "unknown networkId");
  if (!npis.has(s.npi)) fail("clinician-status", key, "unknown npi");
  if (!STATUS_VALUES.includes(s.status))
    fail("clinician-status", key, 'status must be "in-network" or "out-of-network"; leave the record out if unknown');
  if (s.tier && networkById.get(s.networkId)?.tiered !== true)
    fail("clinician-status", key, "tier set on a network that is not tiered");
  if (s.tier && s.status !== "in-network") fail("clinician-status", key, "tier only applies to in-network records");
  needSource("clinician-status", key, s.sourceId);
  needDate("clinician-status", key, "lastChecked", s.lastChecked);
  if (s.mappingId) {
    const mapping = mappingById.get(s.mappingId);
    if (!mapping) fail("clinician-status", key, "unknown mappingId");
    else if (!TRUSTED.includes(mapping.confidence))
      fail("clinician-status", key, `status relies on a "${mapping.confidence}" mapping; only exact or manual are allowed`);
  }
}

// Google's terms allow storing only the place ID. Any other field would be
// stored Google content, so the check rejects it.
const PLACE_MATCH_FIELDS = new Set(["locationId", "placeId", "confidence", "checkedOn", "method"]);
const matchedLocations = new Set();
for (const m of placeMatches) {
  const key = m.locationId;
  for (const field of Object.keys(m))
    if (!PLACE_MATCH_FIELDS.has(field)) fail("place-matches", key, `field "${field}" is not allowed; store only the place ID`);
  if (!locationIds.has(m.locationId)) fail("place-matches", key, "unknown locationId");
  if (matchedLocations.has(m.locationId)) fail("place-matches", key, "duplicate locationId");
  matchedLocations.add(m.locationId);
  if (!/^[A-Za-z0-9_-]{10,}$/.test(m.placeId ?? "")) fail("place-matches", key, "placeId looks wrong");
  if (!CONFIDENCES.includes(m.confidence)) fail("place-matches", key, "invalid confidence");
  needDate("place-matches", key, "checkedOn", m.checkedOn);
}

if (errors.length > 0) {
  console.error(`Data validation failed with ${errors.length} problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `Data OK: ${plans.length} plans, ${hospitals.length} hospitals, ` +
    `${statuses.length} verified network statuses, ${mappings.length} name mappings, ` +
    `${zips.length} ZIP codes, ${sources.length} sources, ` +
    `${clinicians.length} clinicians at ${practiceLocations.length} locations, ${placeMatches.length} Google place matches.`,
);
