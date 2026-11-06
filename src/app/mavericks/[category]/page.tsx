import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConnectionsSection } from "@/components/hub/ConnectionsSection";
import { AchievementsTimeline } from "@/components/hub/AchievementsTimeline";
import { HubNav } from "@/components/hub/HubNav";
import { EntryList } from "@/components/hub/parts";
import { ProjectGallery } from "@/components/hub/ProjectGallery";
import { toGalleryItems } from "@/lib/hub/gallery";
import { getI18n } from "@/i18n/server";
import { HUB_CATEGORIES, categoryTitle, isHubCategory } from "@/lib/hub/categories";
import { countryName } from "@/lib/hub/countries";
import { listCategory } from "@/lib/hub/repository";
import { listPublishedLessons } from "@/lib/learn/repository";

type Props = { params: Promise<{ category: string }> };

export function generateStaticParams() {
  return HUB_CATEGORIES.map((category) => ({ category }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  if (!isHubCategory(category)) return {};
  const { t } = await getI18n();
  return { title: categoryTitle(category), description: t.hub.categories[category].description };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  if (!isHubCategory(category)) notFound();
  const [{ t, locale }, result] = await Promise.all([getI18n(), listCategory(category)]);
  const H = t.hub;
  const entries = result.ok ? result.data : [];
  const names = Object.fromEntries(entries.map((e) => [e.id, countryName(e.countryCode, locale)]));
  const index = HUB_CATEGORIES.indexOf(category);
  const next = HUB_CATEGORIES[(index + 1) % HUB_CATEGORIES.length];
  const gallery = toGalleryItems(entries, (e) => `/mavericks/${e.category}/${e.slug}`);
  const showGallery = result.ok && category !== "connects" && category !== "achieves" && gallery.length >= 2;
  const lessons = category === "teaches" ? await listPublishedLessons(locale) : null;

  return (
    <>
      <HubNav t={t} current={category} />
      <header className="mx-auto max-w-content px-5 pt-12 lg:px-10 lg:pt-20">
        <div className="grid gap-x-6 gap-y-6 lg:grid-cols-12 lg:items-end">
          <h1 className="t-h1 text-ink lg:col-span-7">{categoryTitle(category)}</h1>
          <div className="lg:col-span-4 lg:col-start-9">
            <p className="text-[18px] font-semibold tracking-[-0.015em] text-ink">{H.categories[category].tagline}</p>
            <p className="mt-2 text-[17px] leading-relaxed text-ink-muted">{H.categories[category].description}</p>
          </div>
        </div>
      </header>

      <div className={`mx-auto max-w-content px-5 lg:px-10 ${showGallery ? "pt-10 lg:pt-12" : "pb-20 pt-12 lg:pb-28 lg:pt-16"}`}>
        {!result.ok ? (
          <p className="text-ink-muted">{H.notConfigured}</p>
        ) : category === "connects" ? (
          <ConnectionsSection entries={entries} t={t} locale={locale} />
        ) : (
          <>
            {category === "teaches" && (
              <div className="mb-14 grid gap-x-6 gap-y-6 rounded-[3px] bg-paper p-7 lg:grid-cols-12 lg:items-center lg:p-10">
                <p className="t-h2 text-ink lg:col-span-5">FTC Builder Academy</p>
                <p className="text-[16px] leading-relaxed text-ink-muted lg:col-span-4">{t.learn.intro}</p>
                <Link href="/learn" className="btn-primary justify-self-start lg:col-span-3 lg:justify-self-end">{t.learn.title}{lessons?.ok ? ` · ${lessons.data.lessons.length}` : ""}</Link>
              </div>
            )}
            {entries.length === 0 ? (
              <div className="grid gap-x-6 border-t border-ink pt-8 lg:grid-cols-12"><p className="max-w-xl text-[18px] leading-relaxed text-ink-muted lg:col-span-6">{H.empty}</p></div>
            ) : category === "achieves" ? (
              <AchievementsTimeline entries={entries} t={t} locale={locale} names={names} />
            ) : showGallery ? null : (
              <EntryList entries={entries} t={t} locale={locale} names={names} />
            )}
          </>
        )}
      </div>

      {showGallery && (
        <div className="pb-20 lg:pb-28">
          <ProjectGallery items={gallery} label={H.categories[category].tagline}
            labels={{ previous: H.galleryPrev, next: H.galleryNext, open: H.galleryOpen, hint: H.galleryHint, hintTouch: H.galleryHintTouch, of: H.imageOf }} />
        </div>
      )}

      <nav aria-label={H.allCategories} className="border-t border-line">
        <div className="mx-auto flex max-w-content flex-wrap items-baseline justify-between gap-6 px-5 py-10 lg:px-10">
          <Link href="/mavericks" className="link-rule text-[15px] text-ink-muted">{H.allCategories}</Link>
          <Link href={`/mavericks/${next}`} className="group text-right">
            <span className="t-index block">{H.next}</span>
            <span className="text-[clamp(1.375rem,2.4vw,1.875rem)] font-semibold tracking-[-0.025em] text-ink group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">{categoryTitle(next)} →</span>
          </Link>
        </div>
      </nav>
      <p className="sr-only">{H.notAwards}</p>
    </>
  );
}
