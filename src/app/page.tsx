import Image from "next/image";
import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { LessonTeaser } from "@/components/learn/LessonTeaser";
import { DocumentThumb } from "@/components/manuals/DocumentThumb";
import { formatBytes, readerHref } from "@/components/manuals/format";
import { SectionHead } from "@/components/ui/SectionHead";
import { UI_LOCALES } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { languageName, nativeLanguageName } from "@/lib/languages";
import { listPublishedLessons } from "@/lib/learn/repository";
import { listPublishedManuals } from "@/lib/manuals/repository";
import { getSiteMedia } from "@/lib/site/repository";

export default async function HomePage() {
  const { t, locale } = await getI18n();
  const [manualsResult, learnResult, media] = await Promise.all([listPublishedManuals(), listPublishedLessons(locale), getSiteMedia()]);
  const H = t.home;

  const manuals = manualsResult.ok ? manualsResult.data : [];
  const featured = manuals.find((m) => m.isFeatured) ?? manuals[0] ?? null;
  const others = manuals.filter((m) => m.id !== featured?.id).slice(0, 4);
  const primary = featured ? (featured.translations.find((tr) => tr.isSource) ?? featured.translations[0]) : null;
  const missing = featured ? UI_LOCALES.filter((l) => !featured.translations.some((tr) => tr.language === l)) : [];

  const lessons = learnResult.ok ? learnResult.data.lessons : [];
  const categories = learnResult.ok ? learnResult.data.categories : [];
  const [lead, ...rest] = lessons;
  
  return (
    <>
      <Hero t={t} media={media} locale={locale} />

      {/* (01) Mission — statement and reading text, with the four languages as real entry points */}
      <section aria-labelledby="mission-title" className="mx-auto max-w-content px-5 pb-20 pt-16 lg:px-10 lg:pb-32 lg:pt-24">
        <p className="t-index"><span className="t-num">(01)</span> {H.missionIndex}</p>
        <div className="mt-8 grid gap-x-6 gap-y-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2 id="mission-title" className="t-statement max-w-[26ch] text-ink">{H.missionStatement}</h2>
            <div className="mt-10 grid gap-x-6 gap-y-6 text-[17px] leading-[1.65] text-ink-muted md:grid-cols-2 lg:mt-12">
              <p>{H.missionBody1}</p>
              <p>{H.missionBody2}</p>
            </div>
          </div>
          <nav aria-label={t.manuals.languages} className="lg:col-span-4 lg:col-start-9">
            <h3 className="t-index">{t.manuals.languages}</h3>
            <ul className="mt-3 border-t border-rule">
              {UI_LOCALES.map((l) => {
                const n = manuals.filter((m) => m.translations.some((tr) => tr.language === l)).length;
                return (
                  <li key={l} className="border-b border-line">
                    <Link href={`/manuals?lang=${l}`} className="group flex items-baseline justify-between gap-4 py-4">
                      <span lang={l} className="font-display text-[22px] font-normal tracking-[-0.03em] text-ink decoration-accent decoration-2 underline-offset-[6px] group-hover:underline">{nativeLanguageName(l)}</span>
                      <span className="text-[13px] text-ink-faint">{n ? <><span className="t-num font-medium text-ink">{n}</span> {t.manuals.documents}</> : t.manuals.unavailable}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </section>

      {/* (02) Library — featured document as an object, the rest as an index */}
      <section aria-labelledby="library-title" className="mx-auto max-w-content px-5 pb-20 lg:px-10 lg:pb-32">
        <SectionHead index={2} label={H.libraryIndex} title={H.libraryTitle} id="library-title" link={{ href: "/manuals", label: H.libraryLink }} />
        {!featured ? (
          <div className="mt-10 grid gap-x-6 lg:grid-cols-12">
            <p className="max-w-xl text-ink-muted lg:col-span-6 lg:col-start-4">{manualsResult.ok ? H.libraryEmpty : t.manuals.notConfigured}</p>
          </div>
        ) : (
          <div className="mt-12 grid gap-x-6 gap-y-12 lg:mt-16 lg:grid-cols-12">
            <Link href={`/manuals/${featured.slug}`} className="group block max-w-[300px] sm:max-w-[360px] lg:col-span-3 lg:max-w-none">
              <span className="img-zoom block overflow-hidden shadow-[0_1px_2px_rgba(0,16,43,0.08),0_30px_60px_-34px_rgba(0,16,43,0.45)]"><DocumentThumb manual={featured} /></span>
            </Link>
            <div className="lg:col-span-5 lg:col-start-4">
              <p className="t-index"><span className="mr-2 inline-block size-2 bg-accent align-middle" aria-hidden />{H.featured} · {featured.season}{featured.seasonName ? ` · ${featured.seasonName}` : ""} · {t.manuals.revision} {featured.revision}</p>
              <h3 className="t-h2 mt-4 text-ink"><Link href={`/manuals/${featured.slug}`} className="hover:underline hover:decoration-1 hover:underline-offset-4">{featured.title}</Link></h3>
              {featured.description && <p className="mt-4 max-w-lg text-ink-muted">{featured.description}</p>}
              {primary && (
                <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
                  <Link href={readerHref(featured.slug, primary.language)} className="btn-primary">{t.manuals.read}</Link>
                  <a href={primary.fileUrl} download className="link-rule text-[15px] font-medium text-ink">{t.manuals.download}</a>
                </div>
              )}
            </div>
            <div className="lg:col-span-3 lg:col-start-10">
              <h3 className="t-index">{H.readIn}</h3>
              <ul className="mt-3 border-t border-line">
                {featured.translations.map((tr) => (
                  <li key={tr.id} className="border-b border-line">
                    <Link href={readerHref(featured.slug, tr.language)} className="group flex items-baseline justify-between gap-4 py-3.5">
                      <span lang={tr.language} className="text-[16px] font-medium text-ink group-hover:underline group-hover:underline-offset-4">{nativeLanguageName(tr.language)}</span>
                      <span className="text-[12px] text-ink-faint">{tr.pageCount ? `${tr.pageCount} ${t.manuals.pages}` : formatBytes(tr.fileSizeBytes)}</span>
                    </Link>
                  </li>
                ))}
                {missing.map((l) => (
                  <li key={l} className="flex items-baseline justify-between gap-4 border-b border-line py-3.5 text-ink-faint">
                    <span lang={l} className="text-[16px]">{nativeLanguageName(l)}</span>
                    <span className="text-[12px]">{t.manuals.unavailable}</span>
                  </li>
                ))}
              </ul>
            </div>
            {others.length > 0 && (
              <ul className="border-t border-line lg:col-span-9 lg:col-start-4">
                {others.map((m) => (
                  <li key={m.id} className="border-b border-line">
                    <Link href={`/manuals/${m.slug}`} className="group grid grid-cols-[5.5rem_1fr_auto] items-baseline gap-x-6 py-4 sm:grid-cols-[7rem_1fr_auto]">
                      <span className="t-num text-[13px] text-ink-muted">{m.season}</span>
                      <span className="text-[16px] font-medium text-ink group-hover:underline group-hover:underline-offset-4">{m.title}</span>
                      <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-faint">{m.translations.map((tr) => tr.language).join(" ")}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* (03) Learn — lead lesson plus a short column, or the programme when nothing is published */}
      <section aria-labelledby="learn-title" className="bg-paper">
        <div className="mx-auto max-w-content px-5 pb-20 pt-16 lg:px-10 lg:pb-32 lg:pt-24">
          <SectionHead index={3} label={H.learnIndex} title={H.learnTitle} id="learn-title" link={{ href: "/learn", label: H.learnLink }} />
          {lead ? (
            <div className="mt-12 grid gap-x-6 gap-y-12 lg:mt-16 lg:grid-cols-12">
              <div className="lg:col-span-7"><LessonTeaser lesson={lead} variant="lead" headingLevel="h3" languageLabel={languageName(lead.language, locale)} /></div>
              <div className="grid content-start gap-y-10 sm:grid-cols-2 sm:gap-x-6 lg:col-span-4 lg:col-start-9 lg:grid-cols-1">
                <p className="max-w-sm text-ink-muted">{H.learnBody}</p>
                {rest.slice(0, 2).map((l) => <LessonTeaser key={l.id} lesson={l} variant="compact" languageLabel={languageName(l.language, locale)} />)}
              </div>
            </div>
          ) : (
            <div className="mt-12 grid gap-x-6 gap-y-10 lg:mt-16 lg:grid-cols-12">
              <div className="lg:col-span-3"><p className="max-w-xs text-ink-muted">{H.learnBody}</p></div>
              <ol className="border-t border-line lg:col-span-5">
                {categories.map((c, i) => (
                  <li key={c.id} className="border-b border-line">
                    <Link href={`/learn?category=${c.slug}`} className="group flex items-baseline gap-5 py-5">
                      <span className="t-num text-[12px] text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
                      <span className="font-display text-[clamp(1.25rem,2vw,1.625rem)] font-normal tracking-[-0.03em] text-ink group-hover:underline group-hover:decoration-1 group-hover:underline-offset-[6px]">{c.name}</span>
                    </Link>
                  </li>
                ))}
              </ol>
              <div className="lg:col-span-3 lg:col-start-10">
                <p className="text-[15px] text-ink-muted">{learnResult.ok ? H.learnEmpty : t.learn.notConfigured}</p>
                <h3 className="t-index mt-8">{t.learn.plannedTitle}</h3>
                <ul className="mt-3 space-y-1.5 text-[14px] text-ink">
                  {t.learn.planned.map((p) => <li key={p}>{p}</li>)}
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Closing — indigo band, signed with the emblem */}
      <section aria-labelledby="closing-title" className="relative isolate overflow-hidden bg-indigo">
        <Image src="/brand/mavericks-emblem.jpg" alt="" width={640} height={640} aria-hidden
          className="pointer-events-none absolute -right-24 top-1/2 -z-10 hidden w-[min(44vw,620px)] -translate-y-1/2 opacity-60 mix-blend-screen [mask-image:radial-gradient(closest-side,#000_45%,transparent_92%)] lg:block" />
        <div className="mx-auto grid max-w-content gap-x-6 gap-y-12 px-5 py-20 lg:grid-cols-12 lg:px-10 lg:py-28">
          <div className="lg:col-span-7">
            <h2 id="closing-title" className="t-h1 max-w-[18ch] text-ink">{H.closingTitle}</h2>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link href="/manuals" className="btn-primary">{H.closingManuals}</Link>
              <Link href="/learn" className="link-arrow text-[15px] text-ink">{H.closingLearn}</Link>
            </div>
            <div className="mt-16 max-w-md border-t border-rule pt-5">
              <h3 className="t-h3 text-ink">{H.teamTitle}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">{H.teamBody}</p>
              <Link href="/about#team" className="link-arrow mt-5 text-[15px] text-ink">{H.teamLink}</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
