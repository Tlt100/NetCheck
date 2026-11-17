import { haversineMiles } from "./geo.ts";
import type {
  Clinician,
  ClinicianStatusRecord,
  DisplayStatus,
  Plan,
  PracticeLocation,
} from "./types";

export interface NearbyOffice {
  location: PracticeLocation;
  distanceMiles: number;
  clinicians: Clinician[];
}

/** Offices within the radius that have at least one clinician, nearest first. */
export function findNearbyOffices(
  origin: { lat: number; lon: number },
  locations: PracticeLocation[],
  clinicians: Clinician[],
  radiusMiles: number,
): NearbyOffice[] {
  const byLocation = new Map<string, Clinician[]>();
  for (const c of clinicians) {
    const list = byLocation.get(c.locationId) ?? [];
    list.push(c);
    byLocation.set(c.locationId, list);
  }
  return locations
    .map((location) => ({
      location,
      distanceMiles: haversineMiles(origin.lat, origin.lon, location.lat, location.lon),
      clinicians: (byLocation.get(location.id) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter((o) => o.clinicians.length > 0 && o.distanceMiles <= radiusMiles)
    .sort((a, b) => a.distanceMiles - b.distanceMiles);
}

export function clinicianStatus(
  networkId: string,
  npi: string,
  records: ClinicianStatusRecord[],
): { status: DisplayStatus; record?: ClinicianStatusRecord } {
  const record = records.find((r) => r.networkId === networkId && r.npi === npi);
  return record ? { status: record.status, record } : { status: "unknown" };
}

export interface PlanDoctorCount {
  plan: Plan;
  inNetwork: number;
  outOfNetwork: number;
  unknown: number;
  total: number;
}

/**
 * Counts nearby clinicians by status for one plan. As with hospitals,
 * unknown is its own count and is never treated as out-of-network.
 */
export function countDoctorsForPlan(
  plan: Plan,
  offices: NearbyOffice[],
  records: ClinicianStatusRecord[],
): PlanDoctorCount {
  const counts = { inNetwork: 0, outOfNetwork: 0, unknown: 0 };
  for (const office of offices) {
    for (const c of office.clinicians) {
      const { status } = clinicianStatus(plan.networkId, c.npi, records);
      if (status === "in-network") counts.inNetwork++;
      else if (status === "out-of-network") counts.outOfNetwork++;
      else counts.unknown++;
    }
  }
  return { plan, ...counts, total: counts.inNetwork + counts.outOfNetwork + counts.unknown };
}

/** "Saint Peter's Pediatrics" or, without a registered practice name, the street. */
export function officeLabel(location: PracticeLocation): string {
  return location.practiceName ?? location.street;
}
