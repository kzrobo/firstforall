import type { Metadata } from "next";
import Link from "next/link";
import { LessonTeaser } from "@/components/learn/LessonTeaser";
import { getI18n } from "@/i18n/server";
import { plural } from "@/i18n/plural";
import { languageName } from "@/lib/languages";
import { listPublishedLessons } from "@/lib/learn/repository";
import type { Lesson, LessonCategory } from "@/lib/learn/types";
import { formatDuration } from "@/lib/learn/youtube";

export const metadata: Metadata = {
  title: "Learn — FTC Builder Academy",
  description: "Practical FTC robotics video lessons by MAVERICKS FTC #24034: FTC basics, CAD & design, robot building and programming.",
};

type Props = { searchParams: Promise<{ category?: string | string[] }> };

export default async function LearnPage({ searchParams }: Props) {
  const [{ t, locale }, sp] = await Promise.all([getI18n(), searchParams]);
  const L = t.learn;
  const result = await listPublishedLessons(locale);
  const lessons = result.ok ? result.data.lessons : [];
  const categories = result.ok ? result.data.categories : [];
  const slug = Array.isArray(sp.category) ? sp.category[0] : sp.category;
  const active = categories.find((c) => c.slug === slug) ?? null;
  const visible = active ? lessons.filter((l) => l.category.id === active.id) : lessons;
  const featured = visible.find((l) => l.isFeatured) ?? null;
  const count = (c: LessonCategory | null) => (c ? lessons.filter((l) => l.category.id === c.id).length : lessons.length);
  const lang = (l: Lesson) => languageName(l.language, locale);

  const rest = visible.filter((l) => l.id !== featured?.id);
  const grouped = !active && lessons.length > 6;

  return (
    <>
      {/* Header: title and intro beside the featured lesson (or the programme while nothing is published) */}
      <header className="mx-auto max-w-content px-5 pt-14 lg:px-10 lg:pt-24">
        <div className="grid gap-x-6 gap-y-10 lg:grid-cols-12 lg:items-end">
          <div className={featured ? "lg:col-span-5" : "lg:col-span-7"}>
            <p className="t-index">{L.kicker}</p>
            <h1 className="t-h1 mt-3 text-ink">{L.title}</h1>
            <p className="t-lead mt-6 max-w-md text-ink-muted">{L.intro}</p>
            {featured && (
              <div className="mt-10 border-t border-line pt-6">
                <p className="t-index">{L.featured}</p>
                <h2 id="featured-lesson" className="t-h2 mt-3 text-ink"><Link href={`/learn/${featured.slug}`} className="hover:underline hover:decoration-1 hover:underline-offset-4">{featured.title}</Link></h2>
                <p className="t-meta mt-3">
                  {featured.category.name} · {lang(featured)}{featured.durationSeconds ? <> · <span className="t-num">{formatDuration(featured.durationSeconds)}</span></> : null}
                </p>
              </div>
            )}
          </div>
          {featured && (
            <Link href={`/learn/${featured.slug}`} className="group block lg:col-span-7" aria-labelledby="featured-lesson">
              <LessonTeaserMedia lesson={featured} />
            </Link>
          )}
        </div>

        {/* Category filter: real links (shareable, work without JavaScript) */}
        <nav aria-label={L.categories} className="mt-14 lg:mt-20">
          <ul className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:px-0">
            {[null, ...categories].map((c) => {
              const on = (c?.id ?? null) === (active?.id ?? null);
              return (
                <li key={c?.id ?? "all"} className="shrink-0">
                  <Link
                    href={c ? `/learn?category=${c.slug}` : "/learn"}
                    aria-current={on ? "page" : undefined}
                    scroll={false}
                    className={`flex h-10 items-center gap-2 rounded-full border px-4 text-[15px] transition-colors ${on ? "border-navy bg-navy font-medium text-white" : "border-line text-ink hover:border-ink"}`}
                  >
                    {c ? c.name : L.all}
                    <span className={`t-num text-[14px] ${on ? "text-white/75" : "text-ink-muted"}`}>{count(c)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <div className="mx-auto max-w-content px-5 pb-24 pt-10 lg:px-10 lg:pb-32 lg:pt-12">
        {!result.ok ? (
          <p className="text-ink-muted">{L.notConfigured}</p>
        ) : lessons.length === 0 ? (
          <EmptyProgramme t={t} categories={categories} />
        ) : visible.length === 0 ? (
          <p className="text-ink-muted">{L.emptyCategory} <Link href="/learn" className="link-rule text-ink">{L.all}</Link></p>
        ) : grouped ? (
          categories.map((c) => {
            const inCat = rest.filter((l) => l.category.id === c.id);
            if (!inCat.length) return null;
            return (
              <section key={c.id} aria-labelledby={`cat-${c.slug}`} className="pt-14 first:pt-0 lg:pt-20">
                <div className="flex items-baseline justify-between gap-6 border-t border-line pt-5">
                  <h2 id={`cat-${c.slug}`} className="text-[22px] font-semibold tracking-[-0.02em] text-ink">{c.name}</h2>
                  <Link href={`/learn?category=${c.slug}`} className="link-arrow shrink-0 text-[15px] text-ink" scroll={false}>{inCat.length} {plural(locale, inCat.length, { one: L.lesson, few: L.lessonsFew, many: L.lessons })}</Link>
                </div>
                <LessonGrid lessons={inCat} lang={lang} newLabel={L.newLesson} />
              </section>
            );
          })
        ) : rest.length > 0 ? (
          <LessonGrid lessons={rest} lang={lang} newLabel={L.newLesson} />
        ) : null}
      </div>
    </>
  );
}

function LessonTeaserMedia({ lesson }: { lesson: Lesson }) {
  // Reuses the teaser's media (thumbnail, play mark, duration) at full width.
  return <LessonTeaser lesson={lesson} variant="lead" languageLabel="" headingLevel="h3" mediaOnly />;
}

function LessonGrid({ lessons, lang, newLabel }: { lessons: Lesson[]; lang: (l: Lesson) => string; newLabel: string }) {
  return (
    <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 [&:not(:first-child)]:mt-8">
      {lessons.map((l) => <li key={l.id}><LessonTeaser lesson={l} languageLabel={lang(l)} newLabel={newLabel} /></li>)}
    </ul>
  );
}

function EmptyProgramme({ t, categories }: { t: Awaited<ReturnType<typeof getI18n>>["t"]; categories: LessonCategory[] }) {
  return (
    <div className="grid gap-x-6 gap-y-12 lg:grid-cols-12">
      <p className="max-w-sm text-ink-muted lg:col-span-3">{t.learn.empty}</p>
      <ol className="border-t border-rule lg:col-span-5 lg:col-start-5">
        {categories.map((c) => (
          <li key={c.id} className="border-b border-line py-5">
            <span className="text-[clamp(1.25rem,2vw,1.5rem)] font-semibold tracking-[-0.02em] text-ink">{c.name}</span>
          </li>
        ))}
      </ol>
      <div className="lg:col-span-3 lg:col-start-10">
        <h2 className="t-label text-ink">{t.learn.plannedTitle}</h2>
        <ul className="mt-3 space-y-1.5 text-[15px]">{t.learn.planned.map((p) => <li key={p}>{p}</li>)}</ul>
      </div>
    </div>
  );
}
