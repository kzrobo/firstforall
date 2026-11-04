import Image from "next/image";
import type { Dictionary } from "@/i18n/dictionary";
import type { SiteMedia } from "@/lib/site/repository";
import { HeroVideo } from "./HeroVideo";

/**
 * Full-viewport opening. Atmosphere and identity only: a background video from site_settings
 * (hero_video + hero_poster), a short headline, a small attribution and a scroll cue. Without a
 * licensed video it shows a still emblem composition — never the team photo.
 */
export function Hero({ t, media }: { t: Dictionary; media: SiteMedia }) {
  return (
    <section aria-labelledby="hero-title" className="relative isolate flex h-[100svh] min-h-[560px] flex-col overflow-hidden bg-canvas">
      {media.heroVideo ? (
        <HeroVideo video={media.heroVideo} poster={media.heroPoster} posterMobile={media.heroPosterMobile} labels={t.hero} />
      ) : (
        <div aria-hidden className="absolute inset-0 -z-10">
          <Image src="/brand/mavericks-emblem.jpg" alt="" width={1254} height={1254} priority
            className="absolute right-[-12vw] top-1/2 w-[min(110vw,1100px)] -translate-y-1/2 opacity-70 mix-blend-screen [mask-image:radial-gradient(closest-side,#000_42%,transparent_88%)] lg:right-[-4vw] lg:w-[min(64vw,1000px)]" />
        </div>
      )}
      {/* Video only: a subtle, even dim so white type stays readable over bright footage */}
      {media.heroVideo && <div aria-hidden className="absolute inset-0 -z-[2] bg-canvas/35" />}
      {/* Contrast only where needed: under the navigation and under the headline */}
      <div aria-hidden className="absolute inset-x-0 top-0 -z-[1] h-40 bg-gradient-to-b from-canvas/70 to-transparent" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-[1] h-[55%] bg-gradient-to-t from-canvas via-canvas/55 to-transparent" />

      <div className="mx-auto mt-auto w-full max-w-content px-5 pb-16 lg:px-10 lg:pb-20">
        <p className="text-[13px] font-medium tracking-[0.01em] text-ink/80">{t.hero.byline}</p>
        <h1 id="hero-title" className="font-display mt-5 max-w-[15ch] text-[clamp(2.5rem,6.4vw,6.25rem)] font-medium leading-[0.98] tracking-[-0.045em] text-ink">
          {t.hero.headline}
        </h1>
      </div>
      <a href="#first-for-all" className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-ink/70 hover:text-ink sm:flex">
        {t.hero.scroll}
        <span aria-hidden className="h-8 w-px bg-ink/50" />
      </a>
    </section>
  );
}
