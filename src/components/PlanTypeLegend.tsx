import Link from "next/link";

import styles from "./PlanTypeLegend.module.css";

/** One line per plan type, in everyday words. The full page has more detail. */
const LEGEND = [
  {
    id: "hmo",
    short: "HMO",
    line: "You pick one main doctor and need their OK to see a specialist.",
    outside: "Not covered, except emergencies",
  },
  {
    id: "epo",
    short: "EPO",
    line: "You can see any doctor in the plan's network without a referral.",
    outside: "Not covered, except emergencies",
  },
  {
    id: "ppo",
    short: "PPO",
    line: "You can see any doctor without a referral, in or out of the network.",
    outside: "Covered, but you pay more",
  },
  {
    id: "pos",
    short: "POS",
    line: "You pick one main doctor and need their OK to see a specialist.",
    outside: "Covered, but you pay more",
  },
];

export function PlanTypeLegend() {
  return (
    <section className={styles.legend} aria-labelledby="legend-heading">
      <h2 id="legend-heading">What the plan types mean</h2>
      <p className={styles.intro}>
        A plan&rsquo;s <strong>network</strong> is the group of doctors and hospitals that have a
        contract with it. The plan type tells you what happens if you go outside that group.
      </p>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Type</th>
            <th scope="col">How it works</th>
            <th scope="col">Care outside the network</th>
          </tr>
        </thead>
        <tbody>
          {LEGEND.map((row) => (
            <tr key={row.id}>
              <th scope="row">
                <Link href={`/plan-types#${row.id}`}>{row.short}</Link>
              </th>
              <td data-label="How it works">{row.line}</td>
              <td data-label="Care outside the network">{row.outside}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.more}>
        These are general descriptions; each plan sets its own rules.{" "}
        <Link href="/plan-types">More about plan types and HSAs</Link>
      </p>
    </section>
  );
}
