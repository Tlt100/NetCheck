import hospitals from "../../../data/hospitals.json";
import insurers from "../../../data/insurers.json";
import nameMappings from "../../../data/name-mappings.json";
import networkStatus from "../../../data/network-status.json";
import networks from "../../../data/networks.json";
import plans from "../../../data/plans.json";
import sources from "../../../data/sources.json";
import zips from "../../../data/zips.json";

import { createJsonRepository, type DataTables } from "./json-repository";
import type { Repository } from "./repository";

// The JSON is checked against the schema by scripts/validate-data.mjs before
// every build, so the cast below is backed by a real check.
const tables = {
  sources,
  insurers,
  networks,
  plans,
  hospitals,
  networkStatus,
  nameMappings,
  zips,
} as unknown as DataTables;

/**
 * The data source for the whole app. To move to a database later, build a
 * different Repository here; nothing else needs to change.
 */
export const repository: Repository = createJsonRepository(tables);
