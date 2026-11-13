const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "2026-11-13" -> "Nov 13, 2026". Parsed by hand to avoid timezone shifts. */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

/** "3.2 mi". Distances are straight-line, so one decimal is plenty. */
export function formatMiles(miles: number): string {
  return `${miles.toFixed(1)} mi`;
}
