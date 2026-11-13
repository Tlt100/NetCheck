import assert from "node:assert/strict";
import { test } from "node:test";

import { haversineMiles, isZipFormat, parseRadius } from "../src/lib/geo.ts";
import {
  findNearbyHospitals,
  rankByNetworkScore,
  scorePlan,
} from "../src/lib/scoring.ts";

// Minimal hand-built rows. Only the fields the logic reads are meaningful.
const hospital = (id: string, lat: number, lon: number) =>
  ({ id, name: `Hospital ${id}`, lat, lon }) as never;
const plan = (id: string, networkId: string) =>
  ({ id, networkId, marketingName: id }) as never;
const record = (networkId: string, hospitalId: string, status: string) =>
  ({ networkId, hospitalId, status }) as never;

const origin = { lat: 40.5, lon: -74.45 };
// Roughly 0, 7 and 35 miles north of the origin (1 degree of latitude is about 69 miles).
const hospitals = [
  hospital("far", 41.0072, -74.45),
  hospital("near", 40.5, -74.45),
  hospital("mid", 40.6014, -74.45),
];

test("haversine distance matches a known value", () => {
  // New Brunswick to Trenton is about 23.5 miles in a straight line.
  const miles = haversineMiles(40.4862, -74.4518, 40.2171, -74.7429);
  assert.ok(miles > 23 && miles < 24.5, String(miles));
  assert.equal(haversineMiles(40, -74, 40, -74), 0);
});

test("ZIP format check accepts only five digits", () => {
  assert.equal(isZipFormat("08901"), true);
  for (const bad of ["8901", "089011", "0890a", "", " 08901"]) {
    assert.equal(isZipFormat(bad), false, bad);
  }
});

test("radius falls back to the default for anything not offered", () => {
  assert.equal(parseRadius("25"), 25);
  assert.equal(parseRadius("7"), 15);
  assert.equal(parseRadius(undefined), 15);
  assert.equal(parseRadius("abc"), 15);
});

test("nearby hospitals are filtered by radius and sorted nearest first", () => {
  const within10 = findNearbyHospitals(origin, hospitals, 10);
  assert.deepEqual(within10.map((h) => h.hospital.id), ["near", "mid"]);
  assert.equal(findNearbyHospitals(origin, hospitals, 5).length, 1);
  assert.equal(findNearbyHospitals(origin, hospitals, 50).length, 3);
});

test("a hospital with no verified record is unknown, never out-of-network", () => {
  const nearby = findNearbyHospitals(origin, hospitals, 50);
  const score = scorePlan(plan("p", "net-a"), nearby, [
    record("net-a", "near", "in-network"),
    record("net-a", "mid", "out-of-network"),
  ]);
  assert.deepEqual(
    [score.inNetwork, score.outOfNetwork, score.unknown, score.total],
    [1, 1, 1, 3],
  );
  assert.equal(score.hospitals.find((h) => h.hospital.id === "far")?.status, "unknown");
});

test("status is read per network, so same-insurer plans can differ", () => {
  const nearby = findNearbyHospitals(origin, hospitals, 10);
  const records = [record("net-a", "near", "in-network")];
  assert.equal(scorePlan(plan("a", "net-a"), nearby, records).inNetwork, 1);
  const other = scorePlan(plan("b", "net-b"), nearby, records);
  assert.deepEqual([other.inNetwork, other.unknown], [0, 2]);
});

test("ranking puts the most verified in-network hospitals first", () => {
  const nearby = findNearbyHospitals(origin, hospitals, 50);
  const records = [
    record("net-a", "near", "in-network"),
    record("net-b", "near", "in-network"),
    record("net-b", "mid", "in-network"),
    record("net-c", "near", "in-network"),
    record("net-c", "mid", "out-of-network"),
  ];
  const ranked = rankByNetworkScore(
    ["a", "b", "c", "d"].map((x) => scorePlan(plan(x, `net-${x}`), nearby, records)),
  );
  // b: 2 in. a and c: 1 in, but c has a verified out-of-network. d: none.
  assert.deepEqual(ranked.map((s) => s.plan.id), ["b", "a", "c", "d"]);
});
