// Builds data/clinicians.json and data/practice-locations.json from the
// monthly NPPES Data Dissemination file (the full federal NPI registry).
//
// Usage:
//   node scripts/extract-pediatricians.mjs <path to NPPES_Data_Dissemination_*.zip> <file month, e.g. "November 2026">
//
// Download the zip from https://download.cms.gov/nppes/NPI_Files.html.
// The CSV inside is about 10 GB, so it is streamed with `unzip -p` and never
// written to disk.
//
// Kept: active individual clinicians (entity type 1) whose PRIMARY taxonomy
// is 208000000X (Pediatrics) and whose primary practice location is in a
// supported ZIP. Organizations (entity type 2) with a pediatric taxonomy at
// the same street address give the location its practice name.
// Locations are then geocoded with the Census batch geocoder; a location the
// geocoder cannot match is left out and counted.

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const [zipPath, fileMonth] = process.argv.slice(2);
if (!zipPath || !fileMonth) {
  console.error('Usage: node scripts/extract-pediatricians.mjs <NPPES zip> "<Month YYYY>"');
  process.exit(1);
}

const DATA = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
const read = (name) => JSON.parse(readFileSync(join(DATA, `${name}.json`), "utf8"));
const write = (name, rows) => writeFileSync(join(DATA, `${name}.json`), JSON.stringify(rows, null, 2) + "\n");
const TODAY = new Date().toISOString().slice(0, 10);
const TAXONOMY = "208000000X";

const zips = new Map(read("zips").map((z) => [z.zip, z]));

// ---------- helpers ----------
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
const titleCase = (s) =>
  s.toLowerCase()
    .replace(/\b([a-z])/g, (c) => c.toUpperCase())
    .replace(/\b(Llc|Pc|Pa|Md|Do|Ii|Iii|Nj|Rwj|Rwjbh|Usa)\b/g, (w) => w.toUpperCase());
const parseCsvLine = (line) => line.slice(1, -1).split('","');

// ---------- stream the registry ----------
const unzip = spawn("unzip", ["-p", zipPath, "npidata_pfile_*[0-9].csv"]);
unzip.stderr.on("data", (d) => process.stderr.write(d));
const lines = createInterface({ input: unzip.stdout, crlfDelay: Infinity });

let col = null;
const clinicians = new Map();
const locations = new Map();
const orgNames = new Map();
let scanned = 0;

for await (const line of lines) {
  if (!col) {
    const header = parseCsvLine(line);
    const at = (name) => {
      const i = header.indexOf(name);
      if (i < 0) throw new Error(`Column not found: ${name}`);
      return i;
    };
    col = {
      npi: at("NPI"),
      type: at("Entity Type Code"),
      org: at("Provider Organization Name (Legal Business Name)"),
      last: at("Provider Last Name (Legal Name)"),
      first: at("Provider First Name"),
      middle: at("Provider Middle Name"),
      cred: at("Provider Credential Text"),
      street: at("Provider First Line Business Practice Location Address"),
      city: at("Provider Business Practice Location Address City Name"),
      state: at("Provider Business Practice Location Address State Name"),
      zip: at("Provider Business Practice Location Address Postal Code"),
      phone: at("Provider Business Practice Location Address Telephone Number"),
      updated: at("Last Update Date"),
      deactivated: at("NPI Deactivation Date"),
      reactivated: at("NPI Reactivation Date"),
      tax: Array.from({ length: 15 }, (_, k) => at(`Healthcare Provider Taxonomy Code_${k + 1}`)),
      primary: Array.from({ length: 15 }, (_, k) => at(`Healthcare Provider Primary Taxonomy Switch_${k + 1}`)),
    };
    continue;
  }
  if (++scanned % 1_000_000 === 0) process.stdout.write(`${scanned / 1_000_000}M `);
  // Cheap pre-filter before splitting: a New Jersey row with a pediatric code.
  if (!line.includes('"NJ"') || !line.includes('"2080')) continue;

  const f = parseCsvLine(line);
  if (f[col.state] !== "NJ") continue;
  const zip = f[col.zip].slice(0, 5);
  if (!zips.has(zip)) continue;
  if (f[col.deactivated] && !f[col.reactivated]) continue;
  const key = `${streetKey(f[col.street])}|${zip}`;
  const id = "loc-" + createHash("sha1").update(key).digest("hex").slice(0, 10);

  if (f[col.type] === "2") {
    const pediatricOrg = col.tax.some((i) => f[i].startsWith("2080"));
    if (pediatricOrg && !orgNames.has(id) && f[col.org]) orgNames.set(id, titleCase(f[col.org]));
    continue;
  }
  const primaryIdx = col.primary.findIndex((i) => f[i] === "Y");
  if (primaryIdx < 0 || f[col.tax[primaryIdx]] !== TAXONOMY) continue;

  if (!locations.has(id)) {
    locations.set(id, {
      id,
      street: titleCase(f[col.street].replace(/\s+/g, " ").trim()),
      city: titleCase(f[col.city]),
      state: "NJ",
      zip,
      county: zips.get(zip).county,
      phone: f[col.phone] ? f[col.phone].replace(/^(\d{3})(\d{3})(\d{4})$/, "$1-$2-$3") : undefined,
    });
  }
  const middle = f[col.middle] ? `${f[col.middle][0]}.` : "";
  const [mm, dd, yyyy] = f[col.updated].split("/");
  clinicians.set(f[col.npi], {
    npi: f[col.npi],
    name: titleCase([f[col.first], middle, f[col.last]].filter(Boolean).join(" ")),
    credential: f[col.cred] ? f[col.cred].replace(/\./g, "").toUpperCase() : undefined,
    specialty: "pediatrics",
    taxonomyCode: TAXONOMY,
    locationId: id,
    registryLastUpdated: yyyy ? `${yyyy}-${mm}-${dd}` : TODAY,
    sourceId: "nppes-npi-registry",
    lastChecked: TODAY,
  });
}
console.log(`\nScanned ${scanned.toLocaleString()} registry rows: ${clinicians.size} pediatricians at ${locations.size} locations.`);

