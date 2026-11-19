"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect, useRef } from "react";

import styles from "./AreaMap.module.css";

export interface AreaMapPoint {
  id: string;
  lat: number;
  lon: number;
  label: string;
  /** Second line in the pop-up, e.g. "3 pediatricians · 2.4 mi". */
  detail?: string;
  href: string;
}

export interface AreaMapProps {
  center: { lat: number; lon: number; label: string };
  radiusMiles: number;
  points: AreaMapPoint[];
  /** What the pins are, for the screen-reader label: "hospitals". */
  pointsLabel: string;
}

const METERS_PER_MILE = 1609.344;

/** Builds pop-up content with DOM nodes so place names are never parsed as HTML. */
function popupFor(point: AreaMapPoint): HTMLElement {
  const box = document.createElement("div");
  const link = document.createElement("a");
  link.href = point.href;
  link.textContent = point.label;
  link.style.fontWeight = "600";
  box.appendChild(link);
  if (point.detail) {
    const detail = document.createElement("div");
    detail.textContent = point.detail;
    box.appendChild(detail);
  }
  return box;
}

export default function AreaMapInner({ center, radiusMiles, points, pointsLabel }: AreaMapProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    const map = L.map(container.current, { scrollWheelZoom: false });

    // OpenStreetMap's public tiles: free for light use, attribution required.
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.circle([center.lat, center.lon], {
      radius: radiusMiles * METERS_PER_MILE,
      color: "#0f5e6b",
      weight: 1,
      fillOpacity: 0.04,
    }).addTo(map);

    L.circleMarker([center.lat, center.lon], {
      radius: 6,
      color: "#1b2a33",
      weight: 2,
      fillColor: "#ffffff",
      fillOpacity: 1,
    })
      .bindTooltip(center.label)
      .addTo(map);

    for (const point of points) {
      L.circleMarker([point.lat, point.lon], {
        radius: 7,
        color: "#ffffff",
        weight: 2,
        fillColor: "#0f5e6b",
        fillOpacity: 0.95,
      })
        .bindPopup(() => popupFor(point))
        .bindTooltip(point.label)
        .addTo(map);
    }

    // Frame the search radius. Computed from the center because a circle's
    // own bounds are only available once the map has a view.
    const area = L.latLng(center.lat, center.lon).toBounds(radiusMiles * 2 * METERS_PER_MILE);
    map.fitBounds(area, { padding: [12, 12] });
    return () => {
      map.remove();
    };
  }, [center.lat, center.lon, center.label, radiusMiles, points]);

  return (
    <div
      ref={container}
      className={styles.map}
      role="region"
      aria-label={`Map of ${points.length} ${pointsLabel} near ${center.label}. The same places are listed below the map.`}
    />
  );
}
