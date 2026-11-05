"use client";
import type { PDFDocumentProxy } from "pdfjs-dist";

let lib: Promise<typeof import("pdfjs-dist")> | null = null;

/** Loads PDF.js on demand (keeps it out of every other route's bundle). */
export function loadPdfJs() {
  lib ??= import("pdfjs-dist").then((m) => {
    m.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
    return m;
  });
  return lib;
}

/**
 * Options for every getDocument call. The character maps and standard fonts (copied from the
 * installed pdfjs-dist into /public/pdfjs) let PDF.js show text in fonts that are not embedded —
 * notably Chinese, Japanese and Korean CID fonts, which it otherwise drops silently.
 */
export const PDF_OPTIONS = {
  isEvalSupported: false,
  cMapUrl: "/pdfjs/cmaps/",
  cMapPacked: true,
  standardFontDataUrl: "/pdfjs/standard_fonts/",
} as const;

export interface OutlineEntry { title: string; page: number | null; children: OutlineEntry[] }

export async function readOutline(doc: PDFDocumentProxy): Promise<OutlineEntry[]> {
  const outline = await doc.getOutline();
  if (!outline) return [];
  const resolve = async (dest: unknown): Promise<number | null> => {
    try {
      const explicit = typeof dest === "string" ? await doc.getDestination(dest) : (dest as unknown[] | null);
      if (!explicit?.[0]) return null;
      return (await doc.getPageIndex(explicit[0] as never)) + 1;
    } catch {
      return null;
    }
  };
  type Node = { title: string; dest: unknown; items: Node[] };
  const walk = async (nodes: Node[]): Promise<OutlineEntry[]> =>
    Promise.all(nodes.map(async (n) => ({ title: n.title, page: await resolve(n.dest), children: await walk(n.items ?? []) })));
  return walk(outline as unknown as Node[]);
}

/** Case-insensitive search across page text. Returns 1-based page numbers with hit counts. */
export async function searchDocument(
  doc: PDFDocumentProxy,
  query: string,
  cache: Map<number, string>,
): Promise<{ page: number; count: number }[]> {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return [];
  const results: { page: number; count: number }[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    let text = cache.get(i);
    if (text === undefined) {
      const content = await (await doc.getPage(i)).getTextContent();
      text = content.items.map((it) => ("str" in it ? it.str : "")).join(" ").toLocaleLowerCase();
      cache.set(i, text);
    }
    let count = 0;
    for (let at = text.indexOf(needle); at !== -1; at = text.indexOf(needle, at + needle.length)) count++;
    if (count) results.push({ page: i, count });
  }
  return results;
}
