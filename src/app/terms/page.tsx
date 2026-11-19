import type { Metadata } from "next";
import Link from "next/link";

import styles from "../info.module.css";

export const metadata: Metadata = {
  title: "Terms of use and privacy | NetCheck",
  description: "The terms for using NetCheck and how it handles information.",
};

export default function TermsPage() {
  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.section}>
        <h1>Terms of use and privacy</h1>
        <p className={styles.lead}>Plain terms for a free information tool.</p>
      </header>

      <section className={styles.section} aria-labelledby="use-h">
        <h2 id="use-h">Using NetCheck</h2>
        <ul className={styles.bullets}>
          <li>
            NetCheck gives information only. It does not sell insurance, enroll anyone, recommend a
            plan, or give legal, financial or medical advice.
          </li>
          <li>
            Network information can be wrong or out of date. Confirm with the plan and the provider
            before enrolling or getting care.
          </li>
          <li>
            NetCheck is an independent project and is not connected to Get Covered New Jersey, any
            insurer, hospital or doctor.
          </li>
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="google-h">
        <h2 id="google-h">Google Maps content</h2>
        <p>
          Office ratings come from Google Maps. By using NetCheck you also agree to the{" "}
          <a href="https://maps.google.com/help/terms_maps/">Google Maps/Google Earth Additional Terms of Service</a>,
          and Google&rsquo;s handling of that content is covered by the{" "}
          <a href="https://policies.google.com/privacy">Google Privacy Policy</a>. NetCheck does not
          store Google ratings; they are loaded fresh each time an office page is opened.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="privacy-h">
        <h2 id="privacy-h">Privacy</h2>
        <ul className={styles.bullets}>
          <li>NetCheck asks only for a ZIP code. There are no accounts.</li>
          <li>
            It does not ask for your name, age, income or health information, and it does not save the
            ZIP code. The ZIP code appears in the page address so results can be bookmarked, and the
            hosting provider&rsquo;s standard request logs may record that address.
          </li>
          <li>
            When you open an office page, NetCheck&rsquo;s server asks Google for that office&rsquo;s
            rating. Your ZIP code and browser are not sent to Google by NetCheck.
          </li>
          <li>
            Maps load their pictures straight from{" "}
            <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>&rsquo;s servers, so your
            browser contacts OpenStreetMap when a map is shown, under the{" "}
            <a href="https://osmfoundation.org/wiki/Privacy_Policy">OpenStreetMap Foundation privacy policy</a>.
          </li>
        </ul>
      </section>

      <p className={styles.small}>
        See <Link href="/about-the-data">About the data</Link> for every source NetCheck uses.
      </p>
    </div>
  );
}
