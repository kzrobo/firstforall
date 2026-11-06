"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export interface CarouselItem { url: string; alt: string; caption: string | null }

/**
 * Editorial image carousel for hub entries: one image at a time on a calm neutral stage (images keep
 * their own proportions — posters, slides and photos mix), native swipe via scroll-snap, arrow
 * buttons and keyboard arrows, a counter and a thumbnail strip. Captions sit under the image, never on it.
 */
export function EntryCarousel({ items, label, labels }: {
  items: CarouselItem[]; label: string; labels: { previous: string; next: string; of: string };
}) {
  const track = useRef<HTMLDivElement>(null);
  const thumbs = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const many = items.length > 1;

  const go = useCallback((i: number) => {
    const el = track.current;
    if (!el) return;
    const n = Math.max(0, Math.min(items.length - 1, i));
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: n * el.clientWidth, behavior: smooth ? "smooth" : "auto" });
  }, [items.length]);

  // The scroll position is the single source of truth (works for swipe, buttons and thumbnails alike).
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const on = () => setIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
    el.addEventListener("scroll", on, { passive: true });
    return () => el.removeEventListener("scroll", on);
  }, []);

  // Keep the active thumbnail in view.
  useEffect(() => {
    thumbs.current?.querySelector<HTMLElement>(`[data-thumb="${index}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [index]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(index + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(index - 1); }
  };

  const current = items[index];
  const arrow = "inline-flex size-11 items-center justify-center rounded-full border border-line-strong bg-canvas text-ink transition-colors hover:border-ink disabled:opacity-35 disabled:hover:border-line-strong";

  return (
    <section aria-roledescription="carousel" aria-label={label} onKeyDown={many ? onKey : undefined} className="min-w-0">
      <div
        ref={track}
        tabIndex={many ? 0 : -1}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-[3px] bg-paper [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((it, i) => (
          <div key={it.url} role="group" aria-roledescription="slide" aria-label={`${i + 1} ${labels.of} ${items.length}`}
            className="relative aspect-[4/5] w-full shrink-0 snap-center sm:aspect-[5/4]">
            <Image src={it.url} alt={it.alt} fill priority={i === 0} loading={i === 0 ? undefined : "lazy"}
              sizes="(min-width: 1024px) 60vw, 100vw" className="object-contain p-3 sm:p-6" />
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-start justify-between gap-6">
        <p className="min-w-0 text-[15px] leading-snug text-ink-muted" aria-live="polite">
          {many && <span className="t-num mr-3 font-semibold text-ink">{index + 1} / {items.length}</span>}
          {current?.caption ?? current?.alt}
        </p>
        {many && (
          <div className="flex shrink-0 gap-2">
            <button type="button" className={arrow} onClick={() => go(index - 1)} disabled={index === 0} aria-label={labels.previous}>
              <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
            <button type="button" className={arrow} onClick={() => go(index + 1)} disabled={index === items.length - 1} aria-label={labels.next}>
              <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        )}
      </div>

      {many && (
        <div ref={thumbs} className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
          {items.map((it, i) => (
            <button key={it.url} type="button" data-thumb={i} onClick={() => go(i)} aria-label={`${i + 1} ${labels.of} ${items.length}`} aria-current={i === index ? "true" : undefined}
              className={`relative h-16 w-14 shrink-0 overflow-hidden rounded-[3px] bg-paper ring-offset-2 transition-opacity sm:h-20 sm:w-16 ${i === index ? "ring-2 ring-navy" : "opacity-60 hover:opacity-100"}`}>
              <Image src={it.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
