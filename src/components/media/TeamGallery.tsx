import type { MediaItem } from "@/lib/site/repository";
import { MediaSlot } from "./MediaSlot";

/** Layout per item, chosen by editors (team_gallery[].layout): an editorial mosaic, not uniform cards. */
const SPAN = {
  wide: { cls: "col-span-2 md:col-span-8", ratio: "3 / 2", sizes: "(min-width: 768px) 64vw, 100vw" },
  // On desktop a tall photo fills both rows it spans, so its height always matches its neighbours.
  tall: { cls: "col-span-1 md:col-span-4 md:row-span-2 [&_figure]:md:flex [&_figure]:md:h-full [&_figure]:md:flex-col [&_figure>div]:md:flex-1 [&_figure>div]:md:[aspect-ratio:auto]", ratio: "3 / 4", sizes: "(min-width: 768px) 32vw, 50vw" },
  standard: { cls: "col-span-1 md:col-span-4", ratio: "4 / 3", sizes: "(min-width: 768px) 32vw, 50vw" },
} as const;

/** Review-mode outline of a typical gallery, shown only while no photos are uploaded. */
const EMPTY: MediaItem["layout"][] = ["wide", "tall", "standard", "standard", "wide"];

export function TeamGallery({ items, showEmpty }: { items: MediaItem[]; showEmpty: boolean }) {
  const cells = items.length ? items.map((item) => ({ item, layout: item.layout })) : showEmpty ? EMPTY.map((layout) => ({ item: null, layout })) : [];
  if (!cells.length) return null;
  return (
    <ul className="grid grid-flow-dense grid-cols-2 gap-3 md:grid-cols-12 md:gap-5">
      {cells.map(({ item, layout }, i) => {
        const s = SPAN[layout];
        return (
          <li key={`${i}-${item?.url ?? "empty"}`} className={s.cls}>
            <MediaSlot item={item} slot={`team_gallery[${i}]`} ratio={s.ratio} sizes={s.sizes} showEmpty={showEmpty} className="h-full" />
          </li>
        );
      })}
    </ul>
  );
}
