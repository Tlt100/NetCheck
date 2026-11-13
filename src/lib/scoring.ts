import { haversineMiles } from "./geo.ts";
import type {
  DisplayStatus,
  Hospital,
  NetworkStatusRecord,
  Plan,
} from "./types";

export interface NearbyHospital {
  hospital: Hospital;
  distanceMiles: number;
}

export interface HospitalStatus extends NearbyHospital {
  status: DisplayStatus;
  /** The verified record behind the status. Absent when unknown. */
  record?: NetworkStatusRecord;
}

export interface PlanScore {
  plan: Plan;
  /** Every nearby hospital, nearest first. */
  hospitals: HospitalStatus[];
  inNetwork: number;
  outOfNetwork: number;
  unknown: number;
  total: number;
}

/** Hospitals within the radius of a point, nearest first. */
export function findNearbyHospitals(
  origin: { lat: number; lon: number },
  hospitals: Hospital[],
  radiusMiles: number,
): NearbyHospital[] {
  return hospitals
    .map((hospital) => ({
      hospital,
      distanceMiles: haversineMiles(
        origin.lat,
        origin.lon,
        hospital.lat,
        hospital.lon,
      ),
    }))
    .filter((h) => h.distanceMiles <= radiusMiles)
    .sort((a, b) => a.distanceMiles - b.distanceMiles);
}

/**
 * Counts where a plan stands at each nearby hospital.
 *
 * A hospital is in-network or out-of-network only when a verified record
 * exists for the plan's network. Everything else is unknown. Unknown is
 * counted separately and is never treated as out-of-network.
 */
export function scorePlan(
  plan: Plan,
  nearby: NearbyHospital[],
  statusRecords: NetworkStatusRecord[],
): PlanScore {
  const byHospital = new Map(
    statusRecords
      .filter((r) => r.networkId === plan.networkId)
      .map((r) => [r.hospitalId, r]),
  );

  const hospitals: HospitalStatus[] = nearby.map((n) => {
    const record = byHospital.get(n.hospital.id);
    return { ...n, status: record ? record.status : "unknown", record };
  });

  const count = (status: DisplayStatus) =>
    hospitals.filter((h) => h.status === status).length;

  return {
    plan,
    hospitals,
    inNetwork: count("in-network"),
    outOfNetwork: count("out-of-network"),
    unknown: count("unknown"),
    total: hospitals.length,
  };
}

/**
 * Orders plans by network score: most verified in-network hospitals first,
 * then fewest verified out-of-network, then by name so the order is stable.
 * This is a sort order, not a recommendation.
 */
export function rankByNetworkScore(scores: PlanScore[]): PlanScore[] {
  return [...scores].sort(
    (a, b) =>
      b.inNetwork - a.inNetwork ||
      a.outOfNetwork - b.outOfNetwork ||
      a.plan.marketingName.localeCompare(b.plan.marketingName),
  );
}
