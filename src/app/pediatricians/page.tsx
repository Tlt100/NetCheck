import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AreaMap } from "@/components/AreaMap";
import { SearchTabs } from "@/components/SearchTabs";
import { ZipForm } from "@/components/ZipForm";
import { repository } from "@/lib/data";
import { countDoctorsForPlan, findNearbyOffices, officeLabel } from "@/lib/doctors";
import { searchQuery } from "@/lib/filters";
import { formatMiles } from "@/lib/format";
import { isZipFormat, parseRadius } from "@/lib/geo";
import { firstValue, type SearchParams } from "@/lib/search";
import styles from "./pediatricians.module.css";

export const metadata: Metadata = { title: "Pediatricians near you | NetCheck" };

export default function PediatriciansPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className={`container ${styles.page}`}>
      <Suspense fallback={<p className={styles.muted}>Looking up pediatricians…</p>}>
        <Pediatricians searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Pediatricians({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const zipInput = (firstValue(params.zip) ?? "").trim();
  const radius = parseRadius(firstValue(params.radius) ?? "10");

  if (!zipInput) {
    return (
      <>
        <h1>Find pediatricians</h1>
        <p className={styles.muted}>Middlesex and Mercer counties, New Jersey.</p>
        <ZipForm radius={radius} find="pediatricians" />
      </>
    );
  }
  if (!isZipFormat(zipInput)) {
    return (
      <>
        <h1>Find pediatricians</h1>
        <ZipForm zip={zipInput} radius={radius} find="pediatricians" error="Enter a 5-digit ZIP code, like 08901." />
      </>
    );
  }
  const zip = await repository.getZip(zipInput);
  if (!zip) {
    return (
      <>
        <h1>ZIP code {zipInput} is not covered yet</h1>
        <p>NetCheck covers ZIP codes in Middlesex and Mercer counties, New Jersey.</p>
        <ZipForm zip={zipInput} radius={radius} find="pediatricians" />
      </>
    );
  }

  const [locations, clinicians, statusRecords, plans] = await Promise.all([
    repository.listPracticeLocations(),
    repository.listClinicians(),
    repository.listClinicianStatus(),
    repository.listPlans(),
  ]);
  const offices = findNearbyOffices(zip, locations, clinicians, radius);
  const doctorCount = offices.reduce((n, o) => n + o.clinicians.length, 0);
  const counts = plans
    .filter((p) => p.countiesOffered.includes(zip.county))
    .map((p) => countDoctorsForPlan(p, offices, statusRecords));
  const query = searchQuery(zip.zip, radius);

  return (
    <>
      <header className={styles.heading}>
        <h1>Pediatricians near {zip.zip}</h1>
        <p className={styles.muted}>
          {doctorCount} {doctorCount === 1 ? "pediatrician" : "pediatricians"} at {offices.length}{" "}
          {offices.length === 1 ? "office" : "offices"} within {radius} miles
        </p>
      </header>

      <SearchTabs active="pediatricians" query={query} />

      <ZipForm zip={zip.zip} radius={radius} find="pediatricians" compact />

      <p className={styles.notice} role="note">
        <strong>Only some pediatricians have been checked so far.</strong> &ldquo;Not yet
        verified&rdquo; means nobody has checked, not that the doctor is outside the network. Confirm
        with the plan and the office before enrolling.
      </p>

      {offices.length > 0 && (
        <AreaMap
          center={{ lat: zip.lat, lon: zip.lon, label: `ZIP code ${zip.zip}` }}
          radiusMiles={radius}
          pointsLabel="pediatric offices"
          points={offices.map(({ location, distanceMiles, clinicians: docs }) => ({
            id: location.id,
            lat: location.lat,
            lon: location.lon,
            label: officeLabel(location),
            detail: `${docs.length} ${docs.length === 1 ? "pediatrician" : "pediatricians"} · ${formatMiles(distanceMiles)}`,
            href: `/offices/${location.id}${query}`,
          }))}
        />
      )}

      <section aria-labelledby="by-plan" className={styles.section}>
        <h2 id="by-plan">By plan</h2>
        <ul className={styles.planRows}>
          {counts.map((c) => (
            <li key={c.plan.id}>
              <Link href={`/plans/${c.plan.id}${query}`}>{c.plan.marketingName}</Link>
              <span className={styles.muted}>
                {c.inNetwork} in-network · {c.unknown} not yet verified
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="offices" className={styles.section}>
        <h2 id="offices">Offices</h2>
        {offices.length === 0 ? (
          <p className={styles.muted}>No pediatric offices found within {radius} miles. Try a larger distance.</p>
        ) : (
          <ul className={styles.offices}>
            {offices.map(({ location, distanceMiles, clinicians: docs }) => (
              <li key={location.id}>
                <div>
                  <Link href={`/offices/${location.id}${query}`} className={styles.officeName}>
                    {officeLabel(location)}
                  </Link>
                  {location.practiceName && (
                    <div className={styles.muted}>Registered organization: {location.practiceName}</div>
                  )}
                  <div className={styles.small}>
                    {docs.length} {docs.length === 1 ? "pediatrician" : "pediatricians"}
                  </div>
                </div>
                <span className={styles.distance}>{formatMiles(distanceMiles)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className={styles.small}>
        Doctors and addresses come from the federal NPI registry, where doctors report their own
        practice address; some addresses are out of date. Open an office to see its Google Maps
        rating. <Link href="/about-the-data">About the data</Link>
      </p>
    </>
  );
}
