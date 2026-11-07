import Image from "next/image";
import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { ProjectGallery } from "@/components/hub/ProjectGallery";
import { LessonTeaser } from "@/components/learn/LessonTeaser";
import { DocumentThumb } from "@/components/manuals/DocumentThumb";
import { formatBytes, readerHref } from "@/components/manuals/format";
import { LOCALE_LABELS, UI_LOCALES } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { HUB_CATEGORIES, categoryTitle } from "@/lib/hub/categories";
import { toGalleryItems } from "@/lib/hub/gallery";
import { listPublishedEntries } from "@/lib/hub/repository";
import { sortEntries } from "@/lib/hub/types";
import { languageName, nativeLanguageName } from "@/lib/languages";
import { listPublishedLessons } from "@/lib/learn/repository";
import { orderLanguages, publishedLanguages } from "@/lib/manuals/language";
import { listPublishedManuals } from "@/lib/manuals/repository";
import { getSiteMedia } from "@/lib/site/repository";

export default async function HomePage() {
  const { t, locale } = await getI18n();
  const [manualsResult, learnResult, media, hubResult] = await Promise.all([
    listPublishedManuals(), listPublishedLessons(locale), getSiteMedia(), listPublishedEntries(),
  ]);
  const H = t.home;

  const manuals = manualsResult.ok ? manualsResult.data : [];
  // Every language with a published edition (drafts and archived editions never reach this list)
  const manualLanguages = orderLanguages(publishedLanguages(manuals), locale);
  const featured = manuals.find((m) => m.isFeatured) ?? manuals[0] ?? null;
  const others = manuals.filter((m) => m.id !== featured?.id).slice(0, 4);
  const primary = featured ? (featured.translations.find((tr) => tr.isSource) ?? featured.translations[0]) : null;
  const missing = featured ? UI_LOCALES.filter((l) => !featured.translations.some((tr) => tr.language === l)) : [];

  const lessons = learnResult.ok ? learnResult.data.lessons : [];
  const [lead, ...rest] = lessons;

  // Published projects and collaborations that have a real image, newest featured first
  const work = toGalleryItems(sortEntries(hubResult.ok ? hubResult.data : []), (e) => `/mavericks/${e.category}/${e.slug}`).slice(0, 9);

  return (
    <>
      <Hero t={t} media={media} />

      {/* 1 · Mission: one statement, two ways in, and the published manual languages as a strip */}
      <section id="first-for-all" aria-labelledby="ffa-title" className="mx-auto max-w-content scroll-mt-20 px-5 pt-20 lg:px-10 lg:pt-32">
        <div className="grid gap-x-6 gap-y-10 lg:grid-cols-12">
          <h2 id="ffa-title" className="t-display text-ink lg:col-span-7">{t.hero.title1} {t.hero.title2}</h2>
          <div className="lg:col-span-4 lg:col-start-9 lg:pt-3">
            <p className="t-lead text-ink">{H.missionBody1}</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Link href="/manuals" className="btn-primary">{H.introLinksManuals}</Link>
              <Link href="/learn" className="link-arrow text-[16px] text-ink">{H.introLinksLearn}</Link>
            </div>
          </div>
        </div>
        {/* Manual languages come from published editions (any number); the website's own interface languages are listed separately */}
        <div className="mt-16 lg:mt-24">
          {manualLanguages.length > 0 && (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <h3 id="manual-languages" className="t-h3 text-ink">{H.stripTitle}</h3>
                <p className="t-meta">{H.stripHint}</p>
              </div>
              <nav aria-labelledby="manual-languages" className="mt-5">
                <ul className="grid grid-cols-2 gap-x-6 border-t border-rule sm:grid-cols-3 lg:grid-cols-6">
                  {manualLanguages.map((l) => {
                    const native = nativeLanguageName(l), local = languageName(l, locale);
                    return (
                      <li key={l} className="border-b border-line">
                        <Link href={`/manuals?lang=${encodeURIComponent(l)}`} className="group flex h-full min-h-[72px] flex-col justify-center gap-0.5 py-4 lg:min-h-[84px]">
                          <span lang={l} className="text-[17px] font-semibold tracking-[-0.015em] text-ink group-hover:underline group-hover:decoration-1 group-hover:underline-offset-[5px] lg:text-[19px]">{native}</span>
                          {local !== native && <span className="text-[14px] text-ink-muted">{local}</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </>
          )}
          <p className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[15px]">
            <span className="font-semibold text-ink">{H.interfaceTitle}</span>
            {UI_LOCALES.map((l) => (
              <span key={l} lang={l} className={l === locale ? "font-medium text-ink" : "text-ink-muted"}>{LOCALE_LABELS[l]}</span>
            ))}
          </p>
        </div>
      </section>

      {/* 2 · Library: the featured publication as an object, its translations beside it */}
      <section aria-labelledby="library-title" className="mx-auto max-w-content px-5 py-24 lg:px-10 lg:py-36">
        <div className="grid gap-x-6 gap-y-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="library-title" className="t-h2 text-ink">
              {/* One sentence per line ("FTC manuals." / "In your language.") keeps the heading balanced at every width */}
              {H.libraryTitle.split(/(?<=[.!?])\s+/).map((line, i) => <span key={i} className="block">{line}</span>)}
            </h2>
            <p className="mt-5 max-w-sm text-[18px] leading-relaxed text-ink-muted">{H.libraryLead}</p>
            <Link href="/manuals" className="link-arrow mt-7 text-[16px] text-ink">{H.libraryLink}</Link>
          </div>
          {!featured ? (
            <p className="max-w-xl text-[17px] text-ink-muted lg:col-span-6 lg:col-start-7">{manualsResult.ok ? H.libraryEmpty : t.manuals.notConfigured}</p>
          ) : (
            <>
              <Link href={`/manuals/${featured.slug}`} className="group block max-w-[320px] sm:max-w-[380px] lg:col-span-3 lg:col-start-6 lg:max-w-none">
                <span className="img-zoom block overflow-hidden rounded-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.06),0_24px_48px_-28px_rgba(0,16,43,0.35)]"><DocumentThumb manual={featured} /></span>
              </Link>
              <div className="lg:col-span-4 lg:col-start-9">
                <p className="t-meta">{featured.season}{featured.seasonName ? ` · ${featured.seasonName}` : ""} · {t.manuals.revision} {featured.revision}</p>
                <h3 className="mt-3 text-[22px] font-semibold leading-snug tracking-[-0.02em] text-ink">
                  <Link href={`/manuals/${featured.slug}`} className="hover:underline hover:decoration-1 hover:underline-offset-4">{featured.title}</Link>
                </h3>
                {featured.description && <p className="mt-3 text-ink-muted">{featured.description}</p>}
                <ul className="mt-7 border-t border-line">
                  {featured.translations.map((tr) => (
                    <li key={tr.id} className="border-b border-line">
                      <Link href={readerHref(featured.slug, tr.language)} className="group flex items-baseline justify-between gap-4 py-3.5">
                        <span lang={tr.language} className="text-[16px] font-medium text-ink group-hover:underline group-hover:underline-offset-4">{nativeLanguageName(tr.language)}</span>
                        <span className="text-[14px] text-ink-muted">{tr.pageCount ? `${tr.pageCount} ${t.manuals.pages}` : formatBytes(tr.fileSizeBytes)}</span>
                      </Link>
                    </li>
                  ))}
                  {missing.map((l) => (
                    <li key={l} className="flex items-baseline justify-between gap-4 border-b border-line py-3.5 text-ink-faint">
                      <span lang={l} className="text-[16px]">{nativeLanguageName(l)}</span>
                      <span className="text-[14px]">{t.manuals.unavailable}</span>
                    </li>
                  ))}
                </ul>
                {primary && (
                  <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
                    <Link href={readerHref(featured.slug, primary.language)} className="btn-primary">{t.manuals.read}</Link>
                    <a href={primary.fileUrl} download className="link-rule text-[15px] font-medium text-ink">{t.manuals.download}</a>
                  </div>
                )}
              </div>
              {others.length > 0 && (
                <ul className="border-t border-line lg:col-span-8 lg:col-start-5">
                  {others.map((m) => (
                    <li key={m.id} className="border-b border-line">
                      <Link href={`/manuals/${m.slug}`} className="group grid grid-cols-[6rem_1fr] items-baseline gap-x-6 py-4 sm:grid-cols-[7rem_1fr_auto]">
                        <span className="t-num text-[15px] text-ink-muted">{m.season}</span>
                        <span className="text-[16px] font-medium text-ink group-hover:underline group-hover:underline-offset-4">{m.title}</span>
                        <span className="hidden text-[14px] text-ink-muted sm:block">{m.translations.map((tr) => nativeLanguageName(tr.language)).join(", ")}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </section>

      {/* 3 · LEARN: academy layout — intro left, the lead lesson large, a short row underneath */}
      <section aria-labelledby="learn-title" className="bg-paper">
        <div className="mx-auto max-w-content px-5 py-20 lg:px-10 lg:py-28">
          <div className="grid items-center gap-x-6 gap-y-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="t-index">{t.learn.kicker}</p>
              <h2 id="learn-title" className="t-h2 mt-3 text-ink">{H.learnTitle}</h2>
              <p className="mt-5 max-w-md text-[17px] leading-relaxed text-ink-muted">{H.learnBody}</p>
              <Link href="/learn" className="btn-primary mt-8">{H.learnLink}</Link>
            </div>
            {lead ? (
              <Link href={`/learn/${lead.slug}`} aria-label={lead.title} className="group hidden lg:col-span-7 lg:block"><LessonTeaser lesson={lead} variant="lead" headingLevel="h3" mediaOnly languageLabel={languageName(lead.language, locale)} /></Link>
            ) : (
              <p className="text-[17px] text-ink-muted lg:col-span-6 lg:col-start-7">{learnResult.ok ? H.learnEmpty : t.learn.notConfigured}</p>
            )}
          </div>
          {lead && (
            <div className="mt-14 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {[lead, ...rest].slice(0, 3).map((l) => <LessonTeaser key={l.id} lesson={l} variant="standard" languageLabel={languageName(l.language, locale)} newLabel={t.learn.newLesson} />)}
            </div>
          )}
        </div>
      </section>

      {/* 4 · MAVERICKS: a wide team photograph and a narrow column of text */}
      <section aria-labelledby="mav-title" className="mx-auto max-w-content px-5 py-24 lg:px-10 lg:py-36">
        <div className="grid items-end gap-x-6 gap-y-10 lg:grid-cols-12">
          {media.teamFeature && (
            <figure className="lg:col-span-8">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[3px] bg-soft">
                <Image src={media.teamFeature.url} alt={media.teamFeature.alt} fill sizes="(min-width: 1024px) 60vw, 100vw"
                  className="object-cover" style={{ objectPosition: media.teamFeature.focus }} />
              </div>
              {media.teamFeature.caption && <figcaption className="t-meta mt-3">{media.teamFeature.caption}</figcaption>}
            </figure>
          )}
          <div className={media.teamFeature ? "lg:col-span-4 lg:pb-10" : "lg:col-span-7"}>
            <h2 id="mav-title" className="t-h2 text-ink">{H.teamTitle}</h2>
            <p className="mt-5 text-[17px] leading-relaxed text-ink-muted">{H.teamBody}</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link href="/mavericks/team" className="btn-primary">{H.meetTeam}</Link>
              <Link href="/about" className="link-arrow text-[16px] text-ink">{H.teamLink}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5 · Work: the center-focused project carousel (compact), then the seven directions as a directory */}
      <section aria-labelledby="work-title" className="border-t border-rule">
        <div className="mx-auto max-w-content px-5 pt-20 lg:px-10 lg:pt-28">
          <div className="grid gap-x-6 gap-y-4 lg:grid-cols-12">
            <h2 id="work-title" className="t-h2 text-ink lg:col-span-6">{H.workTitle}</h2>
            <p className="text-[17px] text-ink-muted lg:col-span-4 lg:col-start-9 lg:pt-2">{work.length ? H.workBody : H.workEmpty}</p>
          </div>
        </div>
        {work.length > 0 && (
          <div className="mt-10 lg:mt-12">
            <ProjectGallery items={work} compact label={H.workTitle}
              labels={{ previous: t.hub.galleryPrev, next: t.hub.galleryNext, open: t.hub.galleryOpen, hint: t.hub.galleryHint, hintTouch: t.hub.galleryHintTouch, of: t.hub.imageOf }} />
          </div>
        )}
        <div className="mx-auto max-w-content px-5 pb-20 lg:px-10 lg:pb-28">
          <div className="mt-16 grid gap-x-6 gap-y-6 lg:mt-24 lg:grid-cols-12">
            <h3 className="t-label text-ink lg:col-span-3">{H.directions}</h3>
            <ul className="grid gap-x-6 sm:grid-cols-2 lg:col-span-9">
              {HUB_CATEGORIES.map((c) => (
                <li key={c} className="border-b border-line">
                  <Link href={`/mavericks/${c}`} className="group flex items-baseline justify-between gap-4 py-4">
                    <span className="text-[18px] font-semibold tracking-[-0.015em] text-ink group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">{categoryTitle(c)}</span>
                    <span className="text-right text-[15px] text-ink-muted">{t.hub.categories[c].tagline}</span>
                  </Link>
                </li>
              ))}
              <li className="border-b border-line">
                <Link href="/mavericks/team" className="group flex items-baseline justify-between gap-4 py-4">
                  <span className="text-[18px] font-semibold tracking-[-0.015em] text-ink group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">{t.nav.team}</span>
                  <span className="text-[15px] text-ink-muted" aria-hidden>→</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 6 · Closing: a plain statement on white */}
      <section aria-labelledby="closing-title" className="border-t border-rule">
        <div className="mx-auto max-w-content px-5 py-24 lg:px-10 lg:py-32">
          <h2 id="closing-title" className="t-h1 max-w-[18ch] text-ink">{H.closingTitle}</h2>
          <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
            <Link href="/manuals" className="btn-primary">{H.closingManuals}</Link>
            <Link href="/learn" className="link-arrow text-[16px] text-ink">{H.closingLearn}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
