"use client";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { GalleryItem } from "@/lib/hub/gallery";

/**
 * Center-focused project carousel: one horizontal row, the selected project in the middle at full
 * size, its neighbours smaller and quieter on either side. Every frame takes its image's own
 * proportions, so posters and photographs are shown whole — nothing is cropped or padded with
 * invented colour.
 *
 * Scrolling is native (CSS scroll-snap, one project per gesture), so trackpads, touch and keyboard
 * behave as expected and vertical page scrolling is never captured. Mouse dragging is added on top, and
 * a horizontal trackpad gesture moves exactly one project.
 * Scale, opacity and spacing follow the scroll position continuously: a scroll listener writes
 * transforms straight to each frame's inner layer (snap points stay on the untransformed frames) — React re-renders only when the selected project changes.
 * Reduced motion: no scaling or smooth scrolling; neighbours are simply dimmed.
 */

const SIDE_SCALE = 0.84;   // immediate neighbours
const SIDE_OPACITY = 0.7;  // immediate neighbours
const FAR_OPACITY = 0.5;   // two or more away (mostly off-screen)
const DEFAULT_RATIO = 0.8; // until an image has loaded: the common 4:5 poster
const MIN_RATIO = 0.5, MAX_RATIO = 1.8; // outside this range a frame is clamped and the image contained

const ease = (t: number) => t * t * (3 - 2 * t);
const clampRatio = (r: number) => Math.max(MIN_RATIO, Math.min(MAX_RATIO, r));

