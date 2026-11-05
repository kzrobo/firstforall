import Image from "next/image";
import type { MediaItem } from "@/lib/site/repository";

/**
 * Justified-row gallery: every photo keeps its natural proportions, each row fills the full
 * width, and photos in a row share one height — so horizontal and vertical images mix freely
 * and no ordering ever leaves holes. The last row is not stretched.
 */
export function TeamGallery({ items, showEmpty }: { items: MediaItem[]; showEmpty: boolean }) {
  if (!items.length && !showEmpty) return null;
  const cells = items.length
    ? items.map((item) => ({ item, aspect: item.aspect }))
    : [3 / 2, 3 / 4, 4 / 3, 4 / 3, 16 / 9, 3 / 4].map((aspect) => ({ item: null, aspect })); // review-mode outline only
  return (
    <ul className="flex flex-wrap gap-2 [--row:150px] after:grow-[999] after:content-[''] sm:[--row:220px] md:gap-3 lg:[--row:300px]">
      {cells.map(({ item, aspect }, i) => (
        <li key={`${i}-${item?.url ?? "slot"}`} className="relative" style={{ flexGrow: aspect, flexBasis: `calc(var(--row) * ${aspect})` }}>
          <figure>
            <div className="relative w-full overflow-hidden rounded-[3px] bg-soft" style={{ paddingBottom: `${100 / aspect}%` }}>
              {item ? (
                <Image
                  src={item.url}
                  alt={item.alt}
                  fill
                  sizes="(min-width: 1024px) 45vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover [object-position:var(--fm)] sm:[object-position:var(--f)]"
                  style={{ "--f": item.focus, "--fm": item.focusMobile } as React.CSSProperties}
                />
              ) : (
                <span aria-hidden className="absolute inset-0 flex items-end p-3 text-[13px] text-ink-faint ring-1 ring-inset ring-line">team_gallery[{i}]</span>
              )}
            </div>
            {item?.caption && <figcaption className="mt-2 text-[14px] leading-snug text-ink-muted">{item.caption}</figcaption>}
          </figure>
        </li>
      ))}
    </ul>
  );
}