// ---------- geocode with the Census batch geocoder ----------
const csv = [...locations.values()]
  .map((l) => [l.id, l.street, l.city, "NJ", l.zip].map((v) => `"${String(v).replace(/"/g, "")}"`).join(","))
  .join("\n");
const form = new FormData();
form.append("benchmark", "Public_AR_Current");
form.append("addressFile", new Blob([csv], { type: "text/csv" }), "addresses.csv");
const res = await fetch("https://geocoding.geo.census.gov/geocoder/locations/addressbatch", { method: "POST", body: form });
if (!res.ok) throw new Error(`Census geocoder HTTP ${res.status}`);
const coords = new Map();
for (const row of (await res.text()).split(/\r?\n/)) {
  const cells = row.match(/"([^"]*)"/g)?.map((c) => c.slice(1, -1)) ?? [];
  // id, input address, Match/No_Match, Exact/Non_Exact, matched address, "lon,lat", ...
  if (cells[2] === "Match" && cells[5]) {
    const [lon, lat] = cells[5].split(",").map(Number);
    coords.set(cells[0], { lat: Math.round(lat * 1e5) / 1e5, lon: Math.round(lon * 1e5) / 1e5 });
  }
}

const keptLocations = [];
for (const l of locations.values()) {
  const c = coords.get(l.id);
  if (!c) continue;
  keptLocations.push({
    id: l.id,
    ...(orgNames.has(l.id) ? { practiceName: orgNames.get(l.id) } : {}),
    street: l.street, city: l.city, state: "NJ", zip: l.zip, county: l.county,
    ...(l.phone ? { phone: l.phone } : {}),
    lat: c.lat, lon: c.lon,
    sourceId: "nppes-npi-registry",
    geocodeSourceId: "census-geocoder",
    lastChecked: TODAY,
  });
}
const keptIds = new Set(keptLocations.map((l) => l.id));
const keptClinicians = [...clinicians.values()].filter((c) => keptIds.has(c.locationId));

write("practice-locations", keptLocations.sort((a, b) => a.id.localeCompare(b.id)));
write("clinicians", keptClinicians.sort((a, b) => a.npi.localeCompare(b.npi)));

// ---------- record the source ----------
const sources = read("sources");
const entry = {
  id: "nppes-npi-registry",
  type: "nppes",
  title: `NPPES NPI Registry, monthly data dissemination file (${fileMonth})`,
  publisher: "Centers for Medicare & Medicaid Services",
  url: "https://download.cms.gov/nppes/NPI_Files.html",
  retrievedOn: TODAY,
  note:
    "Clinicians are active individual NPIs whose primary taxonomy is 208000000X (Pediatrics). " +
    "The practice address is the primary practice location the clinician reported to the registry, which can be out of date. " +
    "A location's practice name is the legal name of a pediatric organization NPI at the same street address. " +
    `${locations.size - keptLocations.length} of ${locations.size} locations could not be geocoded and are left out.`,
};
const i = sources.findIndex((s) => s.id === entry.id);
if (i >= 0) sources[i] = entry; else sources.push(entry);
write("sources", sources);

console.log(
  `Kept ${keptClinicians.length} pediatricians at ${keptLocations.length} geocoded locations ` +
    `(${locations.size - keptLocations.length} could not be geocoded); ${[...keptIds].filter((id) => orgNames.has(id)).length} have a practice name.`,
);
