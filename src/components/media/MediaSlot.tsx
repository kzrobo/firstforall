import type { MediaItem } from "@/lib/site/repository";

interface Props {
  item: MediaItem | null;
  /** site_settings key, shown on the empty frame so editors know where to upload */
  slot: string;
  ratio: string;
  showEmpty: boolean;
  className?: string;
  priority?: boolean;
  tone?: "light" | "dark";
}

/**
 * A configurable photograph with caption. Renders nothing when empty in production;
 * in review mode it renders a labelled frame describing what belongs there.
 */
export function MediaSlot({ item, slot, ratio, showEmpty, className = "", priority = false, tone = "light" }: Props) {
  if (item) {
    return (
      <figure className={className}>
        {/* eslint-disable-next-line @next/next/no-img-element -- storage-hosted team photography */}
        <img src={item.url} alt={item.alt} loading={priority ? "eager" : "lazy"} decoding="async" className="w-full object-cover" style={{ aspectRatio: ratio }} />
        {item.caption && <figcaption className={`mt-3 text-[13px] ${tone === "dark" ? "text-white/55" : "text-ink-muted"}`}>{item.caption}</figcaption>}
      </figure>
    );
  }
  if (!showEmpty) return null;
  const frame = tone === "dark" ? "bg-white/[0.04] text-white/45 ring-white/10" : "bg-soft text-ink-faint ring-line";
  return (
    <figure className={className} aria-hidden>
      <div className={`relative flex w-full items-end p-5 ring-1 ring-inset ${frame}`} style={{ aspectRatio: ratio }}>
        <span className="absolute left-4 top-4 h-3 w-3 border-l border-t border-current" />
        <span className="absolute right-4 top-4 h-3 w-3 border-r border-t border-current" />
        <span className="absolute bottom-4 left-4 h-3 w-3 border-b border-l border-current" />
        <span className="absolute bottom-4 right-4 h-3 w-3 border-b border-r border-current" />
        <span className="pb-2 pl-4 text-[12px] font-medium tracking-[0.04em]">MAVERICKS photograph · slot <code>{slot}</code></span>
      </div>
    </figure>
  );
}
