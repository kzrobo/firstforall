"use client";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GalleryItem } from "@/lib/hub/gallery";

/**
 * Layered parallax gallery of MAVERICKS projects and events.
 *
 * Composition: a horizontal, overlapping cascade of images at three depths (foreground, midground,
 * background) with varied sizes and vertical offsets. Each image keeps its own proportions.
 * Motion: one requestAnimationFrame loop eases the pointer position and scroll speed and writes CSS
 * transforms straight to each layer — React only re-renders when the active project changes.
 * Navigation: native horizontal scrolling (trackpad, touch, keyboard), drag with inertia, edge hover,
 * and wheel → horizontal only while the gallery has focus. Reduced motion: a plain, static row.
 */

type Slot = { d: number; h: number; top: number; ar: number; ov: number };
// Composition after the team's hand-drawn reference: wide landscape frames at different heights,
// overlapping their neighbours on both axes — a smaller frame high, the dominant frame lower and
// across it, a smaller frame lowest — then open space before the next group.
// h/top: fractions of the stage height · ar: frame aspect (width/height) · ov: share of the frame's
// own width that slides under its left neighbour (negative = a gap). Depth d drives parallax + z-order.
const DESKTOP: Slot[] = [
  { d: 0.45, h: 0.44, top: 0.0, ar: 1.6, ov: -0.45 },  // high, set back (ov applies when a new group follows)
  { d: 1, h: 0.66, top: 0.24, ar: 1.5, ov: 0.3 },      // dominant, lower, across the high frame
  { d: 0.7, h: 0.42, top: 0.57, ar: 1.45, ov: 0.42 },  // lowest, over the dominant frame's corner
  { d: 0.45, h: 0.4, top: 0.54, ar: 1.6, ov: -0.4 },   // after a pause: low, set back
  { d: 1, h: 0.62, top: 0.08, ar: 1.55, ov: 0.3 },     // dominant, high
  { d: 0.7, h: 0.44, top: 0.5, ar: 1.5, ov: 0.38 },    // middle, across its lower edge
];
// Phones: near-square frames as wide as the screen allows, gentle level changes, slight overlap.
const MOBILE: Slot[] = [
  { d: 0.9, h: 0.76, top: 0.02, ar: 1.0, ov: 0.1 },
  { d: 0.5, h: 0.64, top: 0.34, ar: 1.18, ov: 0.1 },
  { d: 0.7, h: 0.7, top: 0.14, ar: 1.08, ov: 0.1 },
];
const FOCUS_FROM = 0.15, FOCUS_TO = 0.85; // the "active" line sweeps across the viewport as you scroll
const POINTER_X = 30, POINTER_Y = 18; // px of travel for the nearest layer
const SCROLL_DEPTH = 0.14; // how much farther layers lag behind horizontal movement

