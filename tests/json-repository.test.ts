import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { createJsonRepository } from "../src/lib/data/json-repository.ts";

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
const load = (name: string) =>
  JSON.parse(readFileSync(join(dataDir, `${name}.json`), "utf8"));

const repo = createJsonRepository({
  sources: load("sources"),
  insurers: load("insurers"),
  networks: load("networks"),
  plans: load("plans"),
  hospitals: load("hospitals"),
  networkStatus: load("network-status"),
  nameMappings: load("name-mappings"),
  zips: load("zips"),
});

test("finds a supported ZIP and reports its county", async () => {
  const zip = await repo.getZip("08901");
  assert.equal(zip?.county, "Middlesex");
});

test("returns null for a ZIP outside the supported counties", async () => {
  assert.equal(await repo.getZip("07102"), null); // Newark, Essex County
  assert.equal(await repo.getZip("abcde"), null);
});

test("looks up plans and hospitals by ID", async () => {
  const [firstPlan] = await repo.listPlans();
  assert.equal((await repo.getPlan(firstPlan.id))?.id, firstPlan.id);
  assert.equal(await repo.getPlan("no-such-plan"), null);

  const hospital = await repo.getHospital("310070");
  assert.equal(hospital?.city, "New Brunswick");
  assert.equal(await repo.getHospital("000000"), null);
});

test("every plan points to a network from the same insurer", async () => {
  const networks = new Map((await repo.listNetworks()).map((n) => [n.id, n]));
  for (const plan of await repo.listPlans()) {
    assert.equal(networks.get(plan.networkId)?.insurerId, plan.insurerId, plan.id);
  }
});

test("every record's source can be resolved", async () => {
  const records = [
    ...(await repo.listPlans()),
    ...(await repo.listHospitals()),
    ...(await repo.listNetworks()),
    ...(await repo.listInsurers()),
    ...(await repo.listNetworkStatus()),
  ];
  for (const record of records) {
    assert.ok(await repo.getSource(record.sourceId), record.sourceId);
  }
});

test("network status only ever says in-network or out-of-network", async () => {
  for (const record of await repo.listNetworkStatus()) {
    assert.ok(["in-network", "out-of-network"].includes(record.status));
  }
});
