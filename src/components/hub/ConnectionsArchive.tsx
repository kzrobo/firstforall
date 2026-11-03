"use client";
import Link from "next/link";
import { useMemo, useState } from "react";

export interface ArchiveItem {
  id: string; slug: string; teamName: string; title: string; teamNumber: number | null; logoUrl: string | null;
  countryCode: string | null; countryName: string | null; city: string | null; dateLabel: string | null; summary: string | null;
  featured: boolean; coverUrl: string | null;
}

/** Editorial archive under the globe: featured connections, then every team grouped by country with a filter. */
export function ConnectionsArchive({ items, t }: { items: ArchiveItem[]; t: { list: string; country: string; all: string; empty: string; featured: string; ftc: string; open: string } }) {
  const [country, setCountry] = useState("");
  const countries = useMemo(
    () => [...new Map(items.filter((i) => i.countryCode).map((i) => [i.countryCode!, i.countryName ?? i.countryCode!])).entries()].sort((a, b) => a[1].localeCompare(b[1])),
    [items],
  );
  const shown = items.filter((i) => !country || i.countryCode === country);
  const featured = items.filter((i) => i.featured).slice(0, 2);
  const groups = countries.filter(([c]) => !country || c === country).map(([c, name]) => ({ c, name, items: shown.filter((i) => i.countryCode === c) }));

  return (
    <section aria-labelledby="archive-title" className="mt-20 lg:mt-28">
      {featured.length > 0 && !country && (
        <div className="mb-16 grid gap-x-6 gap-y-10 lg:grid-cols-2">
          {featured.map((f) => (
            <Link key={f.id} href={`/mavericks/connects/${f.slug}`} className="group block border-t border-rule pt-5">
              <p className="t-index">{t.featured} · {[f.city, f.countryName].filter(Boolean).join(", ")}</p>
              {f.coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- storage-hosted collaboration image
                <img src={f.coverUrl} alt="" loading="lazy" className="mt-4 aspect-video w-full bg-soft object-cover" />
              )}
              <p className="font-display mt-4 text-[clamp(1.375rem,2.2vw,1.875rem)] font-normal tracking-[-0.03em] text-ink group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">{f.teamName}</p>
              {f.summary && <p className="mt-2 line-clamp-3 max-w-xl text-[15px] text-ink-muted">{f.summary}</p>}
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-4">
        <h2 id="archive-title" className="t-h2 text-ink">{t.list} <span className="t-num text-[0.6em] text-ink-faint">{items.length}</span></h2>
        {countries.length > 1 && (
          <label className="flex items-center gap-3 text-[14px] text-ink-muted">
            {t.country}
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="h-10 border-b border-line-strong bg-transparent pr-6 text-ink focus:border-ink focus:outline-none">
              <option value="">{t.all}</option>
              {countries.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
            </select>
          </label>
        )}
      </div>

      {items.length === 0 ? (
        <p className="pt-6 text-ink-muted">{t.empty}</p>
      ) : (
        groups.map((g) => (
          <div key={g.c} className="grid gap-x-6 border-b border-line py-6 lg:grid-cols-12">
            <h3 className="t-index pb-3 lg:col-span-3 lg:pb-0">{g.name}</h3>
            <ul className="lg:col-span-9">
              {g.items.map((i) => (
                <li key={i.id}>
                  <Link href={`/mavericks/connects/${i.slug}`} className="group flex items-center gap-4 py-2.5">
                    {i.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- team logo from storage
                      <img src={i.logoUrl} alt="" className="size-9 shrink-0 rounded-full bg-ink object-contain p-1" />
                    ) : (
                      <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-soft text-[11px] font-semibold text-ink">{i.teamName.split(/\s+/).slice(0, 2).map((w) => w[0]).join("")}</span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-[16px] font-medium text-ink group-hover:underline group-hover:underline-offset-4">{i.teamName}</span>
                      <span className="text-[13px] text-ink-faint">{[i.city, i.teamNumber ? `${t.ftc} #${i.teamNumber}` : null, i.dateLabel].filter(Boolean).join(" · ")}</span>
                    </span>
                    <span aria-hidden className="text-ink-faint transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}
