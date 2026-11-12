/**
 * NetCheck data schema.
 *
 * Every record that makes a factual claim (a plan exists, a hospital is at an
 * address, a network includes a hospital) carries a `sourceId` and a
 * `lastChecked` date so the UI can show where it came from and when.
 *
 * Dates are ISO strings: "YYYY-MM-DD".
 */

export type IsoDate = string;

export type County = "Middlesex" | "Mercer";

export type PlanType = "HMO" | "EPO" | "PPO" | "POS";

export type MetalLevel =
  | "Catastrophic"
  | "Bronze"
  | "Silver"
  | "Gold"
  | "Platinum";

/** Where a piece of data came from. */
export type SourceType =
  | "insurer-directory" // insurer's online provider/hospital directory
  | "hospital-mrf" // hospital price transparency machine-readable file
  | "insurer-tic" // insurer Transparency in Coverage file
  | "marketplace" // GetCoveredNJ plan listings
  | "regulator" // NJ Department of Banking and Insurance
  | "insurer-plan-document" // SBC, brochure, or plan page
  | "cms" // CMS Provider Data Catalog
  | "census"; // Census Bureau gazetteer / geocoder

export interface Source {
  id: string;
  type: SourceType;
  title: string;
  publisher: string;
  url: string;
  /** The date the source was read. */
  retrievedOn: IsoDate;
  note?: string;
}

export interface Insurer {
  id: string;
  name: string;
  sourceId: string;
}

/**
 * A provider network run by an insurer. Network status is stored against the
 * network, and each plan points to exactly one network. Two plans from the
 * same insurer can therefore have different hospital coverage.
 */
export interface Network {
  id: string;
  insurerId: string;
  name: string;
  /** True if the network sorts in-network hospitals into cost tiers. */
  tiered: boolean;
  sourceId: string;
  lastChecked: IsoDate;
}

export interface Plan {
  /** Stable NetCheck ID. Never reused, never derived from a display name. */
  id: string;
  insurerId: string;
  networkId: string;
  /** Name as shown on GetCoveredNJ. */
  marketingName: string;
  planType: PlanType;
  metalLevel: MetalLevel;
  hsaEligible: boolean;
  planYear: number;
  countiesOffered: County[];
  sourceId: string;
  lastChecked: IsoDate;
}

export interface Hospital {
  /** CMS Certification Number (CCN). */
  id: string;
  name: string;
  street: string;
  city: string;
  state: "NJ";
  zip: string;
  /** Any NJ county; hospitals outside Middlesex and Mercer are included. */
  county: string;
  lat: number;
  lon: number;
  /** Source for name and address. */
  sourceId: string;
  /** Source for the coordinates, if different. */
  geocodeSourceId?: string;
  lastChecked: IsoDate;
}

export type NetworkStatusValue = "in-network" | "out-of-network";

/**
 * A verified statement that a network does or does not include a hospital.
 *
 * There is no "unknown" value here on purpose. A missing record IS unknown.
 * Records are only written when someone has checked a source.
 */
export interface NetworkStatusRecord {
  networkId: string;
  hospitalId: string;
  status: NetworkStatusValue;
  /** For tiered networks only, e.g. "Tier 1". */
  tier?: string;
  sourceId: string;
  /** Set when the status was derived from a raw name in a source file. */
  mappingId?: string;
  lastChecked: IsoDate;
}

/** What the UI shows: a verified record, or unknown. */
export type DisplayStatus = NetworkStatusValue | "unknown";

export type MatchConfidence =
  | "exact" // raw name equals the normalized name after cleanup
  | "manual" // a person confirmed the link
  | "fuzzy" // similarity match, not confirmed
  | "unmatched"; // no candidate found

/**
 * Links a raw payer/plan name found in a source file to a normalized network
 * or plan. Only "exact" and "manual" mappings may produce a network status.
 * "fuzzy" and "unmatched" always display as unknown.
 */
export interface NameMapping {
  id: string;
  rawPayerName: string;
  rawPlanName: string;
  /** The file the raw name was found in. */
  sourceId: string;
  /** Null when unmatched. A mapping targets a network or a plan, not both. */
  networkId: string | null;
  planId: string | null;
  confidence: MatchConfidence;
  reviewedOn: IsoDate | null;
  note?: string;
}

export interface ZipRecord {
  zip: string;
  county: County;
  /** ZCTA centroid. */
  lat: number;
  lon: number;
  sourceId: string;
}

/** Mapping confidences that are allowed to produce a network status. */
export const TRUSTED_CONFIDENCE: readonly MatchConfidence[] = [
  "exact",
  "manual",
];
