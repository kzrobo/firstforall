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
import { PdfPage } from "./PdfPage";
import { loadPdfJs, readOutline, searchDocument, type OutlineEntry } from "./pdf";

const ZOOM_STEPS = [0.5, 0.67, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3];

interface Props {
  manual: { slug: string; title: string };
  translations: ManualTranslation[];
  current: ManualTranslation;
  initialPage: number;
  t: Dictionary["reader"];
  locale: string;
}

export function ManualReader({ manual, translations, current, initialPage, t, locale }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
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
  const [tocOpen, setTocOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<{ page: number; count: number }[] | null>(null);
  const [searching, setSearching] = useState(false);
  const pageReset = params.get("r") === "1";

  // Load document
  useEffect(() => {
    let cancelled = false;
    let loaded: PDFDocumentProxy | null = null;
    setError(false);
    setDoc(null);
    (async () => {
      try {
        const pdfjs = await loadPdfJs();
        loaded = await pdfjs.getDocument({ url: current.fileUrl, isEvalSupported: false }).promise;
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
    return Math.min(2.5, Math.max(0.3, (containerWidth - 32) / pageWidth));
  }, [scale, containerWidth, pageWidth]);

  const goTo = useCallback((n: number, behavior: ScrollBehavior = "smooth") => {
    if (!doc) return;
    const target = Math.min(Math.max(1, n), doc.numPages);
    scroller.current?.querySelector(`[data-page="${target}"]`)?.scrollIntoView({ behavior, block: "start" });
    setPage(target);
    setPageInput(String(target));
  }, [doc]);

  // Jump to the initial page once the document is laid out
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
    const url = readerHref(manual.slug, current.language, page);
    window.history.replaceState(window.history.state, "", url);
  }, [page, doc, manual.slug, current.language]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,select,textarea")) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); goTo(page + 1); }
      if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); goTo(page - 1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, page]);

  const zoom = (dir: 1 | -1) => {
    const cur = effectiveScale;
    const next = dir > 0 ? ZOOM_STEPS.find((z) => z > cur + 0.01) : [...ZOOM_STEPS].reverse().find((z) => z < cur - 0.01);
    if (next) setScale(next);
  };

  const switchLanguage = (lang: string) => {
    const to = translations.find((tr) => tr.language === lang);
    if (!to || to.id === current.id) return;
    const { page: p, mapped } = mapPageAcrossTranslations(current, to, page);
    router.push(readerHref(manual.slug, lang, p) + (mapped ? "" : "&r=1"));
  };

  const runSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doc || !query.trim()) return setHits(null);
    setSearching(true);
    try { setHits(await searchDocument(doc, query, textCache.current)); } finally { setSearching(false); }
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void root.current?.requestFullscreen?.();
  };

  const btn = "inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm text-ink hover:bg-soft disabled:opacity-40";

  const renderOutline = (items: OutlineEntry[], depth = 0) => (
    <ul className={depth ? "ml-3 border-l border-line pl-2" : ""}>
      {items.map((it, i) => (
        <li key={`${depth}-${i}`}>
          <button
            type="button"
            disabled={it.page === null}
            onClick={() => { if (it.page) { goTo(it.page); setTocOpen(false); } }}
            className="flex w-full items-baseline justify-between gap-3 rounded px-2 py-1.5 text-left text-sm hover:bg-soft"
          >
            <span>{it.title}</span>{it.page && <span className="text-xs tabular-nums text-ink-muted">{it.page}</span>}
          </button>
          {it.children.length > 0 && renderOutline(it.children, depth + 1)}
        </li>
      ))}
    </ul>
  );

  return (
    <div ref={root} className="flex h-[calc(100dvh-4rem)] flex-col bg-soft">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 border-b border-line bg-paper px-3 py-2 lg:px-4">
        <button type="button" className={`${btn} lg:hidden`} aria-expanded={tocOpen} onClick={() => setTocOpen((v) => !v)}>
          <span className="sr-only">{t.toc}</span>
          <svg aria-hidden className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 6h16M4 12h10M4 18h16" /></svg>
        </button>
        <Link href={`/manuals/${manual.slug}`} className="hidden max-w-[22ch] truncate text-sm font-semibold text-navy hover:underline md:block" title={t.back}>
          {manual.title}
        </Link>
        <span className="mx-1 hidden h-6 w-px bg-line md:block" />
        <label className="flex items-center">
          <span className="sr-only">{t.language}</span>
          <select value={current.language} onChange={(e) => switchLanguage(e.target.value)} className="h-9 rounded-md border border-line bg-paper px-2 text-sm">
            {translations.map((tr) => <option key={tr.id} value={tr.language}>{languageName(tr.language, locale)}</option>)}
          </select>
        </label>

        <div className="flex items-center gap-1">
          <button type="button" className={btn} onClick={() => goTo(page - 1)} disabled={!doc || page <= 1} aria-label={t.prev}>‹</button>
          <form onSubmit={(e) => { e.preventDefault(); goTo(Number(pageInput) || 1); }} className="flex items-center gap-1 text-sm">
            <label><span className="sr-only">{t.page}</span>
              <input value={pageInput} onChange={(e) => setPageInput(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className="h-9 w-12 rounded-md border border-line text-center tabular-nums" />
            </label>
            <span className="text-ink-muted tabular-nums">{t.of} {doc?.numPages ?? "–"}</span>
          </form>
          <button type="button" className={btn} onClick={() => goTo(page + 1)} disabled={!doc || page >= (doc?.numPages ?? 1)} aria-label={t.next}>›</button>
        </div>

        <div className="flex items-center gap-1">
          <button type="button" className={btn} onClick={() => zoom(-1)} aria-label={t.zoomOut}>−</button>
          <span className="w-12 text-center text-sm tabular-nums text-ink-muted" aria-live="polite">{Math.round(effectiveScale * 100)}%</span>
          <button type="button" className={btn} onClick={() => zoom(1)} aria-label={t.zoomIn}>+</button>
          <button type="button" className={`${btn} hidden sm:inline-flex`} onClick={() => setScale("fit")} aria-pressed={scale === "fit"}>{t.fitWidth}</button>
        </div>

        <form role="search" onSubmit={runSearch} className="order-last flex w-full items-center gap-2 sm:order-none sm:ml-auto sm:w-auto">
          <label className="flex-1"><span className="sr-only">{t.search}</span>
            <input type="search" value={query} onChange={(e) => { setQuery(e.target.value); if (!e.target.value) setHits(null); }} placeholder={t.searchPlaceholder} className="h-9 w-full rounded-md border border-line px-3 text-sm sm:w-56" />
          </label>
        </form>

        <div className="flex items-center gap-1">
          <a href={current.fileUrl} download className={btn}>{t.download}</a>
          <a href={current.fileUrl} target="_blank" rel="noopener noreferrer" className={`${btn} hidden md:inline-flex`} title={t.print}>{t.print}</a>
          <button type="button" className={`${btn} hidden md:inline-flex`} onClick={toggleFullscreen}>{t.fullscreen}</button>
        </div>
      </div>

      {pageReset && <p role="status" className="border-b border-honey/60 bg-honey-pale/60 px-4 py-2 text-sm">{t.pageReset}</p>}

      <div className="relative flex min-h-0 flex-1">
        {/* Side panel: search results or outline */}
        <aside
          aria-label={t.toc}
          className={`${tocOpen ? "absolute inset-y-0 left-0 z-20 w-80 max-w-[85vw] shadow-xl" : "hidden"} overflow-y-auto border-r border-line bg-paper p-3 lg:static lg:block lg:w-72 lg:shadow-none`}
        >
          {hits !== null ? (
            <div>
              <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                {searching ? "…" : hits.length ? `${hits.reduce((s, h) => s + h.count, 0)} ${t.matches}` : t.noMatches}
              </p>
              <ul>
                {hits.map((h) => (
                  <li key={h.page}>
                    <button type="button" onClick={() => { goTo(h.page); setTocOpen(false); }} className="flex w-full justify-between rounded px-2 py-1.5 text-sm hover:bg-soft">
                      <span>{t.page} {h.page}</span><span className="text-ink-muted">{h.count}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <>
              <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">{t.toc}</p>
              {outline === null ? <p className="px-2 text-sm text-ink-muted">…</p> : outline.length ? renderOutline(outline) : <p className="px-2 text-sm text-ink-muted">{t.noToc}</p>}
            </>
          )}
        </aside>

        <div ref={scroller} className="min-w-0 flex-1 overflow-auto" tabIndex={0} aria-label={manual.title}>
          {error ? (
            <div role="alert" className="mx-auto mt-20 max-w-md text-center">
              <p className="text-lg font-medium">{t.error}</p>
              <div className="mt-6 flex justify-center gap-3">
                <button type="button" onClick={() => setAttempt((a) => a + 1)} className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white">{t.retry}</button>
                <a href={current.fileUrl} download className="rounded-md border border-line px-4 py-2 text-sm font-semibold">{t.download}</a>
              </div>
            </div>
          ) : !doc ? (
            <div role="status" className="mt-24 flex flex-col items-center gap-4 text-ink-muted">
              <span className="size-8 animate-spin rounded-full border-2 border-line border-t-tech" aria-hidden />
              {t.loading}
            </div>
          ) : (
            <div className="flex flex-col gap-4 px-4 py-6">
              {Array.from({ length: doc.numPages }, (_, i) => (
                <PdfPage key={i} doc={doc} pageNumber={i + 1} scale={effectiveScale} aspect={aspect} label={`${t.page} ${i + 1} ${t.of} ${doc.numPages}`} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
