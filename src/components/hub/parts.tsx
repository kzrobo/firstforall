import Image from "next/image";
import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionary";
import type { HubEntry } from "@/lib/hub/types";

/** "March 2026" in the interface language; falls back to the raw value. Server-rendered only. */
export function formatEventDate(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(d);
}

export function StageTag({ stage, t }: { stage: HubEntry["stage"]; t: Dictionary }) {
  if (!stage) return null;
  const done = stage === "completed";
  return (
    <span className={`inline-flex items-center gap-2 text-[12px] font-medium ${done ? "text-ink" : "text-accent"}`}>
      <span aria-hidden className={`size-1.5 rounded-full ${done ? "bg-ink" : "bg-accent"}`} />
      {t.hub.stage[stage]}
    </span>
  );
}

/** One line of facts under a title: stage · date · place · team number. */
export function EntryMeta({ e, t, locale, countryName }: { e: HubEntry; t: Dictionary; locale: string; countryName: string | null }) {
  const bits = [formatEventDate(e.eventDate, locale), e.season, [e.city, countryName].filter(Boolean).join(", ") || null, e.teamNumber ? `FTC #${e.teamNumber}` : null].filter(Boolean);
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-faint">
      <StageTag stage={e.stage} t={t} />
      {bits.map((b, i) => <span key={i}>{b}</span>)}
    </p>
  );
}

/** Featured entry as a large editorial spread, the rest as image-led rows. Not a card grid. */
export function EntryList({ entries, t, locale, names }: { entries: HubEntry[]; t: Dictionary; locale: string; names: Record<string, string | null> }) {
  const [lead, ...rest] = entries;
  if (!lead) return null;
  const href = (e: HubEntry) => `/mavericks/${e.category}/${e.slug}`;
  return (
    <div>
      <article className="grid gap-x-6 gap-y-8 border-t border-rule pt-8 lg:grid-cols-12 lg:pt-10">
        <Link href={href(lead)} className="group block lg:col-span-7" tabIndex={-1} aria-hidden>
          <div className="img-zoom relative aspect-[3/2] overflow-hidden bg-soft">
            {lead.coverUrl ? <Image src={lead.coverUrl} alt="" fill sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" /> : <Placeholder title={lead.title} />}
          </div>
        </Link>
        <div className="lg:col-span-5">
          <EntryMeta e={lead} t={t} locale={locale} countryName={names[lead.id] ?? null} />
          <h2 className="t-h1 mt-3 text-ink"><Link href={href(lead)} className="hover:underline hover:decoration-1 hover:underline-offset-4">{lead.title}</Link></h2>
          {lead.subtitle && <p className="mt-3 text-[17px] text-ink-muted">{lead.subtitle}</p>}
          {lead.summary && <p className="mt-5 text-[15px] leading-relaxed text-ink-muted">{lead.summary}</p>}
          <Link href={href(lead)} className="link-arrow mt-6 text-[15px] text-ink">{t.hub.globe.open}</Link>
        </div>
      </article>
      {rest.length > 0 && (
        <ul className="mt-14 border-t border-line lg:mt-20">
          {rest.map((e) => (
            <li key={e.id} className="border-b border-line">
              <Link href={href(e)} className="group grid grid-cols-[96px_1fr] items-center gap-x-5 py-5 sm:grid-cols-[160px_1fr] lg:grid-cols-12 lg:gap-x-6">
                <div className="img-zoom relative aspect-[4/3] overflow-hidden bg-soft lg:col-span-2">
                  {e.coverUrl ? <Image src={e.coverUrl} alt="" fill sizes="160px" className="object-cover" /> : <Placeholder title={e.title} small />}
                </div>
                <div className="lg:col-span-6">
                  <h3 className="font-display text-[18px] font-medium tracking-[-0.02em] text-ink group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">{e.title}</h3>
                  {e.subtitle && <p className="mt-1 text-[14px] text-ink-muted">{e.subtitle}</p>}
                </div>
                <div className="col-start-2 mt-2 lg:col-span-4 lg:col-start-9 lg:mt-0 lg:justify-self-end">
                  <EntryMeta e={e} t={t} locale={locale} countryName={names[e.id] ?? null} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Typographic stand-in when an entry has no cover yet (never a fake photo). */
export function Placeholder({ title, small = false }: { title: string; small?: boolean }) {
  return (
    <div aria-hidden className={`absolute inset-0 flex items-end bg-paper ${small ? "p-2" : "p-6"}`}>
      <span className={`font-display font-medium leading-tight tracking-[-0.02em] text-ink-faint ${small ? "text-[10px]" : "text-[22px]"}`}>{title}</span>
    </div>
  );
}
