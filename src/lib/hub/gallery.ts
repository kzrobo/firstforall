import { categoryTitle } from "./categories";
import type { HubEntry } from "./types";

/** One tile of the project gallery: a real image of the entry, never a placeholder. */
export interface GalleryItem {
  id: string;
  href: string;
  title: string;
  category: string;
  description: string | null;
  image: string;
  alt: string;
}

/**
 * Picks each entry's image (cover, else its first photo or graphic, else any image) and skips entries
 * without one — the gallery only shows authentic uploaded material.
 */
export function toGalleryItems(entries: HubEntry[], hrefFor: (e: HubEntry) => string): GalleryItem[] {
  return entries.flatMap((e) => {
    const visual = e.media.find((m) => m.kind !== "screenshot") ?? e.media[0] ?? null;
    const coverMedia = e.coverPath ? e.media.find((m) => m.path === e.coverPath) : undefined;
    const image = e.coverUrl ?? visual?.url ?? null;
    if (!image) return [];
    return [{
      id: e.id,
      href: hrefFor(e),
      title: e.title,
      category: categoryTitle(e.category),
      description: e.subtitle ?? e.summary ?? null,
      image,
      alt: (coverMedia ?? (e.coverUrl ? undefined : visual))?.alt || e.title,
    }];
  });
}
