import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonTeaser } from "@/components/learn/LessonTeaser";
import { VideoEmbed } from "@/components/learn/VideoEmbed";
import { getI18n } from "@/i18n/server";
import { languageName } from "@/lib/languages";
import { getPublishedLesson } from "@/lib/learn/repository";
import { formatDuration, youTubeThumbnails, youTubeWatchUrl } from "@/lib/learn/youtube";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await getI18n();
  const r = await getPublishedLesson((await params).slug, locale);
  if (!r.ok || !r.data) return { title: "Lesson" };
  const l = r.data;
  return {
    title: l.title,
    description: l.description?.slice(0, 160) ?? `${l.category.name} — FTC Builder Academy by MAVERICKS`,
    openGraph: { title: l.title, type: "video.other", images: [{ url: youTubeThumbnails(l.youtubeId).hq, width: 480, height: 360 }] },
  };
}

export default async function LessonPage({ params }: Props) {
  const [{ slug }, { t, locale }] = await Promise.all([params, getI18n()]);
  const L = t.learn;
  const result = await getPublishedLesson(slug, locale);
  if (!result.ok) return <p className="mx-auto max-w-content px-5 py-20 text-ink-muted lg:px-10">{L.notConfigured}</p>;
  const lesson = result.data;
  if (!lesson) notFound();
  const related = [
    ...result.related.filter((l) => l.id !== lesson.id && l.category.id === lesson.category.id),
    ...result.related.filter((l) => l.id !== lesson.id && l.category.id !== lesson.category.id),
  ].slice(0, 3);
  const duration = formatDuration(lesson.durationSeconds);

  return (
    <article>
      <header className="mx-auto max-w-content px-5 pt-8 lg:px-10 lg:pt-12">
        <nav aria-label="Breadcrumb" className="t-index flex flex-wrap gap-x-2">
          <Link href="/learn" className="hover:text-ink">{t.nav.learn}</Link><span aria-hidden>/</span>
          <Link href={`/learn?category=${lesson.category.slug}`} className="hover:text-ink">{lesson.category.name}</Link>
        </nav>
        <h1 className="t-h1 mt-6 max-w-[24ch] text-ink">{lesson.title}</h1>
      </header>

      <div className="mx-auto mt-8 max-w-content px-0 sm:px-5 lg:mt-12 lg:px-10">
        <VideoEmbed id={lesson.youtubeId} title={lesson.title} playLabel={L.play} />
      </div>

      <div className="mx-auto grid max-w-content gap-x-6 gap-y-10 px-5 pb-20 pt-10 lg:grid-cols-12 lg:px-10 lg:pb-28 lg:pt-14">
        <div className="lg:col-span-7">
          {lesson.description ? (
            <div lang={lesson.language} className="max-w-[65ch] whitespace-pre-line text-[17px] leading-[1.7] text-ink">{lesson.description}</div>
          ) : null}
          <p className="mt-8 text-[14px] text-ink-muted">{L.originalLanguage} {L.privacy}</p>
        </div>
        <aside className="lg:col-span-4 lg:col-start-9">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 border-t border-rule text-[15px]">
            <dt className="border-b border-line py-3 text-ink-muted">{L.category}</dt>
            <dd className="border-b border-line py-3"><Link href={`/learn?category=${lesson.category.slug}`} className="link-rule text-ink">{lesson.category.name}</Link></dd>
            <dt className="border-b border-line py-3 text-ink-muted">{L.spokenLanguage}</dt>
            <dd className="border-b border-line py-3">{languageName(lesson.language, locale)}</dd>
            {duration && <><dt className="border-b border-line py-3 text-ink-muted">{L.duration}</dt><dd className="t-num border-b border-line py-3">{duration}</dd></>}
          </dl>
          <a href={youTubeWatchUrl(lesson.youtubeId)} target="_blank" rel="noopener noreferrer" className="link-arrow mt-6 text-[15px] text-ink">{L.watchOnYouTube}</a>
        </aside>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="border-t border-line bg-paper">
          <div className="mx-auto max-w-content px-5 py-16 lg:px-10 lg:py-20">
            <div className="flex items-baseline justify-between gap-6">
              <h2 id="related-title" className="t-h3 text-ink">{L.related}</h2>
              <Link href="/learn" className="link-arrow text-[14px] text-ink">{L.back}</Link>
            </div>
            <ul className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((l) => <li key={l.id}><LessonTeaser lesson={l} languageLabel={languageName(l.language, locale)} /></li>)}
            </ul>
          </div>
        </section>
      )}
    </article>
  );
}
