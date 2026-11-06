"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export interface CarouselItem { url: string; alt: string; caption: string | null }

const DEFAULT_RATIO = 0.8;
const clampRatio = (r: number) => Math.max(0.5, Math.min(1.8, r));

/**
 * A project's own image carousel (detail pages). The stage takes the proportions of the project's
 * first image, so a set of slides or posters fills it exactly; an image with other proportions is
 * shown whole on the plain page background — never cropped, never padded with invented colour.
 * Native swipe via scroll-snap, mouse drag, arrow buttons, keyboard arrows, counter and thumbnails.
 * Captions sit under the image, never on it.
 */
export function EntryCarousel({ items, label, labels, className = "" }: {
  items: CarouselItem[]; label: string; labels: { previous: string; next: string; of: string }; className?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const thumbs = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [ratios, setRatios] = useState<(number | null)[]>(() => items.map(() => null));
  const many = items.length > 1;
  const stage = clampRatio(ratios[0] ?? DEFAULT_RATIO);

  const go = useCallback((i: number) => {
    const el = track.current;
    if (!el) return;
    const n = Math.max(0, Math.min(items.length - 1, i));
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: n * el.clientWidth, behavior: smooth ? "smooth" : "auto" });
  }, [items.length]);

  // The scroll position is the single source of truth (swipe, drag, buttons and thumbnails alike).
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const on = () => setIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
    el.addEventListener("scroll", on, { passive: true });
    // Mouse drag: snapping pauses while dragging; the release settles one image in the drag direction.
    let drag: { x: number; scroll: number; from: number; moved: boolean; id: number } | null = null;
    const down = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0 || !many) return;
      drag = { x: e.clientX, scroll: el.scrollLeft, from: Math.round(el.scrollLeft / Math.max(1, el.clientWidth)), moved: false, id: e.pointerId };
    };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 5) { drag.moved = true; el.setPointerCapture(drag.id); el.dataset.dragging = ""; }
      if (drag.moved) el.scrollLeft = drag.scroll - dx;
    };
    const up = (e: PointerEvent) => {
      if (!drag) return;
      const d = drag;
      drag = null;
      if (!d.moved) return;
      if (el.hasPointerCapture(d.id)) el.releasePointerCapture(d.id);
      const dx = e.clientX - d.x;
      const target = Math.max(0, Math.min(items.length - 1, d.from + (Math.abs(dx) > 40 ? (dx < 0 ? 1 : -1) : 0)));
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollTo({ left: target * el.clientWidth, behavior: smooth ? "smooth" : "auto" });
      let done = false;
      const resume = () => { if (done) return; done = true; delete el.dataset.dragging; el.removeEventListener("scrollend", resume); };
      el.addEventListener("scrollend", resume);
      setTimeout(resume, 900);
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("scroll", on);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [items.length, many]);

  // Keep the active thumbnail in view without moving the page.
  useEffect(() => {
    const strip = thumbs.current, th = strip?.querySelector<HTMLElement>(`[data-thumb="${index}"]`);
    if (strip && th) {
      const l = th.offsetLeft, r = l + th.offsetWidth;
      if (l < strip.scrollLeft) strip.scrollLeft = l - 4;
      else if (r > strip.scrollLeft + strip.clientWidth) strip.scrollLeft = r - strip.clientWidth + 4;
    }
  }, [index]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(index + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(index - 1); }
  };

  const current = items[index];
  const arrow = "inline-flex size-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-soft disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <section aria-roledescription="carousel" aria-label={label} onKeyDown={many ? onKey : undefined}
      className={`ec-root min-w-0 ${className}`} style={{ "--ar": stage } as React.CSSProperties}>
      <div ref={track} tabIndex={many ? 0 : -1} className="ec-track">
        {items.map((it, i) => {
          const r = ratios[i];
          const fits = r !== null && Math.abs(r - stage) / stage < 0.03;
          return (
            <div key={it.url} role="group" aria-roledescription="slide" aria-label={`${i + 1} ${labels.of} ${items.length}`} className="ec-slide">
              <Image src={it.url} alt={it.alt} fill priority={i === 0} loading={i === 0 ? undefined : "lazy"} draggable={false}
                sizes="(min-width: 1024px) 50vw, 100vw" className={fits ? "object-cover" : "object-contain"}
                onLoad={(e) => {
                  const img = e.currentTarget, ratio = img.naturalWidth / img.naturalHeight;
                  if (ratio) setRatios((prev) => (prev[i] === ratio ? prev : prev.map((v, j) => (j === i ? ratio : v))));
                }} />
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-start justify-between gap-6">
        <p className="min-w-0 pt-2 text-[15px] leading-snug text-ink-muted" aria-live="polite">{current?.caption ?? current?.alt}</p>
        {many && (
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" className={arrow} onClick={() => go(index - 1)} disabled={index === 0} aria-label={labels.previous}>
              <svg aria-hidden viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
            <span className="t-num min-w-[4.5rem] text-center text-[15px] text-ink-muted" aria-hidden>
              <span className="font-semibold text-ink">{String(index + 1).padStart(2, "0")}</span> / {String(items.length).padStart(2, "0")}
            </span>
            <button type="button" className={arrow} onClick={() => go(index + 1)} disabled={index === items.length - 1} aria-label={labels.next}>
              <svg aria-hidden viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        )}
      </div>

      {many && (
        <div ref={thumbs} className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 pt-1 [scrollbar-width:thin]">
          {items.map((it, i) => (
            <button key={it.url} type="button" data-thumb={i} onClick={() => go(i)} aria-label={`${i + 1} ${labels.of} ${items.length}`} aria-current={i === index ? "true" : undefined}
              className={`relative h-16 w-12 shrink-0 overflow-hidden rounded-[2px] bg-soft ring-offset-2 transition-opacity sm:h-[72px] sm:w-14 ${i === index ? "ring-2 ring-navy" : "opacity-55 hover:opacity-100"}`}>
              <Image src={it.url} alt="" fill sizes="56px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
