import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VideoEmbed } from "@/components/learn/VideoEmbed";
import { EntryMeta } from "@/components/hub/parts";
import { TeamGallery } from "@/components/media/TeamGallery";
import { getI18n } from "@/i18n/server";
import { CATEGORY_SECTIONS, categoryTitle, isHubCategory } from "@/lib/hub/categories";
import { countryName } from "@/lib/hub/countries";
import { getPublishedEntry } from "@/lib/hub/repository";
import type { MediaItem } from "@/lib/site/repository";

type Props = { params: Promise<{ category: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, slug } = await params;
  if (!isHubCategory(category)) return {};
  const r = await getPublishedEntry(category, slug);
  if (!r.ok || !r.data) return { title: categoryTitle(category) };
  const e = r.data.entry;
  return { title: `${e.title} · ${categoryTitle(category)}`, description: e.summary ?? e.subtitle ?? undefined, openGraph: e.coverUrl ? { images: [e.coverUrl] } : undefined };
}

export default async function EntryPage({ params }: Props) {
  const { category, slug } = await params;
  if (!isHubCategory(category)) notFound();
  const [{ t, locale }, result] = await Promise.all([getI18n(), getPublishedEntry(category, slug)]);
  if (!result.ok) return <p className="mx-auto max-w-content px-5 py-20 text-ink-muted lg:px-10">{t.hub.notConfigured}</p>;
  if (!result.data) notFound();
  const { entry: e, related } = result.data;
  const F = t.hub.fields;
  const country = countryName(e.countryCode, locale);
  const toItems = (kind: "photo" | "screenshot", aspect: number): MediaItem[] =>
    e.media.filter((m) => m.kind === kind).map((m) => ({ url: m.url, alt: m.alt, caption: m.caption, focus: "50% 50%", focusMobile: "50% 50%", layout: "standard", aspect }));
  const photos = toItems("photo", 3 / 2);
  const screenshots = toItems("screenshot", 16 / 9);
  const sections = (CATEGORY_SECTIONS[category] as readonly (keyof typeof e.sections)[]).filter((k) => e.sections[k]);

  return (
    <article>
      <header className="mx-auto max-w-content px-5 pt-10 lg:px-10 lg:pt-16">
        <nav aria-label="Breadcrumb" className="t-index">
          <Link href="/mavericks" className="hover:text-ink">MAVERICKS</Link> <span aria-hidden>/</span>{" "}
          <Link href={`/mavericks/${category}`} className="hover:text-ink">{categoryTitle(category)}</Link>
        </nav>
        <div className="mt-8 grid gap-x-6 gap-y-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            {category === "connects" && e.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- partner team logo from storage
              <img src={e.logoUrl} alt={`${e.teamName ?? e.title} logo`} className="mb-6 size-16 rounded-full bg-white object-contain p-1 ring-1 ring-line" />
            )}
            <h1 className="t-h1 max-w-[20ch] text-ink">{e.title}</h1>
            {e.subtitle && <p className="t-lead mt-4 max-w-2xl text-ink-muted">{e.subtitle}</p>}
          </div>
          <div className="lg:col-span-4"><EntryMeta e={e} t={t} locale={locale} countryName={country} /></div>
        </div>
      </header>

      {e.coverUrl && (
        <div className="mx-auto mt-10 max-w-content sm:px-5 lg:mt-14 lg:px-10">
          <div className="relative aspect-[3/2] overflow-hidden bg-soft sm:rounded-[3px] lg:aspect-[21/9]">
            <Image src={e.coverUrl} alt="" fill priority sizes="(min-width: 1440px) 1360px, 100vw" className="object-cover" />
          </div>
        </div>
      )}

      <div className="mx-auto max-w-content px-5 py-16 lg:px-10 lg:py-24">
        <div className="grid gap-x-6 gap-y-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            {e.summary && <p className="text-[clamp(1.125rem,1.7vw,1.4375rem)] leading-[1.55] tracking-[-0.01em] text-ink">{e.summary}</p>}
            <div className="mt-12 space-y-10">
              {sections.map((k) => (
                <section key={k} className="grid gap-x-6 gap-y-3 border-t border-line pt-5 md:grid-cols-8">
                  <h2 className="t-h3 text-ink md:col-span-2">{t.hub.sections[k]}</h2>
                  <p className="whitespace-pre-line text-[16px] leading-[1.75] text-ink-muted md:col-span-6">{e.sections[k]}</p>
                </section>
              ))}
            </div>
          </div>
          <aside className="space-y-10 lg:col-span-3 lg:col-start-10">
            {(e.teamName || e.teamNumber || country) && category === "connects" && (
              <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5 border-t border-ink pt-4 text-[15px]">
                {e.teamName && <><dt className="text-ink-muted">{F.team}</dt><dd className="text-ink">{e.teamName}</dd></>}
                {e.teamNumber && <><dt className="text-ink-muted">{F.ftcNumber}</dt><dd className="t-num text-ink">#{e.teamNumber}</dd></>}
                {country && <><dt className="text-ink-muted">{F.location}</dt><dd className="text-ink">{[e.city, country].filter(Boolean).join(", ")}</dd></>}
              </dl>
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
            {e.collaborators.length > 0 && (
              <div>
                <h2 className="t-label text-ink">{F.collaborators}</h2>
                <ul className="mt-3 space-y-1.5 text-[16px] text-ink">{e.collaborators.map((c) => <li key={c}>{c}</li>)}</ul>
              </div>
            )}
          </aside>
        </div>

        {e.videoId && (
          <section aria-label={F.video} className="mt-16 lg:mt-24">
            <h2 className="t-h3 mb-5 text-ink">{F.video}</h2>
            <VideoEmbed id={e.videoId} title={e.title} playLabel={t.learn.play} />
          </section>
        )}
        {screenshots.length > 0 && (
          <section aria-label={F.screenshots} className="mt-16 lg:mt-24">
            <h2 className="t-h3 mb-5 text-ink">{F.screenshots}</h2>
            <TeamGallery items={screenshots} showEmpty={false} />
          </section>
        )}
        {photos.length > 0 && (
          <section aria-label={F.photos} className="mt-16 lg:mt-24">
            <h2 className="t-h3 mb-5 text-ink">{F.photos}</h2>
            <TeamGallery items={photos} showEmpty={false} />
          </section>
        )}
      </div>

      <footer className="border-t border-line">
        <div className="mx-auto grid max-w-content gap-x-6 gap-y-8 px-5 py-12 lg:grid-cols-12 lg:px-10">
          {related.length > 0 && (
            <div className="lg:col-span-8">
              <h2 className="t-label text-ink">{F.related}</h2>
              <ul className="mt-3 border-t border-line">
                {related.map((r) => (
                  <li key={r.id} className="border-b border-line">
                    <Link href={`/mavericks/${r.category}/${r.slug}`} className="group flex items-baseline justify-between gap-6 py-4">
                      <span className="text-[17px] font-semibold tracking-[-0.015em] text-ink group-hover:underline group-hover:underline-offset-4">{r.title}</span>
                      <span className="text-[14px] text-ink-muted">{categoryTitle(r.category)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Link href={`/mavericks/${category}`} className="link-arrow self-end text-[15px] text-ink lg:col-span-4 lg:col-start-9 lg:justify-self-end">{F.back} {categoryTitle(category)}</Link>
        </div>
      </footer>
    </article>
  );
}
