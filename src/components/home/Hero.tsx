import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionary";
import type { SiteMedia } from "@/lib/site/repository";
import { HeroVideo } from "./HeroVideo";

export function Hero({ t, media }: { t: Dictionary; media: SiteMedia }) {
  return (
    <section className="on-dark relative isolate flex min-h-[78vh] items-end overflow-hidden bg-navy text-white" aria-labelledby="hero-title">
      <HeroVideo src={media.heroVideo} poster={media.heroPoster} labels={t.hero} />
      {!media.heroVideo && !media.heroPoster && (
        // Upload-ready state: a quiet field-grid pattern, no stock imagery.
        <div aria-hidden className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:96px_96px]" />
      )}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/60 to-navy/10" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-navy/80 to-transparent" />
      <div className="relative z-10 mx-auto w-full max-w-content px-5 pb-20 pt-32 lg:px-8 lg:pb-28">
        <h1 id="hero-title" className="max-w-3xl text-[clamp(2.75rem,7vw,5.5rem)] font-bold leading-[0.98] tracking-[-0.035em]">
          <span className="block">{t.hero.title1}</span>
          <span className="block text-honey">{t.hero.title2}</span>
        </h1>
        <p className="mt-7 max-w-xl text-lg text-white/85 md:text-xl">{t.hero.subtitle}</p>
        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
          <Link href="/manuals" className="inline-flex h-12 items-center rounded-md bg-white px-6 text-[15px] font-semibold text-navy hover:bg-honey-pale">
            {t.hero.primary}
          </Link>
          <Link href="/about#initiative" className="group inline-flex items-center gap-2 text-[15px] font-semibold text-white">
            {t.hero.secondary}
            <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
