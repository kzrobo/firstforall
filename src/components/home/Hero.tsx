import Link from "next/link";
import { FilmDialog } from "@/components/media/FilmDialog";
import type { Dictionary } from "@/i18n/dictionary";
import type { SiteMedia } from "@/lib/site/repository";
import { HeroVideo } from "./HeroVideo";

/**
 * Full-bleed, video-first hero. Media comes from site_settings (hero_video, hero_poster,
 * hero_poster_mobile). Until footage is uploaded, a designed poster field is shown.
 */
export function Hero({ t, media, showEmpty }: { t: Dictionary; media: SiteMedia; showEmpty: boolean }) {
  const hasMedia = Boolean(media.heroVideo || media.heroPoster);
  return (
    <section aria-labelledby="hero-title" className="on-dark relative isolate flex min-h-[calc(100svh-4rem)] flex-col overflow-hidden bg-[#0a1524] text-white lg:min-h-[max(640px,calc(100svh-108px))]">
      {hasMedia ? (
        <HeroVideo video={media.heroVideo} poster={media.heroPoster} posterMobile={media.heroPosterMobile} labels={t.hero} />
      ) : (
        <div aria-hidden className="absolute inset-0 -z-10">
          {/* Poster field: low-key cinematic light, no imagery invented */}
          <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_78%_18%,#1d3a5c_0%,#0f2238_38%,#0a1524_72%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_12%_100%,rgba(232,184,77,0.10),transparent_70%)]" />
          <div className="film-grain absolute inset-0" />
          {showEmpty && (
            <p className="absolute right-5 top-5 text-[12px] font-medium tracking-[0.04em] text-white/40 lg:right-10 lg:top-8">
              Hero film · slots <code>hero_video</code> / <code>hero_poster</code>
            </p>
          )}
        </div>
      )}
      {/* Readability: weighted to the lower-left where the type sits */}
      <div aria-hidden className="absolute inset-0 -z-[1] bg-gradient-to-t from-[#0a1524]/90 via-[#0a1524]/25 to-transparent" />
      <div aria-hidden className="absolute inset-0 -z-[1] bg-gradient-to-r from-[#0a1524]/60 to-transparent" />

      <div className="mx-auto mt-auto w-full max-w-content px-5 pb-10 pt-28 lg:px-10 lg:pb-14">
        <p className="flex items-center gap-4 text-[13px] font-semibold tracking-[0.08em] text-white/75">
          <span>MAVERICKS</span><span aria-hidden className="h-4 w-px bg-white/40" /><span className="t-num font-medium text-white/60">FTC #24034</span>
        </p>
        <h1 id="hero-title" className="t-campaign mt-6 text-[clamp(2.125rem,7.4vw,6.5rem)] leading-[1.02]">
          <span className="block">{t.hero.title1}</span>
          <span className="block">{t.hero.title2}</span>
        </h1>

        <div className="mt-10 grid gap-8 border-t border-white/20 pt-7 md:grid-cols-12 md:items-center lg:mt-14">
          <p className="t-lead max-w-md text-white/85 md:col-span-5">{t.hero.subtitle}</p>
          <div className="flex flex-wrap items-center gap-x-9 gap-y-5 md:col-span-7 md:justify-end">
            {media.filmVideo && (
              <FilmDialog src={media.filmVideo.url} poster={media.filmPoster?.url} label={t.landing.watchFilm} closeLabel={t.landing.closeFilm} className="text-white" />
            )}
            <Link href="/about#initiative" className="link-arrow text-[15px] text-white hover:text-honey">{t.hero.secondary}</Link>
            <Link href="/manuals" className="font-display inline-flex h-12 items-center bg-white px-7 text-[14px] font-medium tracking-[-0.005em] text-night transition-colors hover:bg-honey-pale">
              {t.hero.primary}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
