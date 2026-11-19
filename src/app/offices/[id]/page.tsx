import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { StatusBadge } from "@/components/StatusBadge";
import { repository } from "@/lib/data";
import { clinicianStatus, officeLabel } from "@/lib/doctors";
import { searchQuery } from "@/lib/filters";
import { formatDate, formatMiles } from "@/lib/format";
import { haversineMiles } from "@/lib/geo";
import { fetchGoogleRating, MIN_REVIEWS_FOR_STARS } from "@/lib/google-places";
import { readSearch, type SearchParams } from "@/lib/search";
import { TRUSTED_CONFIDENCE } from "@/lib/types";
import styles from "../../detail.module.css";

export const metadata: Metadata = { title: "Pediatric office | NetCheck" };

interface Props {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}

export default function OfficePage(props: Props) {
  return (
    <div className={`container ${styles.page}`}>
      <Suspense fallback={<p className={styles.loading}>Loading office…</p>}>
        <Office {...props} />
      </Suspense>
    </div>
  );
}

async function Office({ params, searchParams }: Props) {
  const { id } = await params;
  const location = await repository.getPracticeLocation(id);
  if (!location) notFound();

  const [{ zip, radius }, clinicians, statusRecords, plans, match, sources] = await Promise.all([
    readSearch(searchParams),
    repository.listClinicians(),
    repository.listClinicianStatus(),
    repository.listPlans(),
    repository.getPlaceMatch(location.id),
    repository.listSources(),
  ]);
  const docs = clinicians.filter((c) => c.locationId === location.id).sort((a, b) => a.name.localeCompare(b.name));
  const query = searchQuery(zip?.zip, radius);
  const distance = zip ? haversineMiles(zip.lat, zip.lon, location.lat, location.lon) : undefined;
  const registry = sources.find((s) => s.id === location.sourceId);
  const trustedPlaceId = match && TRUSTED_CONFIDENCE.includes(match.confidence) ? match.placeId : null;

  return (
    <>
      <p className={styles.back}>
        <Link href={zip ? `/pediatricians${query}` : "/pediatricians"}>
          {zip ? `← Back to pediatricians near ${zip.zip}` : "← Find pediatricians"}
        </Link>
      </p>

      <header className={styles.section}>
        <h1>{officeLabel(location)}</h1>
        {location.practiceName && (
          <p className={styles.sub}>
            Registered organization at this address: {location.practiceName}. This is the legal name
            in the registry and may be a parent group rather than the office&rsquo;s own name.
          </p>
        )}
        <address className={styles.address}>
          {location.street}
          <br />
          {location.city}, NJ {location.zip}
          {location.phone && (
            <>
              <br />
              <a href={`tel:${location.phone}`}>{location.phone}</a>
            </>
          )}
        </address>
        {distance !== undefined && zip && (
          <p className={styles.sub}>
            {formatMiles(distance)} from ZIP code {zip.zip} (straight line)
          </p>
        )}
      </header>

      <section className={styles.section} aria-labelledby="rating-heading">
        <h2 id="rating-heading">Google Maps rating</h2>
        <Suspense fallback={<p className={styles.muted}>Loading rating…</p>}>
          <RatingLine placeId={trustedPlaceId} />
        </Suspense>
      </section>

      <p className={styles.notice} role="note">
        <strong>Only some pediatricians have been checked so far.</strong> Confirm with the plan and
        the office before enrolling.
      </p>

      <section className={styles.section} aria-labelledby="doctors-heading">
        <h2 id="doctors-heading">
          {docs.length} {docs.length === 1 ? "pediatrician" : "pediatricians"} at this address
        </h2>
        <ul className={styles.rows}>
          {docs.map((d) => (
            <li key={d.npi}>
              <div>
                <span className={styles.rowTitle}>
                  {d.name}
                  {d.credential ? `, ${d.credential}` : ""}
                </span>
                <div className={styles.small}>NPI {d.npi}</div>
              </div>
              <p className={styles.rowMeta}>
                {plans.map((p) => {
                  const { status } = clinicianStatus(p.networkId, d.npi, statusRecords);
                  return status === "unknown" ? null : (
                    <span key={p.id}>
                      {p.marketingName}: <StatusBadge status={status} />{" "}
                    </span>
                  );
                })}
                {plans.every((p) => clinicianStatus(p.networkId, d.npi, statusRecords).status === "unknown") &&
                  "Not yet verified for any plan."}
                {" "}Registry record last updated by the doctor {formatDate(d.registryLastUpdated)}.
              </p>
            </li>
          ))}
        </ul>
        <p className={styles.small}>
          Doctors and address from{" "}
          {registry ? <a href={registry.url}>{registry.publisher}, NPI Registry</a> : "the NPI registry"}.
          Doctors report their own practice address, so some listings are out of date.
        </p>
      </section>
    </>
  );
}

async function RatingLine({ placeId }: { placeId: string | null }) {
  if (!placeId) {
    return (
      <p className={styles.muted}>
        No confident match to a Google Maps listing for this office, so no rating is shown.
      </p>
    );
  }
  const result = await fetchGoogleRating(placeId);
  if (result.kind === "not-configured") {
    return <p className={styles.muted}>Google Maps ratings are not switched on yet.</p>;
  }
  if (result.kind === "error" || result.data.rating === null) {
    return <p className={styles.muted}>The Google Maps rating could not be loaded right now.</p>;
  }
  const { rating, ratingCount, mapsUrl } = result.data;
  const label = mapsUrl ? <a href={mapsUrl}>Google Maps</a> : "Google Maps";
  return (
    <>
      {ratingCount < MIN_REVIEWS_FOR_STARS ? (
        <p>
          {ratingCount} {ratingCount === 1 ? "review" : "reviews"} on {label}: too few to show a star
          rating.
        </p>
      ) : (
        <p>
          <strong>{rating.toFixed(1)} out of 5</strong> from {ratingCount.toLocaleString("en-US")} reviews
          on {label}
        </p>
      )}
      <p className={styles.small}>
        The rating is for this office as a whole, not one doctor. Reviews often describe wait times,
        staff and billing as well as care.
      </p>
    </>
  );
}
