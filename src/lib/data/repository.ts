import type {
  Clinician,
  ClinicianStatusRecord,
  PlaceMatch,
  PracticeLocation,
  Hospital,
  Insurer,
  NameMapping,
  Network,
  NetworkStatusRecord,
  Plan,
  Source,
  ZipRecord,
} from "../types";

/**
 * The only way pages and components read data.
 *
 * Version 1 implements this with static JSON files (json-repository.ts,
 * added in step 2). A database-backed implementation can replace it later
 * without touching the UI.
 */
export interface Repository {
  getZip(zip: string): Promise<ZipRecord | null>;

  listPlans(): Promise<Plan[]>;
  getPlan(id: string): Promise<Plan | null>;

  listHospitals(): Promise<Hospital[]>;
  getHospital(id: string): Promise<Hospital | null>;

  listInsurers(): Promise<Insurer[]>;
  listNetworks(): Promise<Network[]>;

  /** Verified records only. A missing network/hospital pair means unknown. */
  listNetworkStatus(): Promise<NetworkStatusRecord[]>;

  listNameMappings(): Promise<NameMapping[]>;

  getSource(id: string): Promise<Source | null>;

  listClinicians(): Promise<Clinician[]>;
  listPracticeLocations(): Promise<PracticeLocation[]>;
  getPracticeLocation(id: string): Promise<PracticeLocation | null>;
  /** Verified records only. A missing network/clinician pair means unknown. */
  listClinicianStatus(): Promise<ClinicianStatusRecord[]>;
  /** Google place IDs for practice locations (IDs only, per Google's terms). */
  getPlaceMatch(locationId: string): Promise<PlaceMatch | null>;
  listSources(): Promise<Source[]>;
}
