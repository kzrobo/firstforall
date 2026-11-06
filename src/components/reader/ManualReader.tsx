"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dictionary } from "@/i18n/dictionary";
import { languageName } from "@/lib/languages";
import { mapPageAcrossTranslations } from "@/lib/manuals/reader-nav";
import type { ManualTranslation } from "@/lib/manuals/types";
import { readerHref } from "@/components/manuals/format";
import { Icon } from "./icons";
import { PdfPage } from "./PdfPage";
import { PDF_OPTIONS, loadPdfJs, readOutline, searchDocument, type OutlineEntry } from "./pdf";

const ZOOM_STEPS = [0.5, 0.67, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3];

interface Props {
  manual: { slug: string; title: string };
  translations: ManualTranslation[];
  current: ManualTranslation;
  initialPage: number;
  t: Dictionary["reader"];
  locale: string;
  /** Where the reader lives (default: the public /manuals/<slug>/read). The team draft preview passes its own path. */
  basePath?: string;
  /** Target of the title link (default: the public manual page). */
  backHref?: string;
}

export function ManualReader({ manual, translations, current, initialPage, t, locale, basePath, backHref }: Props) {
  const hrefFor = useCallback((lang: string, page?: number) => {
    if (!basePath) return readerHref(manual.slug, lang, page);
    const qs = new URLSearchParams({ lang });
    if (page && page > 1) qs.set("page", String(page));
    return `${basePath}?${qs}`;
  }, [basePath, manual.slug]);
  const router = useRouter();
  const params = useSearchParams();
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const pages = useRef<HTMLDivElement>(null);
  const textCache = useRef(new Map<number, string>());

  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [aspect, setAspect] = useState(11 / 8.5);
  const [pageWidth, setPageWidth] = useState(612);
  const [scale, setScale] = useState<number | "fit">("fit");
  const [containerWidth, setContainerWidth] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [pageInput, setPageInput] = useState(String(initialPage));
  const [outline, setOutline] = useState<OutlineEntry[] | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [mobileTools, setMobileTools] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<{ page: number; count: number }[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [notice, setNotice] = useState(params.get("r") === "1");

  // Contents panel starts open on wide screens only.
  useEffect(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) setPanelOpen(true);
  }, []);

  // The reader owns the viewport: stop the document behind it from scrolling.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Load document
  useEffect(() => {
    let cancelled = false;
    let loaded: PDFDocumentProxy | null = null;
    setError(false);
    setDoc(null);
    (async () => {
      try {
        const pdfjs = await loadPdfJs();
        loaded = await pdfjs.getDocument({ url: current.fileUrl, ...PDF_OPTIONS }).promise;
        if (cancelled) return void loaded.destroy();
        const first = (await loaded.getPage(1)).getViewport({ scale: 1 });
        setAspect(first.height / first.width);
        setPageWidth(first.width);
        setDoc(loaded);
        readOutline(loaded).then((o) => !cancelled && setOutline(o)).catch(() => setOutline([]));
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => { cancelled = true; void loaded?.destroy(); };
  }, [current.fileUrl, attempt]);

  // Track container width for fit-to-width
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setContainerWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const effectiveScale = useMemo(() => {
    if (scale !== "fit") return scale;
    if (!containerWidth) return 1;
    const gutter = containerWidth < 640 ? 24 : 96;
    return Math.min(2, Math.max(0.3, (containerWidth - gutter) / pageWidth));
  }, [scale, containerWidth, pageWidth]);

  // Scroll only the document pane (never the window).
  const goTo = useCallback((n: number, behavior: ScrollBehavior = "smooth") => {
    if (!doc) return;
    const target = Math.min(Math.max(1, n), doc.numPages);
    const el = scroller.current?.querySelector<HTMLElement>(`[data-page="${target}"]`);
    if (el && scroller.current) scroller.current.scrollTo({ top: el.offsetTop - 16, behavior });
    setPage(target);
    setPageInput(String(target));
  }, [doc]);

  useEffect(() => {
    if (doc && initialPage > 1) requestAnimationFrame(() => goTo(initialPage, "auto"));
  }, [doc, initialPage, goTo]);

  // Current-page tracking
  useEffect(() => {
    const el = scroller.current;
    if (!doc || !el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) {
          const n = Number((top.target as HTMLElement).dataset.page);
          setPage(n);
          setPageInput(String(n));
        }
      },
      { root: el, rootMargin: "0px 0px -60% 0px" },
    );
    el.querySelectorAll("[data-page]").forEach((p) => io.observe(p));
    return () => io.disconnect();
  }, [doc, effectiveScale]);

  // Keep the URL shareable (?lang=&page=) without adding history entries
  useEffect(() => {
    if (!doc) return;
    window.history.replaceState(window.history.state, "", hrefFor(current.language, page));
  }, [page, doc, current.language, hrefFor]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") { e.preventDefault(); setMobileTools(true); searchInput.current?.focus(); return; }
      if ((e.target as HTMLElement).closest("input,select,textarea")) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); goTo(page + 1); }
      if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); goTo(page - 1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, page]);

  // Pinch-to-zoom on touch screens: preview with a CSS transform, re-render on release.
  const scaleRef = useRef(1);
  scaleRef.current = effectiveScale;
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let start: { dist: number; scale: number } | null = null;
    let ratio = 1;
    const dist = (e: TouchEvent) => Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) { start = { dist: dist(e), scale: scaleRef.current }; ratio = 1; }
    };
    const onMove = (e: TouchEvent) => {
      if (!start || e.touches.length !== 2) return;
      e.preventDefault();
      ratio = Math.min(4 / start.scale, Math.max(0.3 / start.scale, dist(e) / start.dist));
      if (pages.current) { pages.current.style.transformOrigin = `50% ${el.scrollTop + el.clientHeight / 2}px`; pages.current.style.transform = `scale(${ratio})`; }
    };
    const onEnd = () => {
      if (!start) return;
      if (pages.current) pages.current.style.transform = "";
      if (Math.abs(ratio - 1) > 0.03) setScale(Math.round(start.scale * ratio * 100) / 100);
      start = null;
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  const zoom = (dir: 1 | -1) => {
    const cur = effectiveScale;
    const next = dir > 0 ? ZOOM_STEPS.find((z) => z > cur + 0.01) : [...ZOOM_STEPS].reverse().find((z) => z < cur - 0.01);
    if (next) setScale(next);
  };

  const switchLanguage = (lang: string) => {
    const to = translations.find((tr) => tr.language === lang);
    if (!to || to.id === current.id) return;
    const { page: p, mapped } = mapPageAcrossTranslations(current, to, page);
    router.push(hrefFor(lang, p) + (mapped ? "" : "&r=1"));
  };

  const runSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doc || !query.trim()) return setHits(null);
    setSearching(true);
    setPanelOpen(true);
    try { setHits(await searchDocument(doc, query, textCache.current)); } finally { setSearching(false); }
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void root.current?.requestFullscreen?.();
  };

  const iconBtn = "inline-flex size-9 items-center justify-center text-ink-muted hover:bg-soft hover:text-ink disabled:pointer-events-none disabled:opacity-35";
  const divider = <span aria-hidden className="mx-2 hidden h-5 w-px bg-line md:block" />;

  const renderOutline = (items: OutlineEntry[], depth = 0) => (
    <ul className={depth ? "ml-3 border-l border-line" : ""}>
      {items.map((it, i) => {
        const here = it.page !== null && it.page <= page && (items[i + 1]?.page ?? Infinity) > page && depth === 0;
        return (
          <li key={`${depth}-${i}`}>
            <button
              type="button"
              disabled={it.page === null}
              onClick={() => { if (it.page) { goTo(it.page); if (!window.matchMedia("(min-width: 1024px)").matches) setPanelOpen(false); } }}
              className={`flex w-full items-baseline justify-between gap-3 border-l-2 py-2 pl-3 pr-2 text-left text-[14px] leading-snug ${here ? "border-accent font-semibold text-ink" : "border-transparent text-ink hover:text-ink"}`}
            >
              <span>{it.title}</span>{it.page && <span className="t-num text-[13px] text-ink-faint">{it.page}</span>}
            </button>
            {it.children.length > 0 && renderOutline(it.children, depth + 1)}
          </li>
        );
      })}
    </ul>
  );

  const searchForm = (
    <form role="search" onSubmit={runSearch} className="flex h-9 items-center gap-2 rounded-md border border-line-strong bg-canvas px-2.5 focus-within:border-ink">
      <Icon name="search" className="size-4 text-ink-faint" />
      <label className="flex-1"><span className="sr-only">{t.search}</span>
        <input ref={searchInput} type="search" value={query} placeholder={t.searchPlaceholder}
          onChange={(e) => { setQuery(e.target.value); if (!e.target.value) setHits(null); }}
          className="w-full bg-transparent text-[14px] placeholder:text-ink-faint focus:outline-none" />
      </label>
    </form>
  );

  return (
    <div ref={root} className="fixed inset-x-0 bottom-0 top-[65px] z-30 flex flex-col bg-stone lg:top-[77px]">
      {/* Toolbar */}
      <div className="border-b border-line bg-canvas">
        <div className="flex h-14 items-center gap-1 px-2 md:px-4">
          <button type="button" className={iconBtn} aria-expanded={panelOpen} onClick={() => setPanelOpen((v) => !v)} title={t.toc}>
            <span className="sr-only">{t.toc}</span><Icon name="toc" />
          </button>
          <Link href={backHref ?? `/manuals/${manual.slug}`} className="ml-1 hidden max-w-[26ch] truncate text-[14px] font-semibold text-ink hover:underline xl:block" title={t.back}>
            {manual.title}
          </Link>
          {divider}
          <label className="relative flex items-center">
            <span className="sr-only">{t.language}</span>
            <select value={current.language} onChange={(e) => switchLanguage(e.target.value)}
              className="h-9 appearance-none bg-transparent pl-2 pr-6 text-[14px] font-medium text-ink hover:text-ink">
              {translations.map((tr) => <option key={tr.id} value={tr.language}>{languageName(tr.language, locale)}</option>)}
            </select>
            <svg aria-hidden className="pointer-events-none absolute right-1.5 size-3 text-ink-muted" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m3 4.5 3 3 3-3" /></svg>
          </label>
          {divider}

          <div className="hidden items-center md:flex">
            <button type="button" className={iconBtn} onClick={() => goTo(page - 1)} disabled={!doc || page <= 1} title={t.prev}><span className="sr-only">{t.prev}</span><Icon name="prev" /></button>
            <form onSubmit={(e) => { e.preventDefault(); goTo(Number(pageInput) || 1); }} className="flex items-center gap-1.5 text-[14px]">
              <label><span className="sr-only">{t.page}</span>
                <input value={pageInput} onChange={(e) => setPageInput(e.target.value.replace(/\D/g, ""))} inputMode="numeric"
                  className="t-num h-8 w-11 rounded border border-line-strong bg-canvas text-center focus:border-ink focus:outline-none" />
              </label>
              <span className="t-num text-ink-muted">/ {doc?.numPages ?? "–"}</span>
            </form>
            <button type="button" className={iconBtn} onClick={() => goTo(page + 1)} disabled={!doc || page >= (doc?.numPages ?? 1)} title={t.next}><span className="sr-only">{t.next}</span><Icon name="next" /></button>
          </div>

          <div className="hidden items-center md:flex">
            {divider}
            <button type="button" className={iconBtn} onClick={() => zoom(-1)} title={t.zoomOut}><span className="sr-only">{t.zoomOut}</span><Icon name="minus" /></button>
            <button type="button" onClick={() => setScale("fit")} title={t.fitWidth} aria-pressed={scale === "fit"}
              className={`t-num h-9 w-14 text-center text-[13px] hover:bg-soft ${scale === "fit" ? "font-semibold text-ink" : "text-ink-muted"}`}>
              {Math.round(effectiveScale * 100)}%
            </button>
            <button type="button" className={iconBtn} onClick={() => zoom(1)} title={t.zoomIn}><span className="sr-only">{t.zoomIn}</span><Icon name="plus" /></button>
          </div>

          <div className="ml-auto hidden w-60 lg:block">{searchForm}</div>

          <div className="hidden items-center md:flex">
            {divider}
            <a href={current.fileUrl} download className="inline-flex h-9 items-center gap-2 px-2.5 text-[14px] font-medium text-ink hover:bg-soft">
              <Icon name="download" />{t.download}
            </a>
            <a href={current.fileUrl} target="_blank" rel="noopener noreferrer" className={iconBtn} title={t.print}><span className="sr-only">{t.print}</span><Icon name="print" /></a>
            <button type="button" className={iconBtn} onClick={toggleFullscreen} title={t.fullscreen}><span className="sr-only">{t.fullscreen}</span><Icon name="expand" /></button>
          </div>

          <a href={current.fileUrl} download className={`${iconBtn} ml-auto md:hidden`} title={t.download}><span className="sr-only">{t.download}</span><Icon name="download" /></a>
          <button type="button" className={`${iconBtn} lg:hidden`} aria-expanded={mobileTools} onClick={() => setMobileTools((v) => !v)} title={t.search}>
            <span className="sr-only">{t.search}</span><Icon name={mobileTools ? "close" : "search"} />
          </button>
        </div>

        {/* Compact secondary row for small screens */}
        {mobileTools && (
          <div className="flex items-center gap-2 border-t border-line px-3 py-2 lg:hidden">
            <div className="flex-1">{searchForm}</div>
          </div>
        )}
      </div>

      {notice && (
        <div role="status" className="flex items-center justify-between gap-4 border-b border-accent/50 bg-accent-pale/70 px-4 py-2 text-[14px]">
          {t.pageReset}
          <button type="button" onClick={() => setNotice(false)} className="text-ink-muted hover:text-ink"><span className="sr-only">{t.retry}</span><Icon name="close" className="size-4" /></button>
        </div>
      )}

      <div className="relative flex min-h-0 flex-1">
        {/* Side panel: outline, or search results while searching */}
        {panelOpen && <button aria-hidden tabIndex={-1} className="absolute inset-0 z-10 bg-black/25 lg:hidden" onClick={() => setPanelOpen(false)} />}
        <aside
          aria-label={hits !== null ? t.search : t.toc}
          className={`${panelOpen ? "flex" : "hidden"} absolute inset-y-0 left-0 z-20 w-[19rem] max-w-[85vw] flex-col border-r border-line bg-paper lg:static lg:z-auto`}
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="t-index">
              {hits !== null ? (searching ? "…" : hits.length ? `${hits.reduce((s, h) => s + h.count, 0)} ${t.matches}` : t.noMatches) : t.toc}
            </h2>
            {hits !== null && <button type="button" onClick={() => { setHits(null); setQuery(""); }} className="text-[13px] text-tech hover:underline">{t.toc}</button>}
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-3">
            {hits !== null ? (
              <ul>
                {hits.map((h) => (
                  <li key={h.page}>
                    <button type="button" onClick={() => { goTo(h.page); }}
                      className={`flex w-full justify-between border-l-2 py-2 pl-3 pr-2 text-[14px] ${h.page === page ? "border-accent font-semibold text-ink" : "border-transparent hover:text-ink"}`}>
                      <span>{t.page} <span className="t-num">{h.page}</span></span><span className="t-num text-ink-faint">{h.count}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : outline === null ? (
              <p className="px-3 text-[14px] text-ink-muted">…</p>
            ) : outline.length ? renderOutline(outline) : (
              <p className="px-3 text-[14px] text-ink-muted">{t.noToc}</p>
            )}
          </div>
        </aside>

        <div ref={scroller} className="relative min-w-0 flex-1 touch-pan-x touch-pan-y overflow-auto" tabIndex={0} aria-label={manual.title}>
          {error ? (
            <div role="alert" className="mx-auto mt-24 max-w-md px-5 text-center">
              <p className="text-[18px] font-semibold text-ink">{t.error}</p>
              <div className="mt-6 flex justify-center gap-6">
                <button type="button" onClick={() => setAttempt((a) => a + 1)} className="btn-primary">{t.retry}</button>
                <a href={current.fileUrl} download className="link-arrow text-[14px] text-ink">{t.download}</a>
              </div>
            </div>
          ) : !doc ? (
            <div role="status" className="mt-28 flex flex-col items-center gap-4 text-[14px] text-ink-muted">
              <span className="h-[2px] w-24 overflow-hidden bg-line"><span className="block h-full w-1/3 animate-[pulse_1s_ease-in-out_infinite] bg-tech" /></span>
              {t.loading}
            </div>
          ) : (
            <div ref={pages} className="flex w-max min-w-full flex-col items-center gap-5 px-3 pb-24 pt-5 md:px-12 md:py-10">
              {Array.from({ length: doc.numPages }, (_, i) => (
                <PdfPage key={i} doc={doc} pageNumber={i + 1} scale={effectiveScale} aspect={aspect} label={`${t.page} ${i + 1} ${t.of} ${doc.numPages}`} />
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Mobile: thumb-reachable page navigation and zoom */}
      <nav aria-label={t.page} className="absolute inset-x-0 bottom-0 z-20 border-t border-line bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="flex h-14 items-center justify-between px-2">
          <div className="flex items-center">
            <button type="button" className={`${iconBtn} size-11`} onClick={() => goTo(page - 1)} disabled={!doc || page <= 1}><span className="sr-only">{t.prev}</span><Icon name="prev" className="size-5" /></button>
            <form onSubmit={(e) => { e.preventDefault(); goTo(Number(pageInput) || 1); (document.activeElement as HTMLElement)?.blur(); }} className="flex items-center gap-1.5 text-[15px]">
              <label><span className="sr-only">{t.page}</span>
                <input value={pageInput} onChange={(e) => setPageInput(e.target.value.replace(/\D/g, ""))} inputMode="numeric" enterKeyHint="go"
                  className="t-num h-9 w-12 rounded border border-line-strong bg-canvas text-center text-[16px] focus:border-ink focus:outline-none" />
              </label>
              <span className="t-num text-ink-muted">/ {doc?.numPages ?? "–"}</span>
            </form>
            <button type="button" className={`${iconBtn} size-11`} onClick={() => goTo(page + 1)} disabled={!doc || page >= (doc?.numPages ?? 1)}><span className="sr-only">{t.next}</span><Icon name="next" className="size-5" /></button>
          </div>
          <div className="flex items-center">
            <button type="button" className={`${iconBtn} size-11`} onClick={() => zoom(-1)}><span className="sr-only">{t.zoomOut}</span><Icon name="minus" className="size-5" /></button>
            <button type="button" onClick={() => setScale("fit")} aria-pressed={scale === "fit"} title={t.fitWidth}
              className={`t-num h-11 w-14 text-center text-[14px] ${scale === "fit" ? "font-semibold text-ink" : "text-ink-muted"}`}>
              {Math.round(effectiveScale * 100)}%
            </button>
            <button type="button" className={`${iconBtn} size-11`} onClick={() => zoom(1)}><span className="sr-only">{t.zoomIn}</span><Icon name="plus" className="size-5" /></button>
          </div>
        </div>
      </nav>
    </div>
  );
}
