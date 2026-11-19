import styles from "./MedicareStars.module.css";

/** Medicare's 1-to-5 overall hospital star rating, written out in words too. */
export function MedicareStars({ rating, compact }: { rating: number | null; compact?: boolean }) {
  if (rating === null) {
    return <span className={styles.none}>No Medicare star rating published</span>;
  }
  return (
    <span className={styles.stars}>
      <span aria-hidden="true" className={styles.glyphs}>
        {"★".repeat(rating)}
        <span className={styles.empty}>{"★".repeat(5 - rating)}</span>
      </span>{" "}
      {rating} of 5{compact ? "" : " stars"}
      {compact ? "" : <span className={styles.label}> · Medicare rating</span>}
    </span>
  );
}
