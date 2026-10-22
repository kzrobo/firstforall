"use client";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { memo, useEffect, useRef, useState } from "react";

/** One page slot. Renders to canvas only while near the viewport. */
export const PdfPage = memo(function PdfPage({ doc, pageNumber, scale, aspect, label }: {
  doc: PDFDocumentProxy; pageNumber: number; scale: number; aspect: number; label: string;
}) {
  const slot = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = slot.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "800px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let task: RenderTask | null = null;
    let cancelled = false;
    (async () => {
      const page = await doc.getPage(pageNumber);
      if (cancelled || !canvas.current) return;
      const viewport = page.getViewport({ scale });
      const ratio = window.devicePixelRatio || 1;
      const c = canvas.current;
      c.width = Math.floor(viewport.width * ratio);
      c.height = Math.floor(viewport.height * ratio);
      setSize({ w: viewport.width, h: viewport.height });
      task = page.render({ canvasContext: c.getContext("2d")!, viewport, transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined });
      await task.promise.catch(() => undefined);
    })();
    return () => { cancelled = true; task?.cancel(); };
  }, [visible, doc, pageNumber, scale]);

  const baseWidth = 612 * scale; // US Letter width in points until the real size is known
  const w = size?.w ?? baseWidth;
  const h = size?.h ?? baseWidth * aspect;
  return (
    <div
      ref={slot}
      data-page={pageNumber}
      role="img"
      aria-label={label}
      className="relative mx-auto shrink-0 bg-white shadow-[0_1px_2px_rgba(14,22,32,0.10),0_12px_32px_-18px_rgba(14,22,32,0.25)]"
      style={{ width: w, height: h }}
    >
      {visible && <canvas ref={canvas} style={{ width: w, height: h }} className="block" />}
    </div>
  );
});
