/** Pure geography helpers for MAVERICKS Connects (unit-tested; no browser APIs). */

export const ORIGIN = { name: "Shymkent", countryCode: "KZ", lat: 42.3417, lng: 69.5901 } as const;

export interface GlobePoint {
  id: string;
  slug: string;
  teamName: string;
  teamNumber: number | null;
  countryCode: string;
  city: string | null;
  logoUrl: string | null;
  lat: number;
  lng: number;
  /** "city" = verified coordinates; "country" = placed at the country's centroid */
  precision: "city" | "country";
}

/**
 * Exact coordinates when the team supplied them, otherwise the country centroid.
 * Never invents a city. Returns null when the country is unknown.
 */
export function resolvePosition(
  e: { latitude: number | null; longitude: number | null; countryCode: string | null },
  centroids: Record<string, [number, number]>,
): { lat: number; lng: number; precision: "city" | "country" } | null {
  if (e.latitude != null && e.longitude != null) return { lat: e.latitude, lng: e.longitude, precision: "city" };
  const c = e.countryCode ? centroids[e.countryCode] : undefined;
  return c ? { lat: c[1], lng: c[0], precision: "country" } : null;
}

/** Great-circle distance in degrees between two points. */
export function angularDistance(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const r = Math.PI / 180;
  const cos = Math.sin(a.lat * r) * Math.sin(b.lat * r) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.cos((a.lng - b.lng) * r);
  return Math.acos(Math.min(1, Math.max(-1, cos))) / r;
}

export interface Cluster { id: string; lat: number; lng: number; points: GlobePoint[] }

/**
 * Groups markers closer than `radiusDeg` so logos never stack on top of each other.
 * Deterministic: input order decides the cluster anchor.
 */
export function clusterPoints(points: GlobePoint[], radiusDeg = 2.5): Cluster[] {
  const clusters: Cluster[] = [];
  for (const p of points) {
    const hit = clusters.find((c) => angularDistance(c, p) <= radiusDeg);
    if (hit) {
      hit.points.push(p);
      hit.lat = hit.points.reduce((s, x) => s + x.lat, 0) / hit.points.length;
      hit.lng = hit.points.reduce((s, x) => s + x.lng, 0) / hit.points.length;
    } else {
      clusters.push({ id: `c-${p.id}`, lat: p.lat, lng: p.lng, points: [p] });
    }
  }
  return clusters;
}
