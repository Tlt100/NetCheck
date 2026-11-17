/**
 * Live Google Maps rating for one place.
 *
 * Google's terms (Places API policies, "Data storage, caching, and
 * scraping") allow storing only the place ID. The rating and review count
 * are therefore fetched fresh on every request and never cached or saved.
 *
 * Only `rating`, `userRatingCount` and `googleMapsUri` are requested. They
 * are billed under the "Place Details Enterprise" SKU; review text would
 * cost more and is not requested.
 */

export interface GoogleRating {
  rating: number | null;
  ratingCount: number;
  /** Link to the place on Google Maps, required for attribution. */
  mapsUrl: string | null;
}

export type GoogleRatingResult =
  | { kind: "ok"; data: GoogleRating }
  | { kind: "not-configured" }
  | { kind: "error" };

const FIELD_MASK = "rating,userRatingCount,googleMapsUri";

/** Fewer reviews than this and NetCheck shows the count but no stars. */
export const MIN_REVIEWS_FOR_STARS = 10;

export async function fetchGoogleRating(placeId: string): Promise<GoogleRatingResult> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key || process.env.GOOGLE_RATINGS_ENABLED !== "true") return { kind: "not-configured" };

  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": FIELD_MASK },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!res.ok) return { kind: "error" };
    const body = (await res.json()) as {
      rating?: number;
      userRatingCount?: number;
      googleMapsUri?: string;
    };
    return {
      kind: "ok",
      data: {
        rating: typeof body.rating === "number" ? body.rating : null,
        ratingCount: typeof body.userRatingCount === "number" ? body.userRatingCount : 0,
        mapsUrl: body.googleMapsUri ?? null,
      },
    };
  } catch {
    return { kind: "error" };
  }
}
