import Link from "next/link";
import { formatDuration } from "@/lib/learn/youtube";
import type { Lesson } from "@/lib/learn/types";
import { PlayMark, YouTubeThumb } from "./YouTubeThumb";

/** Thumbnail + caption, used on /learn and the homepage. "lead" is the large editorial variant. */
export function LessonTeaser({ lesson, variant = "standard", languageLabel, headingLevel = "h3", mediaOnly = false }: {
  lesson: Lesson; variant?: "lead" | "standard" | "compact"; languageLabel: string; headingLevel?: "h2" | "h3"; mediaOnly?: boolean;
}) {
  const H = headingLevel;
  const duration = formatDuration(lesson.durationSeconds);
  const titleClass = variant === "lead" ? "t-h2 mt-5" : variant === "compact" ? "mt-3 text-[15px] font-medium leading-snug" : "mt-4 text-[17px] font-medium leading-snug tracking-[-0.01em]";
  const media = (
    <span className="relative block">
      <YouTubeThumb id={lesson.youtubeId} title={lesson.title} priority={variant === "lead"} />
      <span className={`absolute ${variant === "lead" ? "bottom-5 left-5" : "bottom-3 left-3"}`}><PlayMark size={variant === "lead" ? "lg" : "sm"} /></span>
      {duration && <span className="t-num absolute bottom-3 right-3 bg-navy/85 px-1.5 py-0.5 text-[12px] font-medium text-white">{duration}</span>}
    </span>
  );
  if (mediaOnly) return media;
  return (
    <article className="group">
      <Link href={`/learn/${lesson.slug}`} className="block" tabIndex={-1} aria-hidden>{media}</Link>
      <p className={`t-index ${variant === "lead" ? "mt-5" : "mt-3"}`}>
        {lesson.category.name} <span aria-hidden>·</span> {languageLabel}
      </p>
      <H className={titleClass}>
        <Link href={`/learn/${lesson.slug}`} className="text-ink decoration-1 underline-offset-4 group-hover:underline">{lesson.title}</Link>
      </H>
      {variant === "lead" && lesson.description && <p className="mt-3 line-clamp-3 max-w-xl text-ink-muted">{lesson.description}</p>}
    </article>
  );
}
