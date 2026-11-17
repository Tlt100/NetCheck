import type { Metadata } from "next";

import { repository } from "@/lib/data";
import { formatDate } from "@/lib/format";
import type { SourceType } from "@/lib/types";
import styles from "../info.module.css";

export const metadata: Metadata = {
  title: "About the data | NetCheck",
  description: "Where NetCheck's plan, hospital and network information comes from, and its limits.",
};

const TYPE_LABEL: Record<SourceType, string> = {
  "insurer-directory": "Insurer provider directory",
  "hospital-mrf": "Hospital price transparency file",
  "insurer-tic": "Insurer Transparency in Coverage file",
  marketplace: "State marketplace",
  regulator: "State regulator",
  "insurer-plan-document": "Insurer plan page",
  cms: "Federal hospital data",
  census: "Census Bureau",
  openstreetmap: "OpenStreetMap",
  nppes: "Federal NPI registry",
};

export default async function AboutTheDataPage() {
  const [sources, plans, hospitals, statusRecords] = await Promise.all([
    repository.listSources(),
    repository.listPlans(),
    repository.listHospitals(),
    repository.listNetworkStatus(),
  ]);
  const checkedHospitals = new Set(statusRecords.map((r) => r.hospitalId)).size;
  const lastChecked = statusRecords.map((r) => r.lastChecked).sort().at(-1);

  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.section}>
        <h1>About the data</h1>
        <p className={styles.lead}>
          Every plan, hospital and network status on NetCheck comes from a named public source and
          carries the date it was last checked.
        </p>
      </header>

      <p className={styles.notice} role="note">
        <strong>
          Network data can change. Confirm with the plan and the hospital before enrolling.
        </strong>
      </p>

      <section className={styles.section} aria-labelledby="status-h">
        <h2 id="status-h">What the three statuses mean</h2>
        <ul className={styles.bullets}>
          <li>
            <strong>In-network:</strong> the insurer&rsquo;s own directory listed the hospital for the
            plan&rsquo;s network on the date shown.
          </li>
          <li>
            <strong>Not in-network:</strong> the insurer&rsquo;s directory was checked and did not list
            the hospital for that network.
          </li>
          <li>
            <strong>Not yet verified:</strong> nobody has checked. It does not mean the hospital is
            outside the network. NetCheck never guesses a status.
          </li>
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="limits-h">
        <h2 id="limits-h">What NetCheck covers today</h2>
        <ul className={styles.bullets}>
          <li>
            {plans.length} individual plans for {plans[0]?.planYear}, sold in Middlesex and Mercer
            counties. This is not every plan sold there.
          </li>
          <li>
            {hospitals.length} New Jersey acute care hospitals. Pennsylvania hospitals, doctors and
            other facilities are not included.
          </li>
          <li>
            {statusRecords.length} verified statuses covering {checkedHospitals} hospitals
            {lastChecked ? `, most recently checked ${formatDate(lastChecked)}` : ""}. Every other
            plan and hospital pair shows as not yet verified.
          </li>
          <li>Cost tiers within a network (for example Tier 1 and Tier 2) are not recorded yet.</li>
          <li>
            Distances are straight-line, from the center of the ZIP code area to the hospital. Driving
            distance will be longer.
          </li>
          <li>
            The share of plan types shown for a county counts plans offered. It does not show how many
            people enrolled in each type.
          </li>
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="matching-h">
        <h2 id="matching-h">How plan names are matched</h2>
        <p>
          Insurers, hospitals and the state often use different names for the same plan. NetCheck
          links each name it finds in a source to one plan network, and records how sure the link is.
          Only exact matches and matches confirmed by a person can produce a status. A name that
          cannot be matched with confidence leaves the status as not yet verified.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="privacy-h">
        <h2 id="privacy-h">Privacy</h2>
        <p>
          NetCheck asks only for a ZIP code. It does not ask for your name, age, income or health
          information, has no accounts, and does not save the ZIP code. The ZIP code appears in the
          page address so results can be bookmarked.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="sources-h">
        <h2 id="sources-h">Sources</h2>
        <ul className={styles.sources}>
          {sources.map((source) => (
            <li key={source.id}>
              <a href={source.url} className={styles.sourceTitle}>
                {source.title}
              </a>
              <span className={styles.small}>
                {source.publisher} · {TYPE_LABEL[source.type]} · Read {formatDate(source.retrievedOn)}
              </span>
              {source.note && <span className={styles.small}>{source.note}</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="not-h">
        <h2 id="not-h">What NetCheck is not</h2>
        <p>
          NetCheck gives information only. It does not sell insurance, enroll anyone, recommend a
          plan, or give legal, financial or medical advice. It is an independent project and is not
          connected to Get Covered New Jersey, any insurer or any hospital.
        </p>
      </section>
    </div>
  );
}
