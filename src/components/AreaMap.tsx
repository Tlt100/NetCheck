"use client";

import dynamic from "next/dynamic";

import type { AreaMapProps } from "./AreaMapInner";
import styles from "./AreaMap.module.css";

// Leaflet needs the browser's window object, so the map is never
// prerendered on the server.
const AreaMapInner = dynamic(() => import("./AreaMapInner"), {
  ssr: false,
  loading: () => <div className={styles.placeholder}>Loading map…</div>,
});

export type { AreaMapPoint } from "./AreaMapInner";

export function AreaMap(props: AreaMapProps) {
  return <AreaMapInner {...props} />;
}
