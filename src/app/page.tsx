import Link from "next/link";

import { PlanTypeLegend } from "@/components/PlanTypeLegend";
import { ZipForm } from "@/components/ZipForm";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={`container ${styles.page}`}>
      <h1 className={styles.title}>
        See which plans your local hospitals actually take.
      </h1>
      <p className={styles.lead}>
        Enter a New Jersey ZIP code. NetCheck lists the individual health
        plans sold in that area and shows which nearby hospitals are in each
        plan&rsquo;s network.
      </p>

      <ZipForm />

      <p className={styles.alt}>
        Looking for a children&rsquo;s doctor? <Link href="/pediatricians">Find pediatricians near you</Link>
      </p>

      <p className={styles.notice} role="note">
        Network data can change. Confirm with the plan and the hospital before enrolling. NetCheck
        gives information only and does not recommend a plan.
      </p>

      <PlanTypeLegend />

      <section className={styles.how} aria-labelledby="how-heading">
        <h2 id="how-heading">How to read the results</h2>
        <ul>
          <li>
            <strong>In-network</strong> means NetCheck checked the
            insurer&rsquo;s own directory and found the hospital listed for
            that plan&rsquo;s network.
          </li>
          <li>
            <strong>Not yet verified</strong> means nobody has checked. It
            does not mean the hospital is outside the network.
          </li>
          <li>
            Plans are listed for 2027. This is an early version: most
            hospitals have not been checked yet.
          </li>
          <li>
            New to insurance terms? See{" "}
            <Link href="/plan-types">plan types explained</Link>. To see where the information comes
            from, read <Link href="/about-the-data">about the data</Link>.
          </li>
        </ul>
      </section>
    </div>
  );
}