export function ProjectGallery({ items, label, labels, compact = false }: {
  items: GalleryItem[];
  label: string;
  /** Smaller stage for use inside a page section (homepage) */
  compact?: boolean;
  labels: { previous: string; next: string; open: string; hint: string; hintTouch: string; of: string };
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const frames = useRef<(HTMLLIElement | null)[]>([]);
  const scales = useRef<(HTMLDivElement | null)[]>([]); // the transformed layer inside each frame
  const links = useRef<(HTMLAnchorElement | null)[]>([]);
  // Open with a project on either side of the selection when there are enough of them.
  const first = items.length >= 3 ? 1 : 0;
  const [active, setActive] = useState(first);
  const activeRef = useRef(first);
  const [ratios, setRatios] = useState<(number | null)[]>(() => items.map(() => null));
  const [mode, setMode] = useState({ reduced: false, touch: false });
  const update = useRef<() => void>(() => {});
  const suppressClick = useRef(false);
  const hintId = useId();

  const select = useCallback((i: number) => {
    if (i === activeRef.current) return;
    activeRef.current = i;
    setActive(i);
  }, []);

  useEffect(() => {
    const q = { reduced: matchMedia("(prefers-reduced-motion: reduce)"), touch: matchMedia("(hover: none)") };
    const read = () => setMode({ reduced: q.reduced.matches, touch: q.touch.matches });
    read();
    Object.values(q).forEach((m) => m.addEventListener("change", read));
    return () => Object.values(q).forEach((m) => m.removeEventListener("change", read));
  }, []);

  // Layout → visual state. Runs on scroll (at most once per frame), resize and image load.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let raf = 0;
    let box: { a: number; w: number }[] = [];
    let gap = 0;
    const measure = () => {
      box = frames.current.map((f) => (f ? { a: f.offsetLeft, w: f.offsetWidth } : { a: 0, w: 0 }));
      gap = box.length > 1 ? box[1].a - box[0].a - box[0].w : 0;
    };

    const paint = () => {
      raf = 0;
      const L = el.scrollLeft + el.clientWidth / 2; // the centre line, in track coordinates
      let nearest = 0, best = Infinity;
      const s: number[] = [], o: number[] = [];
      for (let i = 0; i < box.length; i++) {
        const dist = Math.abs(box[i].a + box[i].w / 2 - L);
        if (dist < best) { best = dist; nearest = i; }
        const t = dist / Math.max(1, box[i].w + gap); // 1 = one full step away
        const near = ease(Math.min(1, t)), far = ease(Math.max(0, Math.min(1, t - 1)));
        s.push(1 - (1 - SIDE_SCALE) * near);
        o.push(1 - (1 - SIDE_OPACITY) * near - (SIDE_OPACITY - FAR_OPACITY) * far);
      }
      select(nearest);
      if (mode.reduced) {
        scales.current.forEach((f, i) => { if (f) { f.style.transform = ""; f.style.opacity = i === nearest ? "1" : String(SIDE_OPACITY); } });
        return;
      }
      // Keep the gaps between scaled frames equal: map layout x → visual x by compressing each frame
      // to its scale and leaving the gaps as they are, anchored on the centre line (continuous while
      // scrolling, so the selected frame stays exactly centred).
      const F: number[] = []; // compressed position of each frame's left edge
      let acc = 0, prevEnd = 0;
      for (let i = 0; i < box.length; i++) { acc += box[i].a - prevEnd; F.push(acc); acc += box[i].w * s[i]; prevEnd = box[i].a + box[i].w; }
      let FL = L;
      for (let i = 0; i < box.length; i++) {
        const { a, w } = box[i];
        if (L < a) { FL = F[i] - (a - L); break; }
        if (L <= a + w) { FL = F[i] + (L - a) * s[i]; break; }
        if (i === box.length - 1) FL = F[i] + w * s[i] + (L - a - w);
      }
      for (let i = 0; i < box.length; i++) {
        const f = scales.current[i];
        if (!f) continue;
        const x = L + F[i] + (box[i].w * s[i]) / 2 - FL - (box[i].a + box[i].w / 2);
        f.style.transform = `translate3d(${x.toFixed(2)}px,0,0) scale(${s[i].toFixed(4)})`;
        f.style.opacity = o[i].toFixed(3);
      }
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(paint); };
    update.current = () => { measure(); schedule(); };

    measure();
    paint();
    const ro = new ResizeObserver(() => { measure(); schedule(); });
    ro.observe(el);
    frames.current.forEach((f) => f && ro.observe(f));
    el.addEventListener("scroll", schedule, { passive: true });

    // Mouse dragging (touch and trackpads scroll natively). Snapping pauses while the hand moves;
    // the release settles on the neighbour in the drag direction — never more than one step.
    let drag: { x: number; scroll: number; from: number; moved: boolean; id: number } | null = null;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      drag = { x: e.clientX, scroll: el.scrollLeft, from: activeRef.current, moved: false, id: e.pointerId };
    };
    const onMove = (e: PointerEvent) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 5) { drag.moved = true; el.setPointerCapture(drag.id); el.dataset.dragging = ""; }
      if (drag.moved) el.scrollLeft = drag.scroll - dx;
    };
    const onUp = (e: PointerEvent) => {
      if (!drag) return;
      const d = drag;
      drag = null;
      if (!d.moved) return;
      suppressClick.current = true;
      if (el.hasPointerCapture(d.id)) el.releasePointerCapture(d.id);
      const dx = e.clientX - d.x;
      const target = Math.max(0, Math.min(box.length - 1, d.from + (Math.abs(dx) > 40 ? (dx < 0 ? 1 : -1) : 0)));
      const b = box[target];
      el.scrollTo({ left: b.a + b.w / 2 - el.clientWidth / 2, behavior: mode.reduced ? "auto" : "smooth" });
      let done = false;
      const resume = () => { if (done) return; done = true; delete el.dataset.dragging; el.removeEventListener("scrollend", resume); };
      el.addEventListener("scrollend", resume);
      setTimeout(resume, 900); // browsers without scrollend
    };
    // Horizontal trackpad gestures: one gesture = one project. The gesture's momentum tail is absorbed
    // until the wheel has been quiet for a moment. Vertical wheel events are never touched.
    const wheel = { acc: 0, locked: false, timer: 0 as ReturnType<typeof setTimeout> | 0 };
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      wheel.acc += e.deltaX;
      if (wheel.timer) clearTimeout(wheel.timer);
      wheel.timer = setTimeout(() => { wheel.acc = 0; wheel.locked = false; wheel.timer = 0; }, 220);
      if (wheel.locked || Math.abs(wheel.acc) < 30) return;
      wheel.locked = true;
      const target = Math.max(0, Math.min(box.length - 1, activeRef.current + (wheel.acc > 0 ? 1 : -1)));
      const b = box[target];
      el.scrollTo({ left: b.a + b.w / 2 - el.clientWidth / 2, behavior: mode.reduced ? "auto" : "smooth" });
      select(target);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("scroll", schedule);
      if (wheel.timer) clearTimeout(wheel.timer);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, [mode.reduced, select]);

  // On mount, and whenever a frame takes its real width from a loaded image: keep the selection centred.
  useLayoutEffect(() => {
    const el = scroller.current, f = frames.current[activeRef.current];
    if (el && f && !el.dataset.dragging) el.scrollLeft = f.offsetLeft + f.offsetWidth / 2 - el.clientWidth / 2;
    if (el) el.dataset.ready = "";
    update.current();
  }, [ratios]);

  const go = useCallback((i: number, focus = false) => {
    const el = scroller.current;
    const n = Math.max(0, Math.min(items.length - 1, i));
    const f = frames.current[n];
    if (!el || !f) return;
    el.scrollTo({ left: f.offsetLeft + f.offsetWidth / 2 - el.clientWidth / 2, behavior: mode.reduced ? "auto" : "smooth" });
    select(n);
    if (focus) links.current[n]?.focus({ preventScroll: true });
  }, [items.length, mode.reduced, select]);

  const onKey = (e: React.KeyboardEvent) => {
    if (!(e.target as HTMLElement).closest("[data-pg-row], [data-pg-controls]")) return;
    const map: Record<string, number> = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: items.length - 1 };
    if (!(e.key in map)) return;
    e.preventDefault();
    go(map[e.key], true);
  };

  const item = items[active] ?? items[0];
  if (!item) return null;
  const n = items.length;
  const ratioOf = (i: number) => clampRatio(ratios[i] ?? DEFAULT_RATIO);
  const arrow = "inline-flex size-11 items-center justify-center rounded-full border border-line-strong bg-canvas text-ink transition-colors hover:border-ink disabled:opacity-35 disabled:hover:border-line-strong";

  return (
    <div role="region" aria-roledescription="carousel" aria-label={label} onKeyDown={onKey}>
      <noscript><style>{".pg-scroller .pg-track{opacity:1}"}</style></noscript>
      <div
        ref={scroller}
        data-pg-row
        aria-describedby={hintId}
        onClickCapture={(e) => { if (suppressClick.current) { e.preventDefault(); e.stopPropagation(); suppressClick.current = false; } }}
        onDragStart={(e) => e.preventDefault()}
        className={`pg-scroller ${compact ? "pg-compact" : ""}`}
      >
        <ul className="pg-track" style={{ "--ar0": ratioOf(0), "--arN": ratioOf(n - 1) } as React.CSSProperties}>
          {items.map((it, i) => {
            const r = ratios[i];
            const exact = r === null || (r >= MIN_RATIO && r <= MAX_RATIO); // frame = image: nothing cropped, nothing added
            return (
              <li
                key={it.id}
                ref={(node) => { frames.current[i] = node; }}
                className="pg-frame"
                style={{ "--ar": ratioOf(i) } as React.CSSProperties}
                aria-current={i === active ? "true" : undefined}
              >
                <div ref={(node) => { scales.current[i] = node; }} className="pg-scale">
                  <Link
                    ref={(node) => { links.current[i] = node; }}
                    href={it.href}
                    draggable={false}
                    tabIndex={i === active ? 0 : -1}
                    onClick={(e) => { if (i !== activeRef.current) { e.preventDefault(); go(i, true); } }}
                    className="pg-media"
                    aria-label={`${it.title} — ${it.category} (${i + 1} ${labels.of} ${n})`}
                  >
                    <Image
                      src={it.image}
                      alt={it.alt}
                      fill
                      draggable={false}
                      priority={i < 3}
                      sizes="(min-width: 768px) 560px, 80vw"
                      className={exact ? "object-cover" : "object-contain"}
                      onLoad={(e) => {
                        const img = e.currentTarget;
                        const ratio = img.naturalWidth / img.naturalHeight;
                        if (ratio) setRatios((prev) => (prev[i] === ratio ? prev : prev.map((v, j) => (j === i ? ratio : v))));
                      }}
                    />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* The selected project, always readable below the row */}
      <div className="mx-auto mt-8 max-w-content px-5 lg:mt-10 lg:px-10">
        <div data-pg-controls className="flex items-center gap-5 border-t border-line pt-5">
          <p className="t-num shrink-0 whitespace-nowrap text-[15px] text-ink-muted" aria-hidden>
            <span className="font-semibold text-ink">{String(active + 1).padStart(2, "0")}</span> / {String(n).padStart(2, "0")}
          </p>
          <div className="h-px min-w-0 flex-1 bg-line" aria-hidden>
            <div className="h-px origin-left bg-ink transition-transform duration-500" style={{ transform: `scaleX(${(active + 1) / n})` }} />
          </div>
          {n > 1 && (
            <div className="flex shrink-0 gap-2">
              <button type="button" className={arrow} onClick={() => go(active - 1)} disabled={active === 0} aria-label={labels.previous}>
                <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 5l-7 7 7 7" /></svg>
              </button>
              <button type="button" className={arrow} onClick={() => go(active + 1)} disabled={active === n - 1} aria-label={labels.next}>
                <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          )}
        </div>
        <p className="sr-only" aria-live="polite">{`${active + 1} ${labels.of} ${n}: ${item.title} — ${item.category}`}</p>
        <div key={item.id} className="pg-info mt-6 grid gap-x-6 gap-y-4 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-5">
            <p className="t-meta">{item.category}</p>
            <h3 className="font-display mt-2 text-[clamp(1.5rem,2.4vw,2.125rem)] font-medium leading-[1.1] tracking-[-0.035em] text-ink">
              <Link href={item.href} className="hover:underline hover:decoration-1 hover:underline-offset-[6px]">{item.title}</Link>
            </h3>
          </div>
          <div className="min-w-0 lg:col-span-4 lg:pt-7">
            {item.description && <p className="line-clamp-4 max-w-xl text-[17px] leading-relaxed text-ink-muted">{item.description}</p>}
          </div>
          <div className="flex flex-col items-start gap-3 lg:col-span-3 lg:items-end lg:pt-7">
            <Link href={item.href} className="btn-primary">{labels.open}</Link>
            <p id={hintId} className="t-meta lg:text-right">{mode.touch ? labels.hintTouch : labels.hint}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
