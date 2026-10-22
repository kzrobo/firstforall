import Image from "next/image";
import Link from "next/link";
import { AiWorkspaceShell } from "@/components/ai/AiWorkspaceShell";
import { Hero } from "@/components/home/Hero";
import { DocumentThumb } from "@/components/manuals/DocumentThumb";
import { formatBytes, readerHref } from "@/components/manuals/format";
import { FilmDialog } from "@/components/media/FilmDialog";
import { MediaSlot } from "@/components/media/MediaSlot";
import { UI_LOCALES } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { nativeLanguageName } from "@/lib/languages";
import { listPublishedManuals } from "@/lib/manuals/repository";
import { getSiteMedia, listSponsors, showEmptyMediaSlots } from "@/lib/site/repository";

export default async function HomePage() {
  const { t } = await getI18n();
  const [result, media, sponsors] = await Promise.all([listPublishedManuals(), getSiteMedia(), listSponsors()]);
  const showEmpty = showEmptyMediaSlots();
  const manuals = result.ok ? result.data : [];
  const featured = manuals.find((m) => m.isFeatured) ?? manuals[0] ?? null;
  const others = manuals.filter((m) => m.id !== featured?.id).slice(0, 3);
  const L = t.landing;
  const primary = featured ? (featured.translations.find((tr) => tr.isSource) ?? featured.translations[0]) : null;
  const missing = featured ? UI_LOCALES.filter((l) => !featured.translations.some((tr) => tr.language === l)) : [];

  return (
    <>
      <Hero t={t} media={media} showEmpty={showEmpty} />

      {/* Featured manual — the primary action of the site */}
      <section aria-labelledby="featured-title" className="border-b border-line bg-paper">
        <div className="mx-auto max-w-content px-5 py-20 lg:px-10 lg:py-28">
          {!featured ? (
            <div className="max-w-2xl">
              <p className="t-label text-ink-muted">{L.featuredLabel}</p>
              <h2 id="featured-title" className="t-h2 mt-4 text-navy">{L.libraryTitle}</h2>
              <p className="mt-5 text-ink-muted">{result.ok ? L.libraryEmpty : t.manuals.notConfigured}</p>
            </div>
          ) : (
            <div className="grid gap-x-20 gap-y-12 md:grid-cols-12">
              <Link href={`/manuals/${featured.slug}`} className="block max-w-[240px] sm:max-w-[420px] md:col-span-5 md:max-w-none lg:col-span-4">
                <span className="block shadow-[0_2px_4px_rgba(14,22,32,0.06),0_40px_70px_-40px_rgba(14,22,32,0.45)]"><DocumentThumb manual={featured} /></span>
              </Link>
              <div className="md:col-span-7 lg:col-span-7 lg:col-start-6">
                <p className="t-label text-ink-muted">{L.featuredLabel}</p>
                <p className="mt-5 text-[15px] font-medium text-tech t-num">{featured.season}{featured.seasonName ? ` · ${featured.seasonName}` : ""} · {t.manuals.revision} {featured.revision}</p>
                <h2 id="featured-title" className="t-h1 mt-2 text-navy">{featured.title}</h2>
                {featured.description && <p className="t-lead mt-5 max-w-xl text-ink-muted">{featured.description}</p>}
                {primary && (
                  <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                    <Link href={readerHref(featured.slug, primary.language)} className="inline-flex h-12 items-center bg-navy px-7 text-[15px] font-semibold text-white hover:bg-navy-800">{t.manuals.read}</Link>
                    <a href={primary.fileUrl} download className="link-arrow text-[15px] text-navy">{t.manuals.download}</a>
                  </div>
                )}

                <h3 className="t-label mt-12 text-ink-muted">{L.readIn}</h3>
                <ul className="mt-3 border-t border-line">
                  {featured.translations.map((tr) => (
                    <li key={tr.id} className="grid grid-cols-[1fr_auto] items-baseline gap-x-6 border-b border-line py-3.5 sm:grid-cols-[12rem_1fr_auto]">
                      <Link href={readerHref(featured.slug, tr.language)} lang={tr.language} className="text-[17px] font-semibold text-navy hover:underline">{nativeLanguageName(tr.language)}</Link>
                      <span className="hidden text-[14px] text-ink-muted sm:block">{tr.isSource ? t.manuals.official : t.manuals.community}{tr.pageCount ? ` · ${tr.pageCount} ${t.manuals.pages}` : ""}</span>
                      <span className="flex gap-5 text-[14px]">
                        <Link href={readerHref(featured.slug, tr.language)} className="font-semibold text-tech hover:underline">{t.manuals.read}</Link>
                        <a href={tr.fileUrl} download className="text-ink-muted hover:text-navy">PDF{formatBytes(tr.fileSizeBytes) ? ` · ${formatBytes(tr.fileSizeBytes)}` : ""}</a>
                      </span>
                    </li>
                  ))}
                  {missing.map((l) => (
                    <li key={l} className="grid grid-cols-[1fr_auto] items-baseline gap-x-6 border-b border-line py-3.5 text-ink-faint sm:grid-cols-[12rem_1fr_auto]">
                      <span lang={l} className="text-[17px] font-medium">{nativeLanguageName(l)}</span>
                      <span className="text-[14px] sm:col-span-2">{t.manuals.unavailable}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Library — search and the rest of the shelf */}
      <section aria-labelledby="library-title" className="mx-auto max-w-content px-5 py-16 lg:px-10 lg:py-20">
        <div className="grid items-end gap-8 border-b-2 border-navy pb-6 md:grid-cols-12">
          <h2 id="library-title" className="t-h2 text-navy md:col-span-6">{others.length ? L.moreFromLibrary : L.libraryLabel}</h2>
          <form action="/manuals" role="search" className="flex items-center gap-3 md:col-span-5 md:col-start-8">
            <label className="flex-1">
              <span className="sr-only">{L.searchLabel}</span>
              <input name="q" type="search" placeholder={L.searchPlaceholder} className="h-11 w-full border-b border-line-strong bg-transparent text-[16px] placeholder:text-ink-faint focus:border-navy focus:outline-none" />
            </label>
            <button className="text-navy" aria-label={t.nav.search}>
              <svg aria-hidden className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
            </button>
          </form>
        </div>
        {others.length > 0 && (
          <ul className="grid gap-x-10 md:grid-cols-3">
            {others.map((m) => (
              <li key={m.id} className="border-b border-line md:border-b-0">
                <Link href={`/manuals/${m.slug}`} className="group grid grid-cols-[88px_1fr] gap-5 py-7">
                  <span className="block w-[88px]"><DocumentThumb manual={m} /></span>
                  <span>
                    <span className="block text-[13px] font-medium text-tech t-num">{m.season}</span>
                    <span className="mt-1 block text-[17px] font-semibold leading-snug text-navy group-hover:underline">{m.title}</span>
                    <span className="mt-2 block text-[13px] uppercase tracking-[0.06em] text-ink-muted">{m.translations.map((tr) => tr.language).join(" · ")}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link href="/manuals" className="link-arrow mt-8 text-tech hover:text-navy">{L.browseAll}</Link>
      </section>

      {/* Full-bleed team photograph */}
      {(media.photoFeature || showEmpty) && (
        <section aria-label={L.teamLabel}>
          <MediaSlot item={media.photoFeature} slot="photo_feature" ratio="21 / 9" showEmpty={showEmpty} className="[&_figcaption]:mx-auto [&_figcaption]:max-w-content [&_figcaption]:px-5 lg:[&_figcaption]:px-10" />
        </section>
      )}

      {/* Initiative — brief; the full process lives on the Our Initiative page */}
      <section aria-labelledby="initiative-title" className="bg-pollen">
        <div className="mx-auto grid max-w-content items-center gap-x-20 gap-y-12 px-5 py-20 md:grid-cols-12 lg:px-10 lg:py-28">
          {(media.photoInitiative || showEmpty) && (
            <MediaSlot item={media.photoInitiative} slot="photo_initiative" ratio="4 / 5" showEmpty={showEmpty} className="md:col-span-5" />
          )}
          <div className={media.photoInitiative || showEmpty ? "md:col-span-6 md:col-start-7" : "md:col-span-8"}>
            <p className="t-label text-honey-deep">{t.home.initiativeEyebrow}</p>
            <h2 id="initiative-title" className="mt-5 text-[clamp(1.875rem,3.4vw,3rem)] font-bold leading-[1.08] tracking-[-0.03em] text-navy">{t.home.initiativeTitle}</h2>
            <p className="t-lead mt-6 text-ink/80">{t.home.initiativeBody}</p>
            <Link href="/about#initiative" className="link-arrow mt-9 text-[15px] text-navy">{L.initiativeLink}</Link>
          </div>
        </div>
      </section>

      {/* Mavericks AI — the interface itself */}
      <section aria-labelledby="ai-title" className="mx-auto grid max-w-content items-center gap-x-16 gap-y-12 px-5 py-20 lg:grid-cols-12 lg:px-10 lg:py-28">
        <div className="lg:col-span-5">
          <p className="t-label text-ink-muted">{L.aiLabel}</p>
          <h2 id="ai-title" className="t-h2 mt-4 text-navy">{L.aiTitle}</h2>
          <ul className="mt-8 space-y-3 text-[16px] text-ink/85">
            {L.aiPrinciples.map((p) => (
              <li key={p} className="grid grid-cols-[1.25rem_1fr]"><span aria-hidden className="mt-[10px] h-px w-2.5 bg-honey-deep" />{p}</li>
            ))}
          </ul>
          <p className="mt-8 text-[14px] text-ink-muted">{L.aiStatus}</p>
        </div>
        <div className="lg:col-span-7">
          <AiWorkspaceShell t={t} mode="preview" />
        </div>
      </section>

      {/* Community — photographic pair */}
      {(media.photoPair.length > 0 || showEmpty) && (
        <section aria-labelledby="community-title" className="border-t border-line bg-paper">
          <div className="mx-auto grid max-w-content gap-x-16 gap-y-10 px-5 py-20 lg:grid-cols-12 lg:px-10 lg:py-28">
            <div className="lg:col-span-4">
              <p className="t-label text-ink-muted">{t.home.communityEyebrow}</p>
              <h2 id="community-title" className="t-h2 mt-4 text-navy">{t.home.communityTitle}</h2>
              <p className="mt-5 text-ink-muted">{t.home.communityBody}</p>
            </div>
            <div className="grid grid-cols-12 items-start gap-5 lg:col-span-8">
              <MediaSlot item={media.photoPair[0] ?? null} slot="photo_pair[0]" ratio="4 / 5" showEmpty={showEmpty} className="col-span-7" />
              <MediaSlot item={media.photoPair[1] ?? null} slot="photo_pair[1]" ratio="3 / 4" showEmpty={showEmpty} className="col-span-5 mt-16" />
            </div>
          </div>
        </section>
      )}

      {/* The team */}
      <section aria-labelledby="team-title" className="on-dark bg-night text-white">
        <div className="mx-auto grid max-w-content items-center gap-x-16 gap-y-12 px-5 py-20 lg:grid-cols-12 lg:px-10 lg:py-24">
          <div className="lg:col-span-5">
            <p className="t-label text-white/50">{L.teamLabel}</p>
            <h2 id="team-title" className="t-h2 mt-4">{L.teamTitle}</h2>
            <p className="mt-6 text-white/75">{L.teamBody}</p>
            <div className="mt-9 flex flex-wrap items-center gap-x-9 gap-y-5">
              {media.filmVideo && <FilmDialog src={media.filmVideo.url} poster={media.filmPoster?.url} label={L.watchFilm} closeLabel={L.closeFilm} className="text-white" />}
              <Link href="/about" className="link-arrow text-honey">{L.teamLink}</Link>
            </div>
          </div>
          <div className="lg:col-span-7">
            <Image src="/brand/mavericks-wordmark.jpg" alt="MAVERICKS #24034" width={1600} height={638} className="w-full mix-blend-screen [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]" />
          </div>
        </div>
      </section>

      {sponsors.length > 0 && (
        <section aria-labelledby="partners-title" className="mx-auto max-w-content px-5 py-16 lg:px-10">
          <h2 id="partners-title" className="t-label text-ink-muted">{L.partnersLabel}</h2>
          <ul className="mt-8 flex flex-wrap items-center gap-x-14 gap-y-8">
            {sponsors.map((s) => (
              <li key={s.id}>
                <a href={s.url ?? undefined} rel="noopener noreferrer" target="_blank" className="block opacity-80 hover:opacity-100">
                  {/* eslint-disable-next-line @next/next/no-img-element -- storage-hosted logo */}
                  {s.logoUrl ? <img src={s.logoUrl} alt={s.name} className="h-10 w-auto object-contain" /> : <span className="text-lg font-semibold">{s.name}</span>}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
