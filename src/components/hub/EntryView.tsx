import Link from "next/link";
import { VideoEmbed } from "@/components/learn/VideoEmbed";
import { EntryCarousel, type CarouselItem } from "@/components/hub/EntryCarousel";
import { EntryMeta } from "@/components/hub/parts";
import { TeamGallery } from "@/components/media/TeamGallery";
import type { Dictionary } from "@/i18n/dictionary";
import { CATEGORY_SECTIONS, categoryTitle } from "@/lib/hub/categories";
import type { HubEntry } from "@/lib/hub/types";
import type { MediaItem } from "@/lib/site/repository";

/**
 * One MAVERICKS hub entry (project, event, collaboration). Photos and graphics play in an editorial
 * carousel with the concise description beside it; the full story sections follow. Shared by the
 * public page and the team draft preview, so a preview is exactly what will be published.
 */
export function EntryView({ e, related, t, locale, country, preview = false }: {
  e: HubEntry; related: HubEntry[]; t: Dictionary; locale: string; country: string | null; preview?: boolean;
}) {
  const F = t.hub.fields;
  const category = e.category;
  const sections = (CATEGORY_SECTIONS[category] as readonly (keyof typeof e.sections)[]).filter((k) => e.sections[k]);
  const visual: CarouselItem[] = e.media.filter((m) => m.kind !== "screenshot").map((m) => ({ url: m.url, alt: m.alt, caption: m.caption }));
  const slides: CarouselItem[] = visual.length ? visual : e.coverUrl ? [{ url: e.coverUrl, alt: e.title, caption: null }] : [];
  const screenshots: MediaItem[] = e.media.filter((m) => m.kind === "screenshot")
    .map((m) => ({ url: m.url, alt: m.alt, caption: m.caption, focus: "50% 50%", focusMobile: "50% 50%", layout: "standard", aspect: 16 / 9 }));
  const hrefFor = (r: HubEntry) => (preview ? `/admin/hub/${r.id}/preview` : `/mavericks/${r.category}/${r.slug}`);

  const facts = (
    <>
      {(e.teamName || e.teamNumber || country) && category === "connects" && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5 border-t border-ink pt-4 text-[15px]">
          {e.teamName && <><dt className="text-ink-muted">{F.team}</dt><dd className="text-ink">{e.teamName}</dd></>}
          {e.teamNumber && <><dt className="text-ink-muted">{F.ftcNumber}</dt><dd className="t-num text-ink">#{e.teamNumber}</dd></>}
          {country && <><dt className="text-ink-muted">{F.location}</dt><dd className="text-ink">{[e.city, country].filter(Boolean).join(", ")}</dd></>}
        </dl>
      )}
      {e.collaborators.length > 0 && (
        <div>
          <h2 className="t-label text-ink">{F.collaborators}</h2>
          <ul className="mt-3 space-y-1.5 text-[16px] text-ink">{e.collaborators.map((c) => <li key={c}>{c}</li>)}</ul>
        </div>
      )}
      {e.milestones.length > 0 && (
        <div>
          <h2 className="t-label text-ink">{F.milestones}</h2>
          <ol className="mt-4 border-l border-rule pl-5">
            {e.milestones.map((m, i) => (
              <li key={i} className="relative pb-5 last:pb-0">
                <span aria-hidden className="absolute -left-[24.5px] top-2 size-2 rounded-full bg-navy ring-4 ring-canvas" />
                <p className="t-num text-[14px] text-ink-muted">{m.date}</p>
                <p className="text-[16px] leading-snug text-ink">{m.label}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </>
  );
  const hasFacts = e.collaborators.length > 0 || e.milestones.length > 0 || (category === "connects" && Boolean(e.teamName || e.teamNumber || country));

  // The written side of the spread: name, category, introduction, the category's story sections, facts.
  const story = (
    <div className="min-w-0">
      <nav aria-label="Breadcrumb" className="t-meta">
        <Link href="/mavericks" className="hover:text-ink">MAVERICKS</Link> <span aria-hidden>/</span>{" "}
        <Link href={`/mavericks/${category}`} className="hover:text-ink">{categoryTitle(category)}</Link>
      </nav>
      {category === "connects" && e.logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- partner team logo from storage
        <img src={e.logoUrl} alt={`${e.teamName ?? e.title} logo`} className="mt-6 size-16 rounded-full bg-white object-contain p-1 ring-1 ring-line" />
      )}
      <h1 className="font-display mt-4 max-w-[18ch] text-[clamp(1.875rem,2.9vw,2.75rem)] font-medium leading-[1.06] tracking-[-0.035em] text-ink">{e.title}</h1>
      {e.subtitle && <p className="mt-4 max-w-xl text-[clamp(1.0625rem,1.3vw,1.1875rem)] leading-relaxed text-ink-muted">{e.subtitle}</p>}
      <div className="mt-5 empty:hidden"><EntryMeta e={e} t={t} locale={locale} countryName={country} /></div>
      {e.summary && <p className="mt-8 max-w-[40rem] text-[17px] leading-[1.7] text-ink">{e.summary}</p>}
      {sections.length > 0 && (
        <div className="mt-10 max-w-[40rem] space-y-7">
          {sections.map((k) => (
            <section key={k} className="border-t border-line pt-5">
              <h2 className="t-label text-ink">{t.hub.sections[k]}</h2>
              <p className="mt-2.5 whitespace-pre-line text-[16px] leading-[1.75] text-ink-muted">{e.sections[k]}</p>
            </section>
          ))}
        </div>
      )}
      {hasFacts && <div className="mt-10 max-w-[40rem] space-y-10">{facts}</div>}
    </div>
  );

  return (
    <article>
      {preview && <p role="status" className="border-b border-line bg-mist px-5 py-3 text-center text-[15px] font-medium text-navy lg:px-10">{t.hub.draftPreview}</p>}
      <div className="mx-auto max-w-content px-5 pb-16 pt-8 lg:px-10 lg:pb-24 lg:pt-14">
        {slides.length > 0 ? (
          // Desktop: the project's own carousel on the left, its story on the right. Phone: carousel first.
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16">
            <EntryCarousel items={slides} className="lg:sticky lg:top-24 lg:max-w-[58%] lg:flex-none" label={`${e.title} — ${t.hub.images}`}
              labels={{ previous: t.hub.previousImage, next: t.hub.nextImage, of: t.hub.imageOf }} />
            <div className="min-w-0 flex-1 lg:pt-2">{story}</div>
          </div>
        ) : (
          <div className="max-w-3xl">{story}</div>
        )}
      </div>

      {(e.videoId || screenshots.length > 0) && (
        <div className="mx-auto max-w-content px-5 pb-16 lg:px-10 lg:pb-24">
          {e.videoId && (
            <section aria-label={F.video}>
              <h2 className="t-h3 mb-5 text-ink">{F.video}</h2>
              <VideoEmbed id={e.videoId} title={e.title} playLabel={t.learn.play} />
            </section>
          )}
          {screenshots.length > 0 && (
            <section aria-label={F.screenshots} className={e.videoId ? "mt-16 lg:mt-24" : ""}>
              <h2 className="t-h3 mb-5 text-ink">{F.screenshots}</h2>
              <TeamGallery items={screenshots} showEmpty={false} />
            </section>
          )}
        </div>
      )}

      <footer className="border-t border-line">
        <div className="mx-auto grid max-w-content gap-x-6 gap-y-8 px-5 py-12 lg:grid-cols-12 lg:px-10">
          {related.length > 0 && (
            <div className="lg:col-span-8">
              <h2 className="t-label text-ink">{F.related}</h2>
              <ul className="mt-3 border-t border-line">
                {related.map((r) => (
                  <li key={r.id} className="border-b border-line">
                    <Link href={hrefFor(r)} className="group flex items-baseline justify-between gap-6 py-4">
                      <span className="text-[17px] font-semibold tracking-[-0.015em] text-ink group-hover:underline group-hover:underline-offset-4">{r.title}</span>
                      <span className="text-[14px] text-ink-muted">{categoryTitle(r.category)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Link href={preview ? "/admin/hub" : `/mavericks/${category}`} className="link-arrow self-end text-[15px] text-ink lg:col-span-4 lg:col-start-9 lg:justify-self-end">
            {preview ? "MAVERICKS hub · Admin" : `${F.back} ${categoryTitle(category)}`}
          </Link>
        </div>
      </footer>
    </article>
  );
}
