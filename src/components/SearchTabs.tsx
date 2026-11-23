import Link from "next/link";

import styles from "./SearchTabs.module.css";

export type SearchKind = "hospitals" | "pediatricians";

/** Switches between hospital and pediatrician results for the same ZIP. */
export function SearchTabs({ active, query }: { active: SearchKind; query: string }) {
  const tabs: { kind: SearchKind; label: string; href: string }[] = [
    { kind: "hospitals", label: "Hospitals", href: `/results${query}` },
    { kind: "pediatricians", label: "Pediatricians", href: `/pediatricians${query}` },
  ];
  return (
    <nav aria-label="What to search for" className={styles.tabs}>
      {tabs.map((tab) => (
        <Link
          key={tab.kind}
          href={tab.href}
          className={tab.kind === active ? `${styles.tab} ${styles.active}` : styles.tab}
          aria-current={tab.kind === active ? "page" : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
