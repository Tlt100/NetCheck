import { OUT_OF_NETWORK_NOTE } from "@/content/plan-type-notes";
import { formatDate, formatMiles } from "@/lib/format";
import type { HospitalStatus, PlanScore } from "@/lib/scoring";
import type { Insurer, Network, Source } from "@/lib/types";
import styles from "./PlanCard.module.css";

interface Props {
  score: PlanScore;
  insurer?: Insurer;
  network?: Network;
  planSource?: Source;
  radius: number;
}

function HospitalList({ items }: { items: HospitalStatus[] }) {
  return (
    <ul className={styles.hospitals}>
      {items.map(({ hospital, distanceMiles }) => (
        <li key={hospital.id}>
          <span>
            {hospital.name}
            <span className={styles.city}>, {hospital.city}</span>
          </span>
          <span className={styles.distance}>{formatMiles(distanceMiles)}</span>
        </li>
      ))}
    </ul>
  );
}

export function PlanCard({ score, insurer, network, planSource, radius }: Props) {
  const { plan, hospitals, inNetwork, outOfNetwork, unknown, total } = score;
  const inList = hospitals.filter((h) => h.status === "in-network");
  const outList = hospitals.filter((h) => h.status === "out-of-network");
  const unknownList = hospitals.filter((h) => h.status === "unknown");
  const lastStatusCheck = inList
    .concat(outList)
    .map((h) => h.record?.lastChecked ?? "")
    .sort()
    .at(-1);

  return (
    <article className={styles.card} aria-labelledby={`plan-${plan.id}`}>
      <header className={styles.header}>
        <h3 id={`plan-${plan.id}`}>{plan.marketingName}</h3>
        <p className={styles.insurer}>
          {insurer?.name ?? "Insurer not listed"}
          {network ? ` · ${network.name} network` : ""}
        </p>
        <ul className={styles.tags} aria-label="Plan features">
          <li>{plan.planType}</li>
          <li>{plan.metalLevel}</li>
          <li>{plan.hsaEligible ? "HSA-eligible" : "Not HSA-eligible"}</li>
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
          <HospitalList items={outList} />
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
          <HospitalList items={inList} />
        </details>
      )}
      {unknownList.length > 0 && (
        <details className={styles.details}>
          <summary>Hospitals not yet verified ({unknownList.length})</summary>
          <p className={styles.none}>
            Nobody has checked these for this plan yet. They may or may not be
            in the network.
          </p>
          <HospitalList items={unknownList} />
        </details>
      )}

      <p className={styles.note}>{OUT_OF_NETWORK_NOTE[plan.planType]}</p>

      <p className={styles.source}>
        Plan details: {planSource?.publisher ?? "source not listed"}, checked{" "}
        {formatDate(plan.lastChecked)}.
        {lastStatusCheck
          ? ` Hospital status last checked ${formatDate(lastStatusCheck)}.`
          : ""}
      </p>
    </article>
  );
}
