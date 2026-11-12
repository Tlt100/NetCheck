import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <p className={styles.badge}>In development</p>
      <h1 className={styles.title}>NetCheck</h1>
      <p className={styles.tagline}>
        See which plans your local hospitals actually take.
      </p>
      <p className={styles.body}>
        NetCheck will show which New Jersey marketplace health plans are
        in-network at hospitals near a ZIP code. It is being built for
        Middlesex and Mercer counties first.
      </p>
      <p className={styles.note}>
        No plan or hospital data is published here yet. NetCheck does not sell
        insurance, enroll anyone, or give advice.
      </p>
    </main>
  );
}
