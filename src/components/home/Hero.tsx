import Image from "next/image";
import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionary";
import type { SiteMedia } from "@/lib/site/repository";
import { HeroVideo } from "./HeroVideo";
import { Rings } from "./Rings";

export function Hero({ t, media }: { t: Dictionary; media: SiteMedia }) {
  const hasMedia = Boolean(media.heroVideo || media.heroPoster);
  return (
    <section aria-labelledby="hero-title" className="on-dark relative isolate overflow-hidden bg-[#0b1a2e] text-white">
      {hasMedia ? (
        <>
          <HeroVideo src={media.heroVideo} poster={media.heroPoster} labels={t.hero} />
          {/* Readability: darken only where the text sits */}
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-[#0b1a2e]/85 via-[#0b1a2e]/45 to-transparent" />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0b1a2e]/70 to-transparent" />
        </>
      ) : (
        // Designed media field until team footage is uploaded (Admin › Settings › hero_video).
        <div aria-hidden className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_72%_55%,#173352_0%,#0b1a2e_62%)]" />
          <Rings className="absolute left-[52%] top-1/2 h-[150%] -translate-y-1/2 text-white/[0.07]" count={7} />
          <Image src="/brand/mavericks-emblem.jpg" alt="" width={520} height={520} priority
            className="absolute left-[72%] top-1/2 hidden w-[min(34vw,460px)] -translate-x-1/2 -translate-y-1/2 opacity-90 mix-blend-screen [mask-image:radial-gradient(closest-side,#000_50%,transparent_96%)] lg:block" />
        </div>
      )}

      <div className="relative mx-auto flex min-h-[min(80vh,720px)] max-w-content flex-col justify-end px-5 pb-16 pt-28 lg:px-10 lg:pb-24">
        <p className="flex items-center gap-4 text-[13px] font-semibold tracking-[0.06em] text-white/80">
          <span>MAVERICKS</span><span aria-hidden className="h-5 w-px bg-white/40" /><span className="font-medium t-num text-white/60">FTC #24034</span>
        </p>
        <h1 id="hero-title" className="t-display mt-6 max-w-[16ch]">
          {t.hero.title1}<br />{t.hero.title2}
        </h1>
        <span aria-hidden className="mt-7 block h-[3px] w-12 bg-honey" />
        <p className="t-lead mt-6 max-w-[34rem] text-white/85">{t.hero.subtitle}</p>
        <div className="mt-10 flex flex-wrap items-center gap-x-9 gap-y-5">
          <Link href="/manuals" className="inline-flex h-12 items-center bg-white px-6 text-[15px] font-semibold text-night transition-colors hover:bg-honey-pale">
            {t.hero.primary}
          </Link>
          <Link href="/about#initiative" className="link-arrow text-[15px] text-white hover:text-honey">{t.hero.secondary}</Link>
        </div>
      </div>
    </section>
  );
}
