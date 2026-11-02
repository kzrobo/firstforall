import Image from "next/image";
import Link from "next/link";
import { FilmDialog } from "@/components/media/FilmDialog";
import type { UiLocale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionary";
import type { SiteMedia } from "@/lib/site/repository";
import { HeroVideo } from "./HeroVideo";

/**
 * Cinematic hero. Team footage (hero_video) or the team photograph runs full-bleed and
 * dissolves into the midnight page at its lower edge; the type sits in that dark band,
 * so it never covers faces. Phones stack image above type.
 */
export function Hero({ t, media }: { t: Dictionary; media: SiteMedia; locale: UiLocale }) {
  const hasMedia = Boolean(media.heroVideo || media.heroPoster);
  const caption = media.heroVideo?.caption ?? media.heroPoster?.caption;
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-canvas">
      {/* Fixed 16:9 frame cropped from the bottom: keeps both rows of faces, drops most of the
          banner above them. Only the lowest band (hands, laps) fades into the page under the type. */}
      <div className="relative aspect-[5/4] w-full sm:aspect-[16/10] lg:aspect-[16/9] lg:max-h-[880px]">
        {hasMedia && <HeroVideo video={media.heroVideo} poster={media.heroPoster} posterMobile={media.heroPosterMobile} labels={t.hero} />}
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,10,29,0.5)_0%,rgba(2,10,29,0)_22%,rgba(2,10,29,0)_78%,rgba(2,10,29,0.5)_100%)]" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-canvas via-canvas/70 to-transparent lg:h-[26%]" />
      </div>

      <div className="relative mx-auto -mt-8 max-w-content px-5 pb-14 sm:-mt-14 lg:-mt-36 lg:px-10 lg:pb-20">
        <div className="grid gap-x-6 gap-y-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="text-[13px] font-medium text-ink-muted">MAVERICKS · FTC #24034 <span aria-hidden className="mx-2 text-ink-faint">/</span>{t.hero.place}</p>
            <h1 id="hero-title" className="font-display mt-4 text-[clamp(2.25rem,5.6vw,5.25rem)] font-medium leading-[1] tracking-[-0.04em] text-ink">
              {t.hero.title1}<br />{t.hero.title2}
            </h1>
          </div>
          <div className="lg:col-span-4 lg:pb-1.5">
            <p className="max-w-sm text-[16px] leading-relaxed text-ink-muted">{t.hero.lead}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Link href="/manuals" className="btn-primary">{t.hero.primary}</Link>
              <Link href="/learn" className="link-rule text-[15px] font-medium text-ink">{t.hero.secondary}</Link>
              {media.filmVideo && <FilmDialog src={media.filmVideo.url} poster={media.filmPoster?.url} label={t.hero.watchFilm} closeLabel={t.hero.closeFilm} className="text-ink" />}
            </div>
          </div>
        </div>
        {caption && (
          <p className="mt-10 flex items-center gap-3 border-t border-line pt-4 text-[12px] text-ink-faint">
            <Image src="/brand/mavericks-emblem.jpg" alt="" width={24} height={24} className="size-6 mix-blend-screen [mask-image:radial-gradient(closest-side,#000_60%,transparent)]" />
            {caption}
          </p>
        )}
      </div>
    </section>
  );
}
