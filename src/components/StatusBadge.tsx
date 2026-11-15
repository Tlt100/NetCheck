import type { DisplayStatus } from "@/lib/types";
import styles from "./StatusBadge.module.css";

const LABEL: Record<DisplayStatus, string> = {
  "in-network": "In-network",
  "out-of-network": "Not in-network",
  unknown: "Not yet verified",
};

const CLASS: Record<DisplayStatus, string> = {
  "in-network": styles.in,
  "out-of-network": styles.out,
  unknown: styles.unknown,
};

/** Status is always written out in words; colour is only a second cue. */
export function StatusBadge({ status, tier }: { status: DisplayStatus; tier?: string }) {
  return (
    <span className={`${styles.badge} ${CLASS[status]}`}>
      {LABEL[status]}
      {tier ? ` · ${tier}` : ""}
    </span>
  );
}
