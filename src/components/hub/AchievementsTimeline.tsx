import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionary";
import type { HubEntry } from "@/lib/hub/types";
import { formatEventDate } from "./parts";

/** Competitions and milestones as a ruled timeline, grouped by season (or year). */
export function AchievementsTimeline({ entries, t, locale, names }: { entries: HubEntry[]; t: Dictionary; locale: string; names: Record<string, string | null> }) {
  const key = (e: HubEntry) => e.season ?? e.eventDate?.slice(0, 4) ?? "—";
  const groups = [...new Map(
    [...entries].sort((a, b) => (b.eventDate ?? "").localeCompare(a.eventDate ?? "")).map((e) => [key(e), [] as HubEntry[]]),
  ).keys()].map((k) => ({ k, items: entries.filter((e) => key(e) === k) }));
  return (
    <div className="space-y-16">
      {groups.map(({ k, items }) => (
        <section key={k} aria-label={k} className="grid gap-x-6 gap-y-4 lg:grid-cols-12">
          <h2 className="font-display text-[clamp(1.5rem,2.6vw,2.25rem)] font-normal tracking-[-0.035em] text-ink lg:col-span-3">{k}</h2>
          <ol className="border-t border-rule lg:col-span-9">
            {items.map((e) => (
              <li key={e.id} className="border-b border-line">
                <Link href={`/mavericks/achieves/${e.slug}`} className="group grid gap-x-6 gap-y-1 py-5 sm:grid-cols-[10rem_1fr]">
                  <span className="text-[13px] text-ink-faint">{formatEventDate(e.eventDate, locale)}{names[e.id] ? <><br />{[e.city, names[e.id]].filter(Boolean).join(", ")}</> : null}</span>
                  <span>
                    <span className="font-display block text-[18px] font-medium tracking-[-0.02em] text-ink group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">{e.title}</span>
                    {e.sections.result && <span className="mt-1 block text-[15px] text-accent">{e.sections.result}</span>}
                    {e.subtitle && <span className="mt-1 block text-[14px] text-ink-muted">{e.subtitle}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}
      <p className="sr-only">{t.hub.notAwards}</p>
    </div>
  );
}
