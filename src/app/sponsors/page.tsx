import { getI18n } from "@/i18n/server";
import { listSponsors } from "@/lib/site/repository";

export const metadata = { title: "Partners" };

export default async function SponsorsPage() {
  const [{ t }, sponsors] = await Promise.all([getI18n(), listSponsors()]);
  return (
    <div className="mx-auto max-w-content px-5 py-20 lg:px-10">
      
      <h1 className="mt-4 text-4xl font-semibold tracking-[-0.025em] text-ink">{t.sponsors.title}</h1>
      <p className="mt-5 text-lg text-ink-muted">{t.sponsors.intro}</p>
      {sponsors.length === 0 ? <p className="mt-12 text-ink-muted">{t.sponsors.empty}</p> : (
        <ul className="mt-12 divide-y divide-line border-y border-line">
          {sponsors.map((s) => (
            <li key={s.id} className="grid gap-6 py-8 md:grid-cols-[12rem_1fr]">
              {/* eslint-disable-next-line @next/next/no-img-element -- storage-hosted logo */}
              {s.logoUrl ? <img src={s.logoUrl} alt={s.name} className="h-14 w-auto object-contain" /> : <span />}
              <div>
                <p className="text-xs uppercase tracking-wider text-ink-muted">{s.category}</p>
                <h2 className="mt-1 text-xl font-semibold text-ink">{s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{s.name}</a> : s.name}</h2>
                {s.description && <p className="mt-2 text-ink-muted">{s.description}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
