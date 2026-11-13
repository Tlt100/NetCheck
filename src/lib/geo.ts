/** Distance choices offered to the user, in miles. */
export const RADIUS_OPTIONS = [5, 10, 15, 25] as const;
export type RadiusMiles = (typeof RADIUS_OPTIONS)[number];
export const DEFAULT_RADIUS: RadiusMiles = 15;

const EARTH_RADIUS_MILES = 3958.8;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Straight-line ("as the crow flies") distance between two points. */
export function haversineMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(a));
}

/** True for exactly five digits. Says nothing about whether the ZIP exists. */
export function isZipFormat(value: string): boolean {
  return /^\d{5}$/.test(value);
}

/** Reads a radius from user input, falling back to the default. */
export function parseRadius(value: string | undefined): RadiusMiles {
  const n = Number(value);
  return (RADIUS_OPTIONS as readonly number[]).includes(n)
    ? (n as RadiusMiles)
    : DEFAULT_RADIUS;
}
