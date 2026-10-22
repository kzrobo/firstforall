import Image from "next/image";
import type { MediaItem } from "@/lib/site/repository";

interface Props {
  item: MediaItem | null;
  /** site_settings key, shown on the empty frame so editors know where to upload */
  slot: string;
  ratio: string;
  /** optional taller crop on phones, e.g. "4 / 5" for a 21:9 desktop band */
  ratioMobile?: string;
  showEmpty: boolean;
  /** next/image `sizes`, so phones never download desktop-sized files */
  sizes: string;
  className?: string;
  priority?: boolean;
  tone?: "light" | "dark";
}

/**
 * A configurable photograph with caption, optimised by next/image. The aspect-ratio box
 * reserves space (no layout shift); focal points keep faces in frame on every crop.
 * Renders nothing when empty in production; a labelled frame in review mode.
 */
export function MediaSlot({ item, slot, ratio, ratioMobile, showEmpty, sizes, className = "", priority = false, tone = "light" }: Props) {
  const box = { "--r": ratio, "--rm": ratioMobile ?? ratio } as React.CSSProperties;
  const boxClass = "[aspect-ratio:var(--rm)] sm:[aspect-ratio:var(--r)]";
  if (item) {
    return (
      <figure className={className}>
        <div className={`relative w-full overflow-hidden bg-soft ${boxClass}`} style={box}>
          <Image
            src={item.url}
            alt={item.alt}
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover [object-position:var(--fm)] sm:[object-position:var(--f)]"
            style={{ "--f": item.focus, "--fm": item.focusMobile } as React.CSSProperties}
          />
        </div>
        {item.caption && <figcaption className={`mt-3 text-[13px] leading-snug ${tone === "dark" ? "text-white/55" : "text-ink-muted"}`}>{item.caption}</figcaption>}
      </figure>
    );
  }
  if (!showEmpty) return null;
  const frame = tone === "dark" ? "bg-white/[0.04] text-white/45 ring-white/10" : "bg-soft text-ink-faint ring-line";
  return (
    <figure className={className} aria-hidden>
      <div className={`relative flex w-full items-end p-5 ring-1 ring-inset ${frame} ${boxClass}`} style={box}>
        <span className="absolute left-4 top-4 h-3 w-3 border-l border-t border-current" />
        <span className="absolute right-4 top-4 h-3 w-3 border-r border-t border-current" />
        <span className="absolute bottom-4 left-4 h-3 w-3 border-b border-l border-current" />
        <span className="absolute bottom-4 right-4 h-3 w-3 border-b border-r border-current" />
        <span className="pb-2 pl-4 text-[12px] font-medium tracking-[0.04em]">MAVERICKS photograph · slot <code>{slot}</code></span>
      </div>
    </figure>
  );
}
