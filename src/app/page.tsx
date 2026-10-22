import Link from "next/link";
import { FeaturedManual } from "@/components/home/FeaturedManual";
import { Hero } from "@/components/home/Hero";
import { LanguagePicker } from "@/components/home/LanguagePicker";
import { Notice } from "@/components/ui/Notice";
import { Section } from "@/components/ui/Section";
import { getI18n } from "@/i18n/server";
import { facetValues } from "@/lib/manuals/filters";
import { listPublishedManuals } from "@/lib/manuals/repository";
import { getSiteMedia, listSponsors } from "@/lib/site/repository";

export default async function HomePage() {
  const { t, locale } = await getI18n();
  const [result, media, sponsors] = await Promise.all([listPublishedManuals(), getSiteMedia(), listSponsors()]);
  const manuals = result.ok ? result.data : [];
  const featured = manuals.find((m) => m.isFeatured) ?? manuals[0] ?? null;
  const { languages } = facetValues(manuals);

  return (
    <>
      <Hero t={t} media={media} />
      <FeaturedManual t={t} manual={featured} locale={locale} notConfigured={!result.ok && result.reason === "not_configured"} />

      <div className="bg-paper">
        <Section id="languages" eyebrow={t.home.readInLanguageEyebrow} title={t.home.readInLanguageTitle}>
          <p className="mt-5 max-w-2xl text-lg text-ink-muted">{t.home.readInLanguageBody}</p>
          <LanguagePicker
            locale={locale}
            languages={languages}
            emptyLabel={t.home.noTranslations}
            items={manuals.map((m) => ({ slug: m.slug, title: m.title, season: m.season, languages: m.translations.map((tr) => tr.language) }))}
          />
        </Section>
      </div>

      <Section id="ai" eyebrow={t.home.aiEyebrow} title={t.home.aiTitle}>
        <div className="mt-6 grid gap-10 md:grid-cols-2">
          <p className="max-w-xl text-lg leading-relaxed text-ink-muted">{t.home.aiBody}</p>
          <div className="self-start"><Notice tone="warning">{t.home.aiStatus}</Notice></div>
        </div>
      </Section>

      <section id="initiative" aria-labelledby="initiative-title" className="on-dark bg-navy text-white">
        <div className="mx-auto grid max-w-content gap-12 px-5 py-24 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:px-8 lg:py-32">
          <div>
            <p className="eyebrow !text-white/60">{t.home.initiativeEyebrow}</p>
            <h2 id="initiative-title" className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.02em] md:text-[2.5rem]">{t.home.initiativeTitle}</h2>
          </div>
          <div className="lg:pt-12">
            <p className="text-lg leading-relaxed text-white/80">{t.home.initiativeBody}</p>
            <Link href="/about#initiative" className="mt-8 inline-flex items-center gap-2 font-semibold text-honey">{t.hero.secondary} <span aria-hidden>→</span></Link>
          </div>
        </div>
      </section>

      <Section id="community" eyebrow={t.home.communityEyebrow} title={t.home.communityTitle}>
        <p className="mt-5 max-w-2xl text-lg text-ink-muted">{t.home.communityBody}</p>
      </Section>

      <div className="bg-soft">
        <Section id="film" eyebrow={t.home.filmEyebrow}>
          {media.filmVideo ? (
            <video controls preload="metadata" poster={media.filmPoster ?? undefined} src={media.filmVideo} className="mt-8 aspect-video w-full bg-navy" />
          ) : (
            <div className="mt-8 flex aspect-[21/9] items-center justify-center border border-dashed border-ink-muted/30 px-6 text-center text-ink-muted">{t.home.filmEmpty}</div>
          )}
        </Section>
      </div>

      <Section id="partners" eyebrow={t.home.partnersEyebrow}>
        {sponsors.length ? (
          <ul className="mt-10 flex flex-wrap items-center gap-x-14 gap-y-8">
            {sponsors.map((s) => (
              <li key={s.id}>
                <a href={s.url ?? undefined} rel="noopener noreferrer" target="_blank" className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element -- storage-hosted logo */}
                  {s.logoUrl ? <img src={s.logoUrl} alt={s.name} className="h-12 w-auto object-contain" /> : <span className="text-lg font-semibold">{s.name}</span>}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-ink-muted">{t.home.partnersEmpty}</p>
        )}
      </Section>
    </>
  );
}
