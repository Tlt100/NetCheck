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
        </ul>
      </section>
    </div>
  );
}