export function ProjectGallery({ items, label, labels, compact = false }: {
  items: GalleryItem[];
  label: string;
  /** Smaller stage for use inside a page section (homepage) */
  compact?: boolean;
  labels: { previous: string; next: string; open: string; hint: string; hintTouch: string; of: string };
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const tiles = useRef<(HTMLLIElement | null)[]>([]);
  const links = useRef<(HTMLAnchorElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const hoverRef = useRef<number | null>(null);
  const pinRef = useRef<number | null>(null); // set by keyboard/buttons until the visitor scrolls themselves
  // Natural image ratios decide fill: wide photos fill the frame, portrait graphics are shown whole.
  const [ratios, setRatios] = useState<(number | null)[]>(() => items.map(() => null));
  // Flat colours sampled from each graphic's left and right edges: the frame continues the graphic.
  const [fields, setFields] = useState<(string | null)[]>(() => items.map(() => null));
  const [mode, setMode] = useState<{ mobile: boolean; reduced: boolean; touch: boolean }>({ mobile: false, reduced: false, touch: false });
  const kick = useRef<() => void>(() => {});
  const suppressClick = useRef(false);

  const select = useCallback((i: number) => {
    if (i === activeRef.current) return;
    activeRef.current = i;
    setActive(i);
  }, []);

  // Breakpoint, motion and input preferences (re-evaluated on change)
  useEffect(() => {
    const q = { mobile: matchMedia("(max-width: 767px)"), reduced: matchMedia("(prefers-reduced-motion: reduce)"), touch: matchMedia("(hover: none)") };
    const read = () => setMode({ mobile: q.mobile.matches, reduced: q.reduced.matches, touch: q.touch.matches });
    read();
    Object.values(q).forEach((m) => m.addEventListener("change", read));
    return () => Object.values(q).forEach((m) => m.removeEventListener("change", read));
  }, []);

  // The motion loop. Everything per-frame lives in refs; nothing here calls React except select().
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const slots = mode.mobile ? MOBILE : DESKTOP;
    const st = {
      raf: 0, last: 0,
      px: 0, py: 0, tx: 0, ty: 0,           // pointer (eased / target), −1..1
      inside: false, edge: 0,               // edge auto-scroll speed, px per frame at 60 fps
      dragging: false, moved: false, dragX: 0, dragScroll: 0, vel: 0, lastX: 0, lastT: 0,
      wheelTarget: null as number | null,
      centers: [] as number[],
    };
    const measure = () => { st.centers = tiles.current.map((t) => (t ? t.offsetLeft + t.offsetWidth / 2 : 0)); };
    measure();
    const ro = new ResizeObserver(() => { measure(); start(); });
    ro.observe(el);
    tiles.current.forEach((t) => t && ro.observe(t));
    const max = () => el.scrollWidth - el.clientWidth;

    const frame = (now: number) => {
      const dt = Math.min(48, st.last ? now - st.last : 16.7) / 16.7;
      st.last = now;
      let busy = false;

      // Horizontal movement: drag inertia, edge hover, focused wheel
      if (!st.dragging && Math.abs(st.vel) > 0.2) { el.scrollLeft -= st.vel * dt; st.vel *= Math.pow(0.93, dt); busy = true; } else if (!st.dragging) st.vel = 0;
      if (st.edge && !st.dragging) { const before = el.scrollLeft; el.scrollLeft += st.edge * dt; busy = el.scrollLeft !== before; }
      if (st.wheelTarget !== null) {
        const diff = st.wheelTarget - el.scrollLeft;
        if (Math.abs(diff) < 0.5) { el.scrollLeft = st.wheelTarget; st.wheelTarget = null; } else { el.scrollLeft += diff * (1 - Math.pow(0.82, dt)); busy = true; }
      }

      // Eased pointer → parallax
      const k = 1 - Math.pow(1 - 0.075, dt);
      st.px += (st.tx - st.px) * k; st.py += (st.ty - st.py) * k;
      if (Math.abs(st.tx - st.px) > 0.0008 || Math.abs(st.ty - st.py) > 0.0008) busy = true;

      const vw = el.clientWidth, sl = el.scrollLeft, m = max();
      const focusLine = vw * (m > 0 ? FOCUS_FROM + (FOCUS_TO - FOCUS_FROM) * (sl / m) : 0.5);
      let nearest = 0, best = Infinity;
      for (let i = 0; i < layers.current.length; i++) {
        const layer = layers.current[i];
        if (!layer) continue;
        const d = slots[i % slots.length].d;
        const rel = (st.centers[i] - sl - vw / 2) / vw;
        const x = -st.px * d * POINTER_X - rel * (1 - d) * vw * SCROLL_DEPTH;
        const y = -st.py * d * POINTER_Y;
        layer.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
        const dist = Math.abs(st.centers[i] - sl - focusLine);
        if (dist < best) { best = dist; nearest = i; }
      }
      if (hoverRef.current === null && pinRef.current === null) select(nearest);
      st.raf = busy ? requestAnimationFrame(frame) : 0;
      if (!busy) st.last = 0;
    };
    const start = () => { if (!st.raf && !mode.reduced) st.raf = requestAnimationFrame(frame); };
    kick.current = start;

    if (mode.reduced) {
      layers.current.forEach((l) => l && (l.style.transform = ""));
      const onScroll = () => {
        const vw = el.clientWidth, sl = el.scrollLeft, m = max();
        const focusLine = vw * (m > 0 ? FOCUS_FROM + (FOCUS_TO - FOCUS_FROM) * (sl / m) : 0.5);
        let nearest = 0, best = Infinity;
        st.centers.forEach((c, i) => { const d = Math.abs(c - sl - focusLine); if (d < best) { best = d; nearest = i; } });
        if (hoverRef.current === null && pinRef.current === null) select(nearest);
      };
      const unpin = () => { pinRef.current = null; };
      el.addEventListener("pointerdown", unpin); el.addEventListener("wheel", unpin, { passive: true }); el.addEventListener("touchstart", unpin, { passive: true });
      el.addEventListener("scroll", onScroll, { passive: true });
      return () => { el.removeEventListener("scroll", onScroll); el.removeEventListener("pointerdown", unpin); el.removeEventListener("wheel", unpin); el.removeEventListener("touchstart", unpin); ro.disconnect(); };
    }

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      if (e.pointerType === "mouse" || e.pointerType === "pen") {
        if (e.movementX || e.movementY) pinRef.current = null; // a real mouse move hands control back to the pointer
        st.tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
        st.ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
        // Edge hover: speed ramps up over the outer 14 % (≤ 180 px) of each side
        const zone = Math.min(180, r.width * 0.14), xIn = e.clientX - r.left;
        const left = (zone - xIn) / zone, right = (xIn - (r.width - zone)) / zone;
        st.edge = st.dragging ? 0 : left > 0 ? -16 * left * left : right > 0 ? 16 * right * right : 0;
        if (st.edge) pinRef.current = null;
      }
      if (st.dragging) {
        const dx = e.clientX - st.dragX;
        if (!st.moved && Math.abs(dx) > 5) { st.moved = true; el.setPointerCapture(e.pointerId); el.dataset.dragging = ""; }
        if (st.moved) {
          el.scrollLeft = st.dragScroll - dx;
          const t = performance.now();
          if (t - st.lastT > 0) st.vel = ((e.clientX - st.lastX) / (t - st.lastT)) * 16.7;
          st.lastX = e.clientX; st.lastT = t;
        }
      }
      start();
    };
    const onEnter = () => { st.inside = true; };
    const onLeave = () => { st.inside = false; st.tx = 0; st.ty = 0; st.edge = 0; start(); };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return; // touch & pen use native scrolling
      st.dragging = true; st.moved = false; st.vel = 0; st.wheelTarget = null; st.edge = 0; pinRef.current = null;
      st.dragX = st.lastX = e.clientX; st.dragScroll = el.scrollLeft; st.lastT = performance.now();
    };
    const onUp = (e: PointerEvent) => {
      if (!st.dragging) return;
      st.dragging = false;
      if (st.moved) { suppressClick.current = true; if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId); }
      delete el.dataset.dragging;
      start();
    };
    const onWheel = (e: WheelEvent) => {
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      pinRef.current = null;
      if (horizontal) { st.wheelTarget = null; start(); return; } // trackpad sideways: native
      // Vertical wheel only drives the gallery when it was focused on purpose, and never past its ends
      if (!el.contains(document.activeElement)) return;
      const base = st.wheelTarget ?? el.scrollLeft;
      const next = Math.max(0, Math.min(max(), base + e.deltaY));
      if (next === base) return; // at an end: let the page scroll
      e.preventDefault();
      st.wheelTarget = next;
      start();
    };
    const onScroll = () => start();

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("scroll", onScroll, { passive: true });
    const onTouch = () => { pinRef.current = null; };
    el.addEventListener("touchstart", onTouch, { passive: true });
    start();
    return () => {
      cancelAnimationFrame(st.raf);
      ro.disconnect();
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("touchstart", onTouch);
    };
  }, [mode, select]);

  const go = useCallback((i: number, focus = false) => {
    const el = scroller.current;
    const n = Math.max(0, Math.min(items.length - 1, i));
    const t = tiles.current[n];
    if (!el || !t) return;
    el.scrollTo({ left: t.offsetLeft + t.offsetWidth / 2 - el.clientWidth / 2, behavior: mode.reduced ? "auto" : "smooth" });
    pinRef.current = n;
    select(n);
    if (focus) links.current[n]?.focus({ preventScroll: true });
    kick.current();
  }, [items.length, mode.reduced, select]);

  const onKey = (e: React.KeyboardEvent) => {
    // Step from the project that has keyboard focus, not from whatever the mouse happens to rest on
    const focused = links.current.findIndex((l) => l === document.activeElement);
    const base = focused >= 0 ? focused : activeRef.current;
    const map: Record<string, number> = { ArrowRight: base + 1, ArrowLeft: base - 1, Home: 0, End: items.length - 1 };
    if (!(e.key in map)) return;
    e.preventDefault();
    go(map[e.key], true);
  };

  const slots = mode.mobile ? MOBILE : DESKTOP;
  const item = items[active] ?? items[0];
  if (!item) return null;
  const n = items.length;
  const arrow = "inline-flex size-11 items-center justify-center rounded-full border border-line-strong bg-canvas text-ink transition-colors hover:border-ink disabled:opacity-35 disabled:hover:border-line-strong";

  return (
    <div role="region" aria-label={label} onKeyDown={onKey}>
      <div
        ref={scroller}
        tabIndex={0}
        aria-describedby="pg-hint"
        onClickCapture={(e) => { if (suppressClick.current) { e.preventDefault(); e.stopPropagation(); suppressClick.current = false; } }}
        onDragStart={(e) => e.preventDefault()}
        className={`pg-scroller ${compact ? "pg-compact" : ""} overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] focus-visible:outline-offset-[-3px] [&::-webkit-scrollbar]:hidden`}
      >
        <ul className="pg-track">
          {items.map((it, i) => {
            const s = slots[i % slots.length];
            const ratio = ratios[i];
            const fills = ratio !== null && ratio >= s.ar * 0.78; // close enough to the frame to crop gently
            return (
              <li
                key={it.id}
                ref={(node) => { tiles.current[i] = node; }}
                className="pg-tile"
                style={{ "--h": s.h, "--top": s.top, "--ov": i === 0 ? 0 : s.ov, "--ar": s.ar, zIndex: Math.round(s.d * 10) } as React.CSSProperties}
                onPointerEnter={(e) => { if (e.pointerType === "mouse" && pinRef.current === null) { hoverRef.current = i; select(i); } }}
                onPointerLeave={() => { hoverRef.current = null; }}
              >
                <div ref={(node) => { layers.current[i] = node; }} className="pg-layer">
                  <Link
                    ref={(node) => { links.current[i] = node; }}
                    href={it.href}
                    draggable={false}
                    onFocus={() => { if (!scroller.current?.dataset.dragging) go(i); }}
                    className="group block size-full focus-visible:outline-none"
                    aria-label={`${it.title} — ${it.category}`}
                  >
                    <span className="pg-media" style={!fills && fields[i] ? { background: fields[i]! } : undefined}>
                      <Image
                        src={it.image}
                        alt={it.alt}
                        fill
                        draggable={false}
                        priority={i < 3}
                        sizes={fills ? "(min-width: 768px) 45vw, 92vw" : "(min-width: 768px) 25vw, 70vw"}
                        className={fills ? "object-cover" : "object-contain"}
                        onLoad={(e) => {
                          const img = e.currentTarget;
                          const r = img.naturalWidth / img.naturalHeight;
                          if (r && r !== ratios[i]) setRatios((prev) => prev.map((v, j) => (j === i ? r : v)));
                          if (!fields[i]) {
                            const field = edgeField(img);
                            if (field) setFields((prev) => prev.map((v, j) => (j === i ? field : v)));
                          }
                        }}
                      />
                    </span>
                    <span className="pg-caption" aria-hidden>
                      <span className="block text-[14px] text-ink-muted">{it.category}</span>
                      <span className="mt-0.5 block text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink">{it.title}</span>
                    </span>
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Information about the active project — beside the photographs, never on top of them */}
      <div className="mx-auto mt-4 grid max-w-content gap-x-6 gap-y-6 px-5 lg:mt-2 lg:grid-cols-12 lg:px-10">
        <div className="flex items-center gap-5 lg:col-span-3 lg:flex-col lg:items-start lg:gap-4">
          <p className="t-num shrink-0 whitespace-nowrap text-[15px] text-ink-muted" aria-hidden>
            <span className="font-semibold text-ink">{String(active + 1).padStart(2, "0")}</span> / {String(n).padStart(2, "0")}
          </p>
          <div className="h-px min-w-0 flex-1 bg-line lg:w-full lg:max-w-[12rem] lg:flex-none" aria-hidden>
            <div className="h-px origin-left bg-ink transition-transform duration-500" style={{ transform: `scaleX(${(active + 1) / n})` }} />
          </div>
          {n > 1 && (
            <div className="flex shrink-0 gap-2">
              <button type="button" className={arrow} onClick={() => go(active - 1, true)} disabled={active === 0} aria-label={labels.previous}>
                <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 5l-7 7 7 7" /></svg>
              </button>
              <button type="button" className={arrow} onClick={() => go(active + 1, true)} disabled={active === n - 1} aria-label={labels.next}>
                <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          )}
        </div>
        <div className="min-w-0 lg:col-span-6" aria-live="polite">
          <p className="t-meta">{item.category}</p>
          <h3 className="font-display mt-2 text-[clamp(1.625rem,2.8vw,2.375rem)] font-medium leading-[1.08] tracking-[-0.035em] text-ink">
            <Link href={item.href} className="hover:underline hover:decoration-1 hover:underline-offset-[6px]">{item.title}</Link>
          </h3>
          {item.description && <p className="mt-3 line-clamp-3 max-w-xl text-[17px] leading-relaxed text-ink-muted">{item.description}</p>}
        </div>
        <div className="flex flex-col items-start gap-3 lg:col-span-3 lg:items-end lg:justify-between">
          <Link href={item.href} className="btn-primary">{labels.open}</Link>
          <p id="pg-hint" className="t-meta lg:text-right">{mode.touch ? labels.hintTouch : labels.hint}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Average colour of an image's outer left and right columns, as a hard-split background
 * ("left half | right half") — the split sits behind the image, so the frame reads as one flat field.
 */
function edgeField(img: HTMLImageElement): string | null {
  try {
    const n = 24, c = document.createElement("canvas");
    c.width = n; c.height = n;
    const g = c.getContext("2d", { willReadFrequently: true });
    if (!g) return null;
    g.drawImage(img, 0, 0, n, n);
    const d = g.getImageData(0, 0, n, n).data;
    const avg = (x0: number, x1: number) => {
      let r = 0, gr = 0, b = 0, k = 0;
      for (let y = 0; y < n; y++) for (let x = x0; x <= x1; x++) { const i = (y * n + x) * 4; r += d[i]; gr += d[i + 1]; b += d[i + 2]; k++; }
      return `rgb(${Math.round(r / k)} ${Math.round(gr / k)} ${Math.round(b / k)})`;
    };
    return `linear-gradient(to right, ${avg(0, 1)} 50%, ${avg(n - 2, n - 1)} 50%)`;
  } catch {
    return null; // cross-origin image without CORS: keep the neutral paper field
  }
}
