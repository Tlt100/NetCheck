import type { PlanScore } from "./scoring.ts";
import { rankByNetworkScore } from "./scoring.ts";
import type { MetalLevel, Plan, PlanType } from "./types";

export const PLAN_TYPES: PlanType[] = ["HMO", "EPO", "PPO", "POS"];
export const METAL_LEVELS: MetalLevel[] = [
  "Catastrophic",
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
];
export const SORT_OPTIONS = ["score", "name"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export interface PlanFilters {
  planType: PlanType | null;
  metalLevel: MetalLevel | null;
  insurerId: string | null;
  sort: SortOption;
}

type Params = { [key: string]: string | string[] | undefined };
const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[]): T | null {
  return allowed.includes(value as T) ? (value as T) : null;
}

/** Reads filters from the page address. Anything unrecognised means "all". */
export function parseFilters(params: Params, insurerIds: string[]): PlanFilters {
  return {
    planType: oneOf(first(params.type), PLAN_TYPES),
    metalLevel: oneOf(first(params.metal), METAL_LEVELS),
    insurerId: oneOf(first(params.insurer), insurerIds),
    sort: oneOf(first(params.sort), SORT_OPTIONS) ?? "score",
  };
}

export function matchesFilters(plan: Plan, filters: PlanFilters): boolean {
  return (
    (!filters.planType || plan.planType === filters.planType) &&
    (!filters.metalLevel || plan.metalLevel === filters.metalLevel) &&
    (!filters.insurerId || plan.insurerId === filters.insurerId)
  );
}

export function filterAndSort(scores: PlanScore[], filters: PlanFilters): PlanScore[] {
  const kept = scores.filter((s) => matchesFilters(s.plan, filters));
  return filters.sort === "name"
    ? [...kept].sort((a, b) =>
        a.plan.marketingName.localeCompare(b.plan.marketingName),
      )
    : rankByNetworkScore(kept);
}

export function hasActiveFilters(filters: PlanFilters): boolean {
  return Boolean(filters.planType || filters.metalLevel || filters.insurerId);
}

export interface PlanTypeShare {
  planType: PlanType;
  count: number;
  /** Whole-number percentage of the plans counted. */
  percent: number;
}

/**
 * Share of each plan type among the plans OFFERED. This counts plans on
 * sale, not people enrolled; enrollment by plan type is not public at
 * county level.
 */
export function planTypeBreakdown(plans: Plan[]): PlanTypeShare[] {
  if (plans.length === 0) return [];
  return PLAN_TYPES.map((planType) => {
    const count = plans.filter((p) => p.planType === planType).length;
    return { planType, count, percent: Math.round((count / plans.length) * 100) };
  }).filter((share) => share.count > 0);
}

/** Query string that carries the search (ZIP and distance) between pages. */
export function searchQuery(zip: string | undefined, radius: number): string {
  return zip ? `?zip=${zip}&radius=${radius}` : "";
}
