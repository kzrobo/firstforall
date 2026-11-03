import "server-only";
import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import es from "i18n-iso-countries/langs/es.json";
import kk from "i18n-iso-countries/langs/kk.json";
import ru from "i18n-iso-countries/langs/ru.json";
import { geoCentroid } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import world from "world-atlas/countries-50m.json";

for (const l of [en, kk, ru, es]) countries.registerLocale(l);

export function countryName(code: string | null, locale: string): string | null {
  if (!code) return null;
  return countries.getName(code, locale) ?? countries.getName(code, "en") ?? code;
}

export function isCountryCode(code: string): boolean {
  return countries.isValid(code) && /^[A-Z]{2}$/.test(code);
}

/** All countries as [code, English name] for admin pickers. */
export function countryOptions(): [string, string][] {
  return Object.entries(countries.getNames("en", { select: "official" })).sort((a, b) => a[1].localeCompare(b[1]));
}

let centroidCache: Record<string, [number, number]> | null = null;

/** ISO alpha-2 → [lng, lat] centroid, from the 1:50m Natural Earth countries (covers small states). */
export function countryCentroids(): Record<string, [number, number]> {
  if (centroidCache) return centroidCache;
  const topo = world as unknown as Topology<{ countries: GeometryCollection }>;
  const fc = feature(topo, topo.objects.countries);
  const out: Record<string, [number, number]> = {};
  for (const f of fc.features) {
    const alpha2 = f.id ? countries.numericToAlpha2(String(f.id)) : undefined;
    if (alpha2) out[alpha2] = geoCentroid(f) as [number, number];
  }
  centroidCache = out;
  return out;
}
