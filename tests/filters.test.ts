import assert from "node:assert/strict";
import { test } from "node:test";

import {
  filterAndSort,
  hasActiveFilters,
  parseFilters,
  planTypeBreakdown,
  searchQuery,
} from "../src/lib/filters.ts";

const plan = (id: string, planType: string, metalLevel: string, insurerId: string) =>
  ({ id, marketingName: id, planType, metalLevel, insurerId }) as never;
const score = (p: never, inNetwork: number) =>
  ({ plan: p, inNetwork, outOfNetwork: 0, unknown: 0, total: inNetwork, hospitals: [] }) as never;

const plans = [
  plan("b-epo-silver", "EPO", "Silver", "x"),
  plan("a-hmo-gold", "HMO", "Gold", "x"),
  plan("c-epo-gold", "EPO", "Gold", "y"),
];
const scores = [score(plans[0], 1), score(plans[1], 3), score(plans[2], 2)];
const ids = (list: { plan: { id: string } }[]) => list.map((s) => s.plan.id);

test("unrecognised filter values are ignored", () => {
  const filters = parseFilters(
    { type: "XYZ", metal: "Copper", insurer: "nobody", sort: "price" },
    ["x", "y"],
  );
  assert.deepEqual(filters, { planType: null, metalLevel: null, insurerId: null, sort: "score" });
  assert.equal(hasActiveFilters(filters), false);
});

test("filters combine and default sort is by network score", () => {
  const all = parseFilters({}, ["x", "y"]);
  assert.deepEqual(ids(filterAndSort(scores, all)), ["a-hmo-gold", "c-epo-gold", "b-epo-silver"]);

  const epoGold = parseFilters({ type: "EPO", metal: "Gold" }, ["x", "y"]);
  assert.deepEqual(ids(filterAndSort(scores, epoGold)), ["c-epo-gold"]);
  assert.equal(hasActiveFilters(epoGold), true);

  const insurerX = parseFilters({ insurer: "x", sort: "name" }, ["x", "y"]);
  assert.deepEqual(ids(filterAndSort(scores, insurerX)), ["a-hmo-gold", "b-epo-silver"]);
});

test("plan type breakdown counts plans offered and skips absent types", () => {
  assert.deepEqual(planTypeBreakdown(plans), [
    { planType: "HMO", count: 1, percent: 33 },
    { planType: "EPO", count: 2, percent: 67 },
  ]);
  assert.deepEqual(planTypeBreakdown([]), []);
});

test("search query is empty when there is no ZIP", () => {
  assert.equal(searchQuery("08901", 15), "?zip=08901&radius=15");
  assert.equal(searchQuery(undefined, 15), "");
});
