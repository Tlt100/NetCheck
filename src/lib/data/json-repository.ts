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
import type { Repository } from "./repository";

/** The eight tables, exactly as they are stored in /data. */
export interface DataTables {
  sources: Source[];
  insurers: Insurer[];
  networks: Network[];
  plans: Plan[];
  hospitals: Hospital[];
  networkStatus: NetworkStatusRecord[];
  nameMappings: NameMapping[];
  zips: ZipRecord[];
}

function indexBy<T>(rows: T[], key: (row: T) => string): Map<string, T> {
  return new Map(rows.map((row) => [key(row), row]));
}

/**
 * Repository backed by in-memory tables. It does no file or network access
 * itself, so the same code serves the app (tables imported from JSON) and
 * the tests (tables read from disk or built by hand).
 */
export function createJsonRepository(tables: DataTables): Repository {
  const zips = indexBy(tables.zips, (z) => z.zip);
  const plans = indexBy(tables.plans, (p) => p.id);
  const hospitals = indexBy(tables.hospitals, (h) => h.id);
  const sources = indexBy(tables.sources, (s) => s.id);

  return {
    getZip: async (zip) => zips.get(zip) ?? null,

    listPlans: async () => tables.plans,
    getPlan: async (id) => plans.get(id) ?? null,

    listHospitals: async () => tables.hospitals,
    getHospital: async (id) => hospitals.get(id) ?? null,

    listInsurers: async () => tables.insurers,
    listNetworks: async () => tables.networks,

    listNetworkStatus: async () => tables.networkStatus,
    listNameMappings: async () => tables.nameMappings,

    getSource: async (id) => sources.get(id) ?? null,
    listSources: async () => tables.sources,
  };
}
