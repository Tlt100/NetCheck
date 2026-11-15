import { formatDate } from "@/lib/format";
import type { Source } from "@/lib/types";

interface Props {
  /** What the source backs up, e.g. "Plan details". */
  label: string;
  source?: Source;
  /** ISO date the information was last checked. */
  checked?: string;
}

/** "Plan details: <source link>. Last checked Nov 12, 2026." */
export function SourceLabel({ label, source, checked }: Props) {
  return (
    <span>
      {label}:{" "}
      {source ? (
        <a href={source.url}>
          {source.publisher}, {source.title}
        </a>
      ) : (
        "source not listed"
      )}
      .{checked ? ` Last checked ${formatDate(checked)}.` : ""}
    </span>
  );
}
