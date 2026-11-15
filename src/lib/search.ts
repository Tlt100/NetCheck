import { repository } from "./data";
import { isZipFormat, parseRadius, type RadiusMiles } from "./geo";
import type { ZipRecord } from "./types";

export type SearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

export const firstValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export interface Search {
  /** The supported ZIP the visitor searched from, if any. */
  zip: ZipRecord | null;
  radius: RadiusMiles;
}

/**
 * Reads the ZIP and distance carried in the page address. Detail pages work
 * with or without them: without a ZIP there are simply no distances.
 */
export async function readSearch(searchParams: SearchParams): Promise<Search> {
  const params = await searchParams;
  const zipInput = (firstValue(params.zip) ?? "").trim();
  const zip = isZipFormat(zipInput) ? await repository.getZip(zipInput) : null;
  return { zip, radius: parseRadius(firstValue(params.radius)) };
}
