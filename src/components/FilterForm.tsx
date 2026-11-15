import { METAL_LEVELS, PLAN_TYPES, type PlanFilters } from "@/lib/filters";
import type { Insurer } from "@/lib/types";
import styles from "./FilterForm.module.css";

interface Props {
  zip: string;
  radius: number;
  filters: PlanFilters;
  insurers: Insurer[];
}

/** Plain GET form, so filtering works without JavaScript. */
export function FilterForm({ zip, radius, filters, insurers }: Props) {
  return (
    <form action="/results" method="get" className={styles.form} aria-label="Filter and sort plans">
      <input type="hidden" name="zip" value={zip} />
      <input type="hidden" name="radius" value={radius} />

      <div className={styles.field}>
        <label htmlFor="filter-type">Plan type</label>
        <select id="filter-type" name="type" defaultValue={filters.planType ?? ""}>
          <option value="">All types</option>
          {PLAN_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="filter-metal">Metal level</label>
        <select id="filter-metal" name="metal" defaultValue={filters.metalLevel ?? ""}>
          <option value="">All levels</option>
          {METAL_LEVELS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="filter-insurer">Insurer</label>
        <select id="filter-insurer" name="insurer" defaultValue={filters.insurerId ?? ""}>
          <option value="">All insurers</option>
          {insurers.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="filter-sort">Sort by</label>
        <select id="filter-sort" name="sort" defaultValue={filters.sort}>
          <option value="score">Network score</option>
          <option value="name">Plan name</option>
        </select>
      </div>

      <button type="submit" className={styles.button}>
        Apply
      </button>
    </form>
  );
}
