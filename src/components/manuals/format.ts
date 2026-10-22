export function formatBytes(bytes: number | null): string | null {
  if (!bytes) return null;
  const mb = bytes / 1024 / 1024;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function readerHref(slug: string, lang: string, page?: number): string {
  const qs = new URLSearchParams({ lang });
  if (page && page > 1) qs.set("page", String(page));
  return `/manuals/${encodeURIComponent(slug)}/read?${qs}`;
}
