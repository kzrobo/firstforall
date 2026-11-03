import type { Dictionary } from "@/i18n/dictionary";
import { countryName } from "@/lib/hub/countries";
import { toGlobePoints } from "@/lib/hub/repository";
import type { HubEntry } from "@/lib/hub/types";
import { ConnectionsArchive, type ArchiveItem } from "./ConnectionsArchive";
import { ConnectsGlobe } from "./globe/ConnectsGlobe";
import type { ConnectionView, GlobeLabels } from "./globe/types";
import { formatEventDate } from "./parts";

/** Globe + archive for MAVERICKS Connects. Everything on the globe is also in the archive list. */
export function ConnectionsSection({ entries, t, locale }: { entries: HubEntry[]; t: Dictionary; locale: string }) {
  const G = t.hub.globe;
  const byId = new Map(entries.map((e) => [e.id, e]));
  const views: ConnectionView[] = toGlobePoints(entries).map((p) => {
    const e = byId.get(p.id)!;
    return {
      ...p,
      countryName: countryName(p.countryCode, locale) ?? p.countryCode,
      dateLabel: formatEventDate(e.eventDate, locale),
      summary: e.summary ?? e.sections.overview ?? null,
      topics: e.sections.topics ?? null,
      outcomes: e.sections.outcomes ?? null,
      screenshots: e.media.filter((m) => m.kind === "screenshot").map((m) => ({ url: m.url, alt: m.alt })),
      href: `/mavericks/connects/${e.slug}`,
    };
  });
  const labels: GlobeLabels = {
    reset: G.reset, hint: G.hint, close: G.close, noWebgl: G.noWebgl, empty: G.empty, loading: G.loading,
    origin: G.origin, originNote: G.originNote, teams: G.teams, open: G.open, ftcNumber: t.hub.fields.ftcNumber,
    date: t.hub.fields.date, topics: t.hub.sections.topics, outcomes: t.hub.sections.outcomes, screenshots: t.hub.fields.screenshots,
    countryLevel: t.hub.fields.countryLevel,
  };
  const items: ArchiveItem[] = entries.map((e) => ({
    id: e.id, slug: e.slug, teamName: e.teamName ?? e.title, title: e.title, teamNumber: e.teamNumber, logoUrl: e.logoUrl,
    countryCode: e.countryCode, countryName: countryName(e.countryCode, locale), city: e.city, dateLabel: formatEventDate(e.eventDate, locale),
    summary: e.summary, featured: e.isFeatured, coverUrl: e.coverUrl ?? e.media.find((m) => m.kind === "screenshot")?.url ?? null,
  }));

  return (
    <>
      <p className="max-w-2xl text-[16px] leading-relaxed text-ink-muted">{G.lead}</p>
      <div className="relative -mx-5 mt-6 sm:mx-0">
        <ConnectsGlobe connections={views} labels={labels} />
      </div>
      <ConnectionsArchive items={items} t={{ list: G.list, country: G.country, all: G.all, empty: G.empty, featured: t.home.featured, ftc: t.hub.fields.ftcNumber, open: G.open }} />
    </>
  );
}
