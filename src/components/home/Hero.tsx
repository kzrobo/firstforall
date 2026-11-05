import type { Dictionary } from "@/i18n/dictionary";
import type { SiteMedia } from "@/lib/site/repository";
import { HeroVideo } from "./HeroVideo";

/**
 * Full-viewport opening: the authorised background video (site_settings hero_video + posters),
 * a navy-tinted overlay for legibility, one headline and a short attribution. If the video fails
 * the poster frame stays; with no video configured at all the hero is a calm neutral composition
 * with dark type. The emblem is never used as the hero background, nor the team group photo.
 */
export function Hero({ t, media }: { t: Dictionary; media: SiteMedia }) {
  const video = media.heroVideo;
  const scroll = (
    <a href="#first-for-all" aria-label={t.hero.scroll}
      className="mt-10 inline-flex size-11 items-center justify-center rounded-full border border-ink/60 text-ink transition-colors hover:bg-ink hover:text-[var(--hero-bg)]">
      <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 5v14M6 13l6 6 6-6" /></svg>
    </a>
  );

  if (!video) {
    return (
      <section aria-labelledby="hero-title" className="bg-paper [--hero-bg:var(--color-paper)]">
        <div className="mx-auto flex min-h-[min(78svh,760px)] max-w-content flex-col justify-end px-5 pb-14 pt-24 lg:px-10 lg:pb-20">
          <p className="text-[15px] font-medium text-ink-muted">{t.hero.byline}</p>
          <h1 id="hero-title" className="t-display mt-5 max-w-[14ch] text-ink">{t.hero.headline}</h1>
          {scroll}
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="hero-title" data-hero-media
      className="on-media relative isolate flex h-[100svh] min-h-[560px] flex-col overflow-hidden bg-navy [--hero-bg:#00102b]">
      <HeroVideo video={video} poster={media.heroPoster} posterMobile={media.heroPosterMobile} labels={t.hero} />
      {/* Legibility: an even navy tint, a little more under the navigation and under the headline */}
      <div aria-hidden className="absolute inset-0 -z-[2] bg-[#00102b]/30" />
      <div aria-hidden className="absolute inset-x-0 top-0 -z-[1] h-36 bg-gradient-to-b from-[#00102b]/55 to-transparent" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-[1] h-[58%] bg-gradient-to-t from-[#00102b]/80 via-[#00102b]/35 to-transparent" />

      <div className="mx-auto mt-auto w-full max-w-content px-5 pb-10 lg:px-10 lg:pb-14">
        <p className="text-[15px] font-medium text-ink-muted">{t.hero.byline}</p>
        <h1 id="hero-title" className="t-display mt-5 max-w-[14ch] text-ink">{t.hero.headline}</h1>
        {scroll}
      </div>
    </section>
  );
}
