import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { StatusBadge } from "@/components/StatusBadge";
import { OUT_OF_NETWORK_NOTE } from "@/content/plan-type-notes";
import { repository } from "@/lib/data";
import { searchQuery } from "@/lib/filters";
import { formatDate, formatMiles } from "@/lib/format";
import { findNearbyHospitals, scorePlan, type HospitalStatus } from "@/lib/scoring";
import { readSearch, type SearchParams } from "@/lib/search";
import styles from "../../detail.module.css";

export const metadata: Metadata = { title: "Plan details | NetCheck" };

interface Props {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}

export default function PlanPage(props: Props) {
  return (
    <div className={`container ${styles.page}`}>
      <Suspense fallback={<p className={styles.loading}>Loading plan…</p>}>
        <PlanDetail {...props} />
      </Suspense>
    </div>
  );
}

async function PlanDetail({ params, searchParams }: Props) {
  const { id } = await params;
  const plan = await repository.getPlan(id);
  if (!plan) notFound();

  const [{ zip, radius }, hospitals, statusRecords, insurers, networks, sources] =
    await Promise.all([
      readSearch(searchParams),
      repository.listHospitals(),
      repository.listNetworkStatus(),
      repository.listInsurers(),
      repository.listNetworks(),
      repository.listSources(),
    ]);

  const insurer = insurers.find((i) => i.id === plan.insurerId);
  const network = networks.find((n) => n.id === plan.networkId);
  const sourceById = new Map(sources.map((s) => [s.id, s]));
  const planSource = sourceById.get(plan.sourceId);
  const query = searchQuery(zip?.zip, radius);

  // With a ZIP: every hospital within the distance. Without one: only the
  // hospitals that have been checked for this plan's network.
  let rows: (Omit<HospitalStatus, "distanceMiles"> & { distanceMiles?: number })[];
  if (zip) {
    rows = scorePlan(plan, findNearbyHospitals(zip, hospitals, radius), statusRecords).hospitals;
  } else {
    const byId = new Map(hospitals.map((h) => [h.id, h]));
    rows = statusRecords
      .filter((r) => r.networkId === plan.networkId && byId.has(r.hospitalId))
      .map((record) => ({ hospital: byId.get(record.hospitalId)!, status: record.status, record }))
      .sort((a, b) => a.hospital.name.localeCompare(b.hospital.name));
  }
  const count = (status: string) => rows.filter((r) => r.status === status).length;

  return (
    <>
      <p className={styles.back}>
        <Link href={zip ? `/results${query}` : "/"}>
          {zip ? `← Back to plans near ${zip.zip}` : "← Search by ZIP code"}
        </Link>
      </p>

      <header className={styles.section}>
        <h1>{plan.marketingName}</h1>
        <p className={styles.sub}>
          {insurer?.name ?? "Insurer not listed"}
          {network ? ` · ${network.name} network` : ""} · {plan.planYear} plan year
        </p>
        <ul className={styles.tags} aria-label="Plan features">
          <li>{plan.planType}</li>
          <li>{plan.metalLevel}</li>
          <li>{plan.hsaEligible ? "HSA-eligible" : "Not HSA-eligible"}</li>
          <li>Sold in {plan.countiesOffered.join(" and ")} counties</li>
        </ul>
        <p>{OUT_OF_NETWORK_NOTE[plan.planType]}</p>
        <p className={styles.small}>
          Plan details from{" "}
          {planSource ? <a href={planSource.url}>{planSource.publisher}</a> : "a source not listed"},
          checked {formatDate(plan.lastChecked)}.
          {network?.tiered === true &&
            " This network sorts in-network hospitals into cost tiers. NetCheck has not recorded tiers yet."}
        </p>
      </header>

      <p className={styles.notice} role="note">
        <strong>
          Network data can change. Confirm with the plan and the hospital before enrolling.
        </strong>
      </p>

      <section className={styles.section} aria-labelledby="hospitals-heading">
        <h2 id="hospitals-heading">
          {zip ? `Hospitals within ${radius} miles of ${zip.zip}` : "Hospitals checked for this plan"}
        </h2>
        <p className={styles.summary}>
          {count("in-network")} in-network · {count("out-of-network")} not in-network
          {zip ? ` · ${count("unknown")} not yet verified` : ""}
        </p>
        {!zip && (
          <p className={styles.small}>
            Only hospitals that have been checked are listed. <Link href="/">Search by ZIP code</Link>{" "}
            to see every nearby hospital with distances.
          </p>
        )}
        {rows.length === 0 ? (
          <p className={styles.muted}>
            {zip
              ? "No hospitals in NetCheck's list are within this distance."
              : "No hospitals have been checked for this plan yet."}
          </p>
        ) : (
          <ul className={styles.rows}>
            {rows.map(({ hospital, status, record, distanceMiles }) => {
              const source = record ? sourceById.get(record.sourceId) : undefined;
              return (
                <li key={hospital.id}>
                  <div>
                    <Link href={`/hospitals/${hospital.id}${query}`} className={styles.rowTitle}>
                      {hospital.name}
                    </Link>
                    <div className={styles.small}>
                      {hospital.city}, {hospital.state}
                    </div>
                  </div>
                  <div className={styles.right}>
                    <StatusBadge status={status} tier={record?.tier} />
                    {distanceMiles !== undefined && (
                      <span className={styles.distance}>{formatMiles(distanceMiles)}</span>
                    )}
                  </div>
                  <p className={styles.rowMeta}>
                    {record ? (
                      <>
                        Source:{" "}
                        {source ? <a href={source.url}>{source.publisher}, {source.title}</a> : "not listed"}
                        . Last checked {formatDate(record.lastChecked)}.
                      </>
                    ) : (
                      "Nobody has checked this hospital for this plan yet. It may or may not be in the network."
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
