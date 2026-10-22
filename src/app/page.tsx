import Image from "next/image";
import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { Rings } from "@/components/home/Rings";
import { DocumentThumb } from "@/components/manuals/DocumentThumb";
import { readerHref } from "@/components/manuals/format";
import { UI_LOCALES } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { languageName, nativeLanguageName } from "@/lib/languages";
import { listPublishedManuals } from "@/lib/manuals/repository";
import { getSiteMedia, listSponsors } from "@/lib/site/repository";

export default async function HomePage() {
  const { t, locale } = await getI18n();
  const [result, media, sponsors] = await Promise.all([listPublishedManuals(), getSiteMedia(), listSponsors()]);
  const manuals = result.ok ? result.data : [];
  const shelf = [...manuals].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured)).slice(0, 3);
  const countFor = (lang: string) => manuals.filter((m) => m.translations.some((tr) => tr.language === lang)).length;
  const L = t.landing;

  return (
    <>
      <Hero t={t} media={media} />

      {/* 1 — The library: the main purpose of the site, directly under the hero */}
      <section aria-labelledby="library-title" className="mx-auto grid max-w-content gap-x-16 gap-y-12 px-5 py-20 lg:grid-cols-12 lg:px-10 lg:py-28">
        <div className="lg:col-span-4">
          <p className="t-label text-ink-muted">{L.libraryLabel}</p>
          <h2 id="library-title" className="t-h2 mt-4 text-navy">{L.libraryTitle}</h2>
          <p className="mt-5 text-ink-muted">{L.libraryBody}</p>
          <form action="/manuals" role="search" className="mt-8 flex border-b-2 border-navy">
            <label className="flex-1">
              <span className="sr-only">{L.searchLabel}</span>
              <input name="q" type="search" placeholder={L.searchPlaceholder} className="h-12 w-full bg-transparent text-[16px] placeholder:text-ink-faint focus:outline-none" />
            </label>
            <button className="px-1 text-navy" aria-label={t.nav.search}>
              <svg aria-hidden className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
            </button>
          </form>
          <Link href="/manuals" className="link-arrow mt-8 text-tech hover:text-navy">{L.browseAll}</Link>
        </div>

        <div className="lg:col-span-8">
          {shelf.length === 0 ? (
            <p className="border-t border-line pt-6 text-ink-muted">{result.ok ? L.libraryEmpty : t.manuals.notConfigured}</p>
          ) : (
            <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:gap-x-8">
              {shelf.map((m) => (
                <li key={m.id} className="group">
                  <Link href={`/manuals/${m.slug}`} className="block transition-transform duration-200 group-hover:-translate-y-1">
                    <DocumentThumb manual={m} />
                  </Link>
                  <p className="mt-5 text-[13px] font-medium text-tech t-num">{m.season}{m.seasonName ? ` · ${m.seasonName}` : ""}</p>
                  <h3 className="mt-1 text-[17px] font-semibold leading-snug text-navy">
                    <Link href={`/manuals/${m.slug}`} className="hover:underline">{m.title}</Link>
                  </h3>
                  <p className="mt-2 text-[13px] uppercase tracking-[0.06em] text-ink-muted">
                    {m.translations.map((tr) => tr.language).join(" · ")}
                  </p>
                  {m.translations[0] && (
                    <Link href={readerHref(m.slug, m.translations[0].language)} className="link-arrow mt-3 text-[14px] text-tech">{t.manuals.read}</Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* 2 — Languages: a ruled index, real counts only */}
      <section aria-labelledby="languages-title" className="border-y border-line bg-paper">
        <div className="mx-auto max-w-content px-5 lg:px-10">
          <h2 id="languages-title" className="t-label pt-10 text-ink-muted">{L.languagesLabel}</h2>
          <ul className="grid grid-cols-2 lg:grid-cols-4">
            {UI_LOCALES.map((l, i) => {
              const n = countFor(l);
              return (
                <li key={l} className={`py-8 pr-6 lg:py-12 ${i % 2 ? "border-l border-line pl-6" : ""} lg:border-l lg:pl-8 lg:first:border-l-0 lg:first:pl-0 ${i > 1 ? "border-t border-line lg:border-t-0" : ""}`}>
                  <p lang={l} className="text-[26px] font-semibold tracking-[-0.02em] text-navy lg:text-[30px]">{nativeLanguageName(l)}</p>
                  <p className="text-[14px] text-ink-muted">{nativeLanguageName(l) !== languageName(l, locale) ? languageName(l, locale) : "\u00a0"}</p>
                  <dl className="mt-6 space-y-1.5 text-[14px]">
                    <div className="flex items-center gap-2"><span aria-hidden className="size-1.5 rounded-full bg-moss" /><dd>{L.interfaceReady}</dd></div>
                    <div className="flex items-center gap-2">
                      <span aria-hidden className={`size-1.5 rounded-full ${n ? "bg-honey" : "bg-line-strong"}`} />
                      <dd>{n ? <Link href={`/manuals?lang=${l}`} className="hover:underline"><span className="t-num font-semibold">{n}</span> {L.publishedManuals}</Link> : <span className="text-ink-muted">{t.manuals.unavailable}</span>}</dd>
                    </div>
                  </dl>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* 3 — Initiative + process: the single BioBuzz-coloured band */}
      <section id="initiative" aria-labelledby="process-title" className="relative isolate overflow-hidden bg-pollen">
        <Rings className="absolute -left-[22%] top-[38%] -z-10 h-[150%] text-honey-deep/20" count={6} />
        <div className="mx-auto grid max-w-content gap-x-16 gap-y-12 px-5 py-20 lg:grid-cols-12 lg:px-10 lg:py-28">
          <div className="lg:col-span-5">
            <p className="t-label text-honey-deep">{t.home.initiativeEyebrow}</p>
            <h2 id="process-title" className="t-h2 mt-4 text-navy">{t.home.initiativeTitle}</h2>
            <p className="mt-6 text-ink/80">{t.home.initiativeBody}</p>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <h3 className="t-label text-ink/60">{L.processLabel}</h3>
            <ol className="mt-5 border-t border-ink/15">
              {L.steps.map((s, i) => (
                <li key={s.title} className="grid grid-cols-[3rem_1fr] gap-x-4 border-b border-ink/15 py-6 sm:grid-cols-[3.5rem_9rem_1fr]">
                  <span className="t-num text-[14px] font-semibold text-honey-deep">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-[17px] font-semibold text-navy">{s.title}</span>
                  <span className="col-start-2 mt-1 text-[15px] text-ink/75 sm:col-start-3 sm:mt-0">{s.body}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* 4 — Mavericks AI: principles, not a fake demo */}
      <section aria-labelledby="ai-title" className="mx-auto grid max-w-content gap-x-16 gap-y-10 px-5 py-20 lg:grid-cols-12 lg:px-10 lg:py-28">
        <div className="lg:col-span-5">
          <p className="t-label text-ink-muted">{L.aiLabel}</p>
          <h2 id="ai-title" className="t-h2 mt-4 text-navy">{L.aiTitle}</h2>
          <p className="mt-6 flex items-start gap-2.5 text-[14px] text-ink-muted">
            <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-honey" />{L.aiStatus}
          </p>
        </div>
        <ul className="lg:col-span-6 lg:col-start-7">
          {L.aiPrinciples.map((p) => (
            <li key={p} className="border-t border-line py-6 text-[19px] leading-snug tracking-[-0.01em] text-ink last:border-b">{p}</li>
          ))}
        </ul>
      </section>

      {/* 5 — The team: the one dark editorial band */}
      <section aria-labelledby="team-title" className="on-dark bg-night text-white">
        <div className="mx-auto grid max-w-content items-center gap-x-16 gap-y-12 px-5 py-20 lg:grid-cols-12 lg:px-10 lg:py-28">
          <div className="lg:col-span-5">
            <p className="t-label text-white/50">{L.teamLabel}</p>
            <h2 id="team-title" className="t-h2 mt-4">{L.teamTitle}</h2>
            <p className="mt-6 text-white/75">{L.teamBody}</p>
            <Link href="/about" className="link-arrow mt-8 text-honey">{L.teamLink}</Link>
          </div>
          <div className="lg:col-span-7">
            {media.filmVideo ? (
              <figure>
                <video controls preload="metadata" poster={media.filmPoster ?? undefined} src={media.filmVideo} className="aspect-video w-full bg-black" />
                <figcaption className="mt-3 text-[13px] text-white/55">{t.home.filmEyebrow}</figcaption>
              </figure>
            ) : (
              <Image src="/brand/mavericks-wordmark.jpg" alt="MAVERICKS #24034" width={1600} height={638} className="w-full mix-blend-screen [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]" />
            )}
          </div>
        </div>
      </section>

      {/* 6 — Partners: shown only when confirmed partners exist */}
      {sponsors.length > 0 && (
        <section aria-labelledby="partners-title" className="mx-auto max-w-content px-5 py-16 lg:px-10">
          <h2 id="partners-title" className="t-label text-ink-muted">{L.partnersLabel}</h2>
          <ul className="mt-8 flex flex-wrap items-center gap-x-14 gap-y-8">
            {sponsors.map((s) => (
              <li key={s.id}>
                <a href={s.url ?? undefined} rel="noopener noreferrer" target="_blank" className="block opacity-80 hover:opacity-100">
                  {/* eslint-disable-next-line @next/next/no-img-element -- storage-hosted logo */}
                  {s.logoUrl ? <img src={s.logoUrl} alt={s.name} className="h-10 w-auto object-contain" /> : <span className="text-lg font-semibold">{s.name}</span>}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
