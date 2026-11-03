import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConnectionsSection } from "@/components/hub/ConnectionsSection";
import { AchievementsTimeline } from "@/components/hub/AchievementsTimeline";
import { EntryList } from "@/components/hub/parts";
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
  const lessons = category === "teaches" ? await listPublishedLessons(locale) : null;

  return (
    <>
      <header className="mx-auto max-w-content px-5 pt-10 lg:px-10 lg:pt-14">
        <nav aria-label="Breadcrumb" className="t-index"><Link href="/mavericks" className="hover:text-ink">MAVERICKS</Link> <span aria-hidden>/</span> <span className="t-num">{String(index + 1).padStart(2, "0")}</span></nav>
        <div className="mt-6 grid gap-x-6 gap-y-6 lg:grid-cols-12 lg:items-end">
          <h1 className="font-display text-[clamp(2.125rem,5vw,4.5rem)] font-normal leading-[1.02] tracking-[-0.04em] text-ink lg:col-span-8">
            MAVERICKS <span className="text-accent">{category.charAt(0).toUpperCase() + category.slice(1)}</span>
          </h1>
          <div className="lg:col-span-4">
            <p className="font-medium text-ink">{H.categories[category].tagline}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">{H.categories[category].description}</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-content px-5 pb-20 pt-12 lg:px-10 lg:pb-28 lg:pt-16">
        {!result.ok ? (
          <p className="text-ink-muted">{H.notConfigured}</p>
        ) : category === "connects" ? (
          <ConnectionsSection entries={entries} t={t} locale={locale} />
        ) : (
          <>
            {category === "teaches" && (
              <div className="mb-14 grid gap-x-6 gap-y-6 border-y border-rule py-8 lg:grid-cols-12 lg:items-center">
                <p className="font-display text-[clamp(1.375rem,2.4vw,2rem)] font-normal tracking-[-0.03em] text-ink lg:col-span-7">FTC Builder Academy</p>
                <p className="text-[15px] text-ink-muted lg:col-span-3">{t.learn.intro}</p>
                <Link href="/learn" className="btn-primary justify-self-start lg:col-span-2 lg:justify-self-end">{t.learn.title}{lessons?.ok ? ` · ${lessons.data.lessons.length}` : ""}</Link>
              </div>
            )}
            {entries.length === 0 ? (
              <p className="max-w-xl border-t border-line pt-6 text-ink-muted">{H.empty}</p>
            ) : category === "achieves" ? (
              <AchievementsTimeline entries={entries} t={t} locale={locale} names={names} />
            ) : (
              <EntryList entries={entries} t={t} locale={locale} names={names} />
            )}
          </>
        )}
      </div>

      <nav aria-label={H.allCategories} className="border-t border-line">
        <div className="mx-auto flex max-w-content flex-wrap items-baseline justify-between gap-6 px-5 py-10 lg:px-10">
          <Link href="/mavericks" className="link-rule text-[14px] text-ink-muted">{H.allCategories}</Link>
          <Link href={`/mavericks/${next}`} className="group text-right">
            <span className="t-index block">{String(HUB_CATEGORIES.indexOf(next) + 1).padStart(2, "0")}</span>
            <span className="font-display text-[clamp(1.25rem,2.4vw,1.875rem)] tracking-[-0.03em] text-ink group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">{categoryTitle(next)} →</span>
          </Link>
        </div>
      </nav>
      <p className="sr-only">{H.notAwards}</p>
    </>
  );
}
