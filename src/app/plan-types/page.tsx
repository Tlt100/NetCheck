import type { Metadata } from "next";
import Link from "next/link";

import { PLAN_TYPE_ENTRIES, PLAN_TYPE_SOURCES } from "@/content/plan-types";
import styles from "../info.module.css";

export const metadata: Metadata = {
  title: "Plan types explained | NetCheck",
  description: "What HMO, EPO, PPO, POS and HDHP/HSA mean, in plain language.",
};

export default function PlanTypesPage() {
  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.section}>
        <h1>Plan types explained</h1>
        <p className={styles.lead}>
          The plan type tells you how a plan&rsquo;s network works and what happens if you get care
          outside it.
        </p>
      </header>

      <nav aria-label="Plan types on this page">
        <ul className={styles.jump}>
          {PLAN_TYPE_ENTRIES.map((entry) => (
            <li key={entry.id}>
              <a href={`#${entry.id}`}>{entry.short}</a>
            </li>
          ))}
        </ul>
      </nav>

      <p className={styles.notice} role="note">
        These are general descriptions, not advice. Each plan&rsquo;s own documents set its rules.
        Check the plan&rsquo;s Summary of Benefits and Coverage before enrolling.
      </p>

      {PLAN_TYPE_ENTRIES.map((entry) => (
        <section key={entry.id} id={entry.id} className={styles.card} aria-labelledby={`${entry.id}-h`}>
          <h2 id={`${entry.id}-h`}>
            {entry.short} <span className={styles.full}>{entry.name}</span>
          </h2>
          <p>{entry.summary}</p>
          <ul className={styles.bullets}>
            {entry.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <p className={styles.callout}>
            <strong>Care outside the network:</strong> {entry.outOfNetwork}
          </p>
        </section>
      ))}

      <section className={styles.section} aria-labelledby="sources-h">
        <h2 id="sources-h">Sources</h2>
        <ul className={styles.bullets}>
          {PLAN_TYPE_SOURCES.map((source) => (
            <li key={source.url}>
              <a href={source.url}>{source.label}</a>
            </li>
          ))}
        </ul>
        <p className={styles.small}>
          See <Link href="/about-the-data">About the data</Link> for where plan and hospital
          information comes from.
        </p>
      </section>
    </div>
  );
}
