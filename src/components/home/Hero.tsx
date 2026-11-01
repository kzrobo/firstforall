import Image from "next/image";
import Link from "next/link";
import { FilmDialog } from "@/components/media/FilmDialog";
import { UI_LOCALES, type UiLocale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionary";
import { nativeLanguageName } from "@/lib/languages";
import type { SiteMedia } from "@/lib/site/repository";
import { HeroVideo } from "./HeroVideo";

/**
 * Split editorial hero. Left: type and the primary action. Right: team footage/photo from
 * site_settings (hero_video / hero_poster / hero_poster_mobile); until it exists, a typeset
 * index of the platform's languages fills the panel — information, not decoration.
 */
export function Hero({ t, media, locale }: { t: Dictionary; media: SiteMedia; locale: UiLocale }) {
  const hasMedia = Boolean(media.heroVideo || media.heroPoster);
  return (
    <section aria-labelledby="hero-title" className="border-b border-line">
      <div className="grid lg:min-h-[min(calc(100svh-72px),780px)] lg:grid-cols-12">
        <div className="flex flex-col px-5 pb-12 pt-10 sm:pt-14 lg:col-span-6 lg:pb-14 lg:pl-[max(2.5rem,calc((100vw-90rem)/2+2.5rem))] lg:pr-12 lg:pt-16">
          <p className="t-index flex flex-wrap gap-x-3">
            <span>MAVERICKS · FTC #24034</span><span aria-hidden className="text-line-strong">/</span><span>{t.hero.place}</span>
          </p>
          <h1 id="hero-title" className="t-display mt-10 max-w-[13ch] text-navy lg:mt-[clamp(3rem,9vh,6rem)]">
            {t.hero.title1}<br />{t.hero.title2}
          </h1>
          <div className="mt-10 grid max-w-[34rem] gap-8 lg:mt-auto lg:pt-14">
            <p className="t-lead text-ink-muted">{t.hero.lead}</p>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-5">
              <Link href="/manuals" className="btn-primary">{t.hero.primary}</Link>
              <Link href="/learn" className="link-rule text-[15px] font-medium text-navy">{t.hero.secondary}</Link>
              {media.filmVideo && (
                <FilmDialog src={media.filmVideo.url} poster={media.filmPoster?.url} label={t.hero.watchFilm} closeLabel={t.hero.closeFilm} className="text-navy" />
              )}
            </div>
          </div>
        </div>

        <div className={`relative isolate overflow-hidden bg-navy lg:col-span-6 ${hasMedia ? "aspect-[4/5] sm:aspect-[16/10] lg:aspect-auto" : ""}`}>
          {hasMedia ? (
            <HeroVideo video={media.heroVideo} poster={media.heroPoster} posterMobile={media.heroPosterMobile} labels={t.hero} />
          ) : (
            <LanguageIndex t={t} locale={locale} />
          )}
        </div>
      </div>
    </section>
  );
}

function LanguageIndex({ t, locale }: { t: Dictionary; locale: UiLocale }) {
  return (
    <div className="flex h-full flex-col px-5 py-10 text-white sm:px-10 lg:px-12 lg:py-16">
      <p className="max-w-[24ch] text-[13px] leading-snug text-white/60">{t.hero.panelCaption}</p>
      <ol className="mt-8 border-t border-white/15 lg:mt-[clamp(3rem,9vh,6rem)]">
        {UI_LOCALES.map((l) => (
          <li key={l} className="flex items-baseline justify-between gap-6 border-b border-white/15 py-4 lg:py-5">
            <span lang={l} className="font-display flex items-center gap-4 text-[clamp(1.625rem,3vw,2.75rem)] font-normal leading-none tracking-[-0.035em]">
              <span aria-hidden className={`size-2.5 shrink-0 ${l === locale ? "bg-accent" : "bg-transparent"}`} />
              {nativeLanguageName(l)}
            </span>
            <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/45">{l}</span>
          </li>
        ))}
      </ol>
      <div className="mt-10 flex items-center gap-3 text-[12px] text-white/50 lg:mt-auto lg:pt-10">
        <Image src="/brand/mavericks-emblem.jpg" alt="" width={28} height={28} className="size-7 mix-blend-screen [mask-image:radial-gradient(closest-side,#000_60%,transparent)]" />
        MAVERICKS · {t.hero.place}
      </div>
    </div>
  );
}
