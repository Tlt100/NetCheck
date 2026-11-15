import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { StatusBadge } from "@/components/StatusBadge";
import { repository } from "@/lib/data";
import { searchQuery } from "@/lib/filters";
import { formatDate, formatMiles } from "@/lib/format";
import { haversineMiles } from "@/lib/geo";
import { readSearch, type SearchParams } from "@/lib/search";
import type { DisplayStatus } from "@/lib/types";
import styles from "../../detail.module.css";

export const metadata: Metadata = { title: "Hospital details | NetCheck" };

interface Props {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}

export default function HospitalPage(props: Props) {
  return (
    <div className={`container ${styles.page}`}>
      <Suspense fallback={<p className={styles.loading}>Loading hospital…</p>}>
        <HospitalDetail {...props} />
      </Suspense>
    </div>
  );
}

const ORDER: Record<DisplayStatus, number> = { "in-network": 0, "out-of-network": 1, unknown: 2 };

async function HospitalDetail({ params, searchParams }: Props) {
  const { id } = await params;
  const hospital = await repository.getHospital(id);
  if (!hospital) notFound();

  const [{ zip, radius }, plans, statusRecords, insurers, sources] = await Promise.all([
    readSearch(searchParams),
    repository.listPlans(),
    repository.listNetworkStatus(),
    repository.listInsurers(),
    repository.listSources(),
  ]);

  const insurerById = new Map(insurers.map((i) => [i.id, i]));
  const sourceById = new Map(sources.map((s) => [s.id, s]));
  const hospitalSource = sourceById.get(hospital.sourceId);
  const query = searchQuery(zip?.zip, radius);
  const distance = zip ? haversineMiles(zip.lat, zip.lon, hospital.lat, hospital.lon) : undefined;

  const rows = plans
    .map((plan) => {
      const record = statusRecords.find(
        (r) => r.networkId === plan.networkId && r.hospitalId === hospital.id,
      );
      const status: DisplayStatus = record ? record.status : "unknown";
      return { plan, record, status };
    })
    .sort(
      (a, b) =>
        ORDER[a.status] - ORDER[b.status] ||
        a.plan.marketingName.localeCompare(b.plan.marketingName),
    );
  const accepted = rows.filter((r) => r.status === "in-network").length;

  return (
    <>
      <p className={styles.back}>
        <Link href={zip ? `/results${query}` : "/"}>
          {zip ? `← Back to plans near ${zip.zip}` : "← Search by ZIP code"}
        </Link>
      </p>

      <header className={styles.section}>
        <h1>{hospital.name}</h1>
        <address className={styles.address}>
          {hospital.street}
          <br />
          {hospital.city}, {hospital.state} {hospital.zip}
        </address>
        <p className={styles.sub}>
          {hospital.county} County
          {distance !== undefined && zip
            ? ` · ${formatMiles(distance)} from ZIP code ${zip.zip} (straight line)`
            : ""}
        </p>
        <p className={styles.small}>
          Name and address from{" "}
          {hospitalSource ? (
            <a href={hospitalSource.url}>
              {hospitalSource.publisher}, {hospitalSource.title}
            </a>
          ) : (
            "a source not listed"
          )}
          , checked {formatDate(hospital.lastChecked)}. CMS Certification Number {hospital.id}. The
          hospital may now use a different name.
        </p>
      </header>

      <p className={styles.notice} role="note">
        <strong>
          Network data can change. Confirm with the plan and the hospital before enrolling.
        </strong>
      </p>

      <section className={styles.section} aria-labelledby="plans-heading">
        <h2 id="plans-heading">Plans in NetCheck&rsquo;s list</h2>
        <p className={styles.summary}>
          In-network for {accepted} of {rows.length} plans listed ·{" "}
          {rows.filter((r) => r.status === "unknown").length} not yet verified
        </p>
        <p className={styles.small}>
          NetCheck does not list every plan sold in New Jersey, so this hospital may accept plans
          that are not shown here.
        </p>
        <ul className={styles.rows}>
          {rows.map(({ plan, record, status }) => {
            const source = record ? sourceById.get(record.sourceId) : undefined;
            return (
              <li key={plan.id}>
                <div>
                  <Link href={`/plans/${plan.id}${query}`} className={styles.rowTitle}>
                    {plan.marketingName}
                  </Link>
                  <div className={styles.small}>
                    {insurerById.get(plan.insurerId)?.name ?? "Insurer not listed"} · {plan.planType}{" "}
                    · {plan.metalLevel}
                  </div>
                </div>
                <div className={styles.right}>
                  <StatusBadge status={status} tier={record?.tier} />
                </div>
                <p className={styles.rowMeta}>
                  {record ? (
                    <>
                      Source:{" "}
                      {source ? <a href={source.url}>{source.publisher}, {source.title}</a> : "not listed"}
                      . Last checked {formatDate(record.lastChecked)}.
                    </>
                  ) : (
                    "Nobody has checked this plan at this hospital yet. It may or may not be in the network."
                  )}
                </p>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
