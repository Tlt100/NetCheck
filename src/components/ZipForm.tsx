import { DEFAULT_RADIUS, RADIUS_OPTIONS } from "@/lib/geo";
import styles from "./ZipForm.module.css";

interface Props {
  zip?: string;
  radius?: number;
  /** Error text for the ZIP field, shown and announced to screen readers. */
  error?: string;
  compact?: boolean;
}

/**
 * A plain GET form: it works without JavaScript and keeps the ZIP in the
 * page address only. Nothing is saved.
 */
export function ZipForm({ zip = "", radius = DEFAULT_RADIUS, error, compact }: Props) {
  return (
    <form
      action="/results"
      method="get"
      className={compact ? `${styles.form} ${styles.compact}` : styles.form}
    >
      <div className={styles.field}>
        <label htmlFor="zip">ZIP code</label>
        <input
          id="zip"
          name="zip"
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          pattern="[0-9]{5}"
          maxLength={5}
          required
          defaultValue={zip}
          placeholder="08901"
          aria-describedby={error ? "zip-error" : "zip-hint"}
          aria-invalid={error ? true : undefined}
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="radius">Hospitals within</label>
        <select id="radius" name="radius" defaultValue={String(radius)}>
          {RADIUS_OPTIONS.map((miles) => (
            <option key={miles} value={miles}>
              {miles} miles
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className={styles.button}>
        {compact ? "Update" : "Check plans"}
      </button>
      {error ? (
        <p id="zip-error" role="alert" className={styles.error}>
          {error}
        </p>
      ) : (
        !compact && (
          <p id="zip-hint" className={styles.hint}>
            Middlesex and Mercer counties, New Jersey. Your ZIP code is not
            saved.
          </p>
        )
      )}
    </form>
  );
}
