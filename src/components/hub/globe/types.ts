import type { GlobePoint } from "@/lib/hub/geo";

/** Serializable collaboration data handed from the server to the globe and its panel. */
export interface ConnectionView extends GlobePoint {
  countryName: string;
  dateLabel: string | null;
  summary: string | null;
  topics: string | null;
  outcomes: string | null;
  screenshots: { url: string; alt: string }[];
  href: string;
}

export interface GlobeLabels {
  reset: string; hint: string; close: string; noWebgl: string; empty: string; loading: string;
  origin: string; originNote: string; teams: string; open: string; ftcNumber: string; date: string;
  topics: string; outcomes: string; screenshots: string; countryLevel: string;
}
