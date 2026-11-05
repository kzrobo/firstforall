"use client";
import { useEffect, useRef, useState } from "react";
import { PDF_OPTIONS, loadPdfJs } from "@/components/reader/pdf";

/** Renders page 1 of a published PDF as the document thumbnail, once scrolled into view. */
export function PdfThumbnail({ url, title }: { url: string; title: string }) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"idle" | "ready" | "failed">("idle");

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let cancelled = false;
    const io = new IntersectionObserver(async ([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      try {
        const pdfjs = await loadPdfJs();
        const doc = await pdfjs.getDocument({ url, ...PDF_OPTIONS, disableAutoFetch: true }).promise;
        const page = await doc.getPage(1);
        const base = page.getViewport({ scale: 1 });
        const ratio = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: (el.clientWidth / base.width) * ratio });
        const c = canvas.current;
        if (cancelled || !c) return void doc.destroy();
        c.width = Math.floor(viewport.width);
        c.height = Math.floor(viewport.height);
        await page.render({ canvasContext: c.getContext("2d")!, viewport }).promise;
        if (!cancelled) setState("ready");
        void doc.destroy();
      } catch {
        if (!cancelled) setState("failed");
      }
    }, { rootMargin: "200px" });
    io.observe(el);
    return () => { cancelled = true; io.disconnect(); };
  }, [url]);

  return (
    <div ref={box} className="relative aspect-[8.5/11] w-full overflow-hidden bg-paper ring-1 ring-line">
      <canvas ref={canvas} role="img" aria-label={`${title}, first page`} className={`size-full transition-opacity duration-300 ${state === "ready" ? "opacity-100" : "opacity-0"}`} />
      {state !== "ready" && (
        <div aria-hidden className="absolute inset-0 flex flex-col gap-2 p-[12%]">
          <span className="h-[6%] w-2/3 bg-soft" />
          <span className="mt-3 h-[2.5%] w-full bg-soft" /><span className="h-[2.5%] w-11/12 bg-soft" /><span className="h-[2.5%] w-full bg-soft" />
        </div>
      )}
    </div>
  );
}
