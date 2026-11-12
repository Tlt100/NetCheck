import type {
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
  listSources(): Promise<Source[]>;
}
