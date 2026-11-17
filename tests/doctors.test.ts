import assert from "node:assert/strict";
import { test } from "node:test";

import { countDoctorsForPlan, findNearbyOffices, officeLabel } from "../src/lib/doctors.ts";

const loc = (id: string, lat: number, extra = {}) =>
  ({ id, lat, lon: -74.45, street: `${id} Main St`, ...extra }) as never;
const doc = (npi: string, locationId: string) => ({ npi, name: `Dr ${npi}`, locationId }) as never;
const plan = (id: string, networkId: string) => ({ id, networkId }) as never;
const rec = (networkId: string, npi: string, status: string) => ({ networkId, npi, status }) as never;

const origin = { lat: 40.5, lon: -74.45 };
const locations = [loc("near", 40.5), loc("mid", 40.6014), loc("far", 41.0072), loc("empty", 40.5)];
const clinicians = [doc("1", "near"), doc("2", "near"), doc("3", "mid"), doc("4", "far")];

test("offices are filtered by radius, skip empty offices, and sort nearest first", () => {
  const offices = findNearbyOffices(origin, locations, clinicians, 10);
  assert.deepEqual(offices.map((o) => o.location.id), ["near", "mid"]);
  assert.equal(offices[0].clinicians.length, 2);
});

test("doctors with no verified record count as unknown, never out-of-network", () => {
  const offices = findNearbyOffices(origin, locations, clinicians, 50);
  const count = countDoctorsForPlan(plan("p", "net-a"), offices, [
    rec("net-a", "1", "in-network"),
    rec("net-a", "3", "out-of-network"),
    rec("net-b", "2", "in-network"),
  ]);
  assert.deepEqual(
    [count.inNetwork, count.outOfNetwork, count.unknown, count.total],
    [1, 1, 2, 4],
  );
});

test("office label is the address, never the registered organization name", () => {
  const office = loc("x", 40, { practiceName: "Some Hospital Group LLC", city: "Edison" });
  assert.equal(officeLabel(office), "x Main St, Edison");
});
