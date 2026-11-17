import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { FilterForm } from "@/components/FilterForm";
import { PlanCard } from "@/components/PlanCard";
import { PlanTypeLegend } from "@/components/PlanTypeLegend";
import { ZipForm } from "@/components/ZipForm";
import { repository } from "@/lib/data";
import {
  filterAndSort,
  hasActiveFilters,
  parseFilters,
  planTypeBreakdown,
  searchQuery,
} from "@/lib/filters";
import { isZipFormat, parseRadius } from "@/lib/geo";
import { findNearbyHospitals, scorePlan } from "@/lib/scoring";
import styles from "./results.module.css";

export const metadata: Metadata = { title: "Plans near you | NetCheck" };

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function ResultsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className={`container ${styles.page}`}>
      {/* The ZIP comes from the page address, so this part renders per request. */}
      <Suspense fallback={<p className={styles.loading}>Looking up plans…</p>}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Results({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const zipInput = (first(params.zip) ?? "").trim();
  const radius = parseRadius(first(params.radius));

  if (!isZipFormat(zipInput)) {
    return (
      <>
        <h1>Check a ZIP code</h1>
        <ZipForm
          zip={zipInput}
          radius={radius}
          error={
            zipInput === ""
              ? "Enter a 5-digit ZIP code."
              : `"${zipInput}" is not a 5-digit ZIP code. Enter five numbers, like 08901.`
          }
        />
      </>
    );
  }

  const zip = await repository.getZip(zipInput);
  if (!zip) {
    return (
      <>
        <h1>ZIP code {zipInput} is not covered yet</h1>
        <p>
          NetCheck currently covers ZIP codes in Middlesex and Mercer
          counties, New Jersey. {zipInput} is outside that area, or it is a
          ZIP code used only for PO boxes.
        </p>
        <ZipForm zip={zipInput} radius={radius} />
      </>
    );
  }

  const [plans, hospitals, statusRecords, insurers, networks, sources] =
    await Promise.all([
      repository.listPlans(),
      repository.listHospitals(),
      repository.listNetworkStatus(),
      repository.listInsurers(),
      repository.listNetworks(),
      repository.listSources(),
    ]);

  const nearby = findNearbyHospitals(zip, hospitals, radius);
  const areaPlans = plans.filter((p) => p.countiesOffered.includes(zip.county));
  const areaInsurers = insurers.filter((i) => areaPlans.some((p) => p.insurerId === i.id));
  const filters = parseFilters(params, areaInsurers.map((i) => i.id));
  const ranked = filterAndSort(
    areaPlans.map((plan) => scorePlan(plan, nearby, statusRecords)),
    filters,
  );
  const breakdown = planTypeBreakdown(areaPlans);
  const query = searchQuery(zip.zip, radius);

  const insurerById = new Map(insurers.map((i) => [i.id, i]));
  const networkById = new Map(networks.map((n) => [n.id, n]));
  const sourceById = new Map(sources.map((s) => [s.id, s]));

  return (
    <>
      <header className={styles.heading}>
        <h1>Plans sold in {zip.county} County</h1>
        <p>
          ZIP code {zip.zip} · {nearby.length}{" "}
          {nearby.length === 1 ? "hospital" : "hospitals"} within {radius}{" "}
          miles
        </p>
      </header>

      <ZipForm zip={zip.zip} radius={radius} compact />

      <p className={styles.notice} role="note">
        <strong>
          Network data can change. Confirm with the plan and the hospital
          before enrolling.
        </strong>{" "}
        &ldquo;Not yet verified&rdquo; means nobody has checked. It does not
        mean the hospital is outside the network.
      </p>

      <section aria-labelledby="overview-heading" className={styles.overview}>
        <h2 id="overview-heading">Plans offered in {zip.county} County</h2>
        <ul className={styles.shares}>
          {breakdown.map((share) => (
            <li key={share.planType}>
              <strong>{share.percent}%</strong> {share.planType}
              <span>
                {" "}
                ({share.count} of {areaPlans.length})
              </span>
            </li>
          ))}
        </ul>
        <p className={styles.sortNote}>
          Share of the {areaPlans.length} plans in NetCheck&rsquo;s list, by plan type. This counts
          plans offered, not how many people chose them, and NetCheck does not yet list every plan
          sold in the county.
        </p>
      </section>

      <PlanTypeLegend />

      {nearby.length === 0 ? (
        <p>
          No hospitals in NetCheck&rsquo;s list are within {radius} miles of{" "}
          {zip.zip}. Try a larger distance.
        </p>
      ) : (
        <section aria-labelledby="plans-heading" className={styles.list}>
          <div>
            <h2 id="plans-heading">
              {hasActiveFilters(filters)
                ? `${ranked.length} of ${areaPlans.length} plans match your filters`
                : `${ranked.length} ${ranked.length === 1 ? "plan" : "plans"}`}
            </h2>
            <p className={styles.sortNote}>
              {filters.sort === "name"
                ? "Sorted by plan name."
                : "Sorted by the number of nearby hospitals verified in-network."}{" "}
              The order is not a recommendation.
            </p>
          </div>
          <FilterForm zip={zip.zip} radius={radius} filters={filters} insurers={areaInsurers} />
          {ranked.length === 0 && (
            <p>
              No plans match these filters. <a href={`/results${query}`}>Clear filters</a>
            </p>
          )}
          <ol className={styles.cards}>
            {ranked.map((score) => (
              <li key={score.plan.id}>
                <PlanCard
                  score={score}
                  radius={radius}
                  query={query}
                  sources={sourceById}
                  insurer={insurerById.get(score.plan.insurerId)}
                  network={networkById.get(score.plan.networkId)}
                  planSource={sourceById.get(score.plan.sourceId)}
                />
              </li>
            ))}
          </ol>
        </section>
      )}

      <p className={styles.method}>
        <Link href={`/pediatricians${query}`}>Pediatricians near {zip.zip}</Link>
      </p>

      <p className={styles.method}>
        Distances are straight-line, measured from the center of the ZIP code
        area to each hospital. Hospitals are New Jersey acute care hospitals
        from the CMS hospital list; Pennsylvania hospitals are not included.
      </p>
    </>
  );
}
