import Link from "next/link";

import { OUT_OF_NETWORK_NOTE } from "@/content/plan-type-notes";
import { SourceLabel } from "@/components/SourceLabel";
import { formatMiles } from "@/lib/format";
import type { HospitalStatus, PlanScore } from "@/lib/scoring";
import type { Insurer, Network, Source } from "@/lib/types";
import styles from "./PlanCard.module.css";

interface Props {
  score: PlanScore;
  insurer?: Insurer;
  network?: Network;
  planSource?: Source;
  /** All sources by ID, used to label where hospital statuses came from. */
  sources: Map<string, Source>;
  radius: number;
  /** Carries the ZIP and distance to detail pages, e.g. "?zip=08901&radius=15". */
  query: string;
}

function HospitalList({ items, query }: { items: HospitalStatus[]; query: string }) {
  return (
    <ul className={styles.hospitals}>
      {items.map(({ hospital, distanceMiles }) => (
        <li key={hospital.id}>
          <span>
            <Link href={`/hospitals/${hospital.id}${query}`}>{hospital.name}</Link>
            <span className={styles.city}>, {hospital.city}</span>
          </span>
          <span className={styles.distance}>{formatMiles(distanceMiles)}</span>
        </li>
      ))}
    </ul>
  );
}

export function PlanCard({ score, insurer, network, planSource, sources, radius, query }: Props) {
  const { plan, hospitals, inNetwork, outOfNetwork, unknown, total } = score;
  const inList = hospitals.filter((h) => h.status === "in-network");
  const outList = hospitals.filter((h) => h.status === "out-of-network");
  const unknownList = hospitals.filter((h) => h.status === "unknown");
  const statusSourceId = inList.concat(outList)[0]?.record?.sourceId;
  const lastStatusCheck = inList
    .concat(outList)
    .map((h) => h.record?.lastChecked ?? "")
    .sort()
    .at(-1);

  return (
    <article className={styles.card} aria-labelledby={`plan-${plan.id}`}>
      <header className={styles.header}>
        <h3 id={`plan-${plan.id}`}>
          <Link href={`/plans/${plan.id}${query}`}>{plan.marketingName}</Link>
        </h3>
        <p className={styles.insurer}>
          {insurer?.name ?? "Insurer not listed"}
          {network ? ` · ${network.name} network` : ""}
        </p>
        <ul className={styles.tags} aria-label="Plan features">
          <li>
            <Link href={`/plan-types#${plan.planType.toLowerCase()}`}>
              {plan.planType}
              <span className="visually-hidden"> plan type explained</span>
            </Link>
          </li>
          <li>{plan.metalLevel}</li>
          <li>
            {plan.hsaEligible ? (
              <Link href="/plan-types#hdhp-hsa">
                HSA-eligible<span className="visually-hidden"> explained</span>
              </Link>
            ) : (
              "Not HSA-eligible"
            )}
          </li>
        </ul>
      </header>

      <div className={styles.score}>
        <p className={styles.scoreLine}>
          In-network at <strong>{inNetwork}</strong> of {total}{" "}
          {total === 1 ? "hospital" : "hospitals"} within {radius} miles
        </p>
        <ul className={styles.counts}>
          <li className={styles.in}>{inNetwork} in-network</li>
          <li className={styles.out}>{outOfNetwork} not in-network</li>
          <li className={styles.unknown}>{unknown} not yet verified</li>
        </ul>
      </div>

      <section aria-label="Hospitals not in-network">
        <h4>Not in-network</h4>
        {outList.length > 0 ? (
          <HospitalList items={outList} query={query} />
        ) : (
          <p className={styles.none}>
            {inNetwork + outOfNetwork === 0
              ? "No hospitals have been checked for this plan yet."
              : `None found among the ${inNetwork + outOfNetwork} ${
                  inNetwork + outOfNetwork === 1 ? "hospital" : "hospitals"
                } checked so far.`}
          </p>
        )}
      </section>

      {inList.length > 0 && (
        <details className={styles.details}>
          <summary>In-network hospitals ({inList.length})</summary>
          <HospitalList items={inList} query={query} />
        </details>
      )}
      {unknownList.length > 0 && (
        <details className={styles.details}>
          <summary>Hospitals not yet verified ({unknownList.length})</summary>
          <p className={styles.none}>
            Nobody has checked these for this plan yet. They may or may not be
            in the network.
          </p>
          <HospitalList items={unknownList} query={query} />
        </details>
      )}

      <p className={styles.note}>
        {OUT_OF_NETWORK_NOTE[plan.planType]}{" "}
        <Link href={`/plan-types#${plan.planType.toLowerCase()}`}>
          What {plan.planType} means
        </Link>
      </p>

      <p className={styles.more}>
        <Link href={`/plans/${plan.id}${query}`}>
          See every nearby hospital for this plan
          <span className="visually-hidden">, {plan.marketingName}</span>
        </Link>
      </p>

      <p className={styles.source}>
        <SourceLabel label="Plan details" source={planSource} checked={plan.lastChecked} />
        {statusSourceId && (
          <>
            {" "}
            <SourceLabel
              label="Hospital status"
              source={sources.get(statusSourceId)}
              checked={lastStatusCheck}
            />
          </>
        )}
      </p>
    </article>
  );
}
