"use client";
import { useState } from "react";
import { youTubeThumbnails } from "@/lib/learn/youtube";

/**
 * YouTube thumbnail in a fixed 16:9 frame. Tries maxres, then hq (always present; its
 * letterbox bars are cropped by object-cover), then a typographic fallback.
 */
export function YouTubeThumb({ id, title, priority = false, className = "" }: { id: string; title: string; priority?: boolean; className?: string }) {
  const urls = youTubeThumbnails(id);
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  const src = stage === 0 ? urls.maxres : urls.hq;
  return (
    <span className={`img-zoom relative block aspect-video w-full overflow-hidden bg-navy ${className}`}>
      {stage < 2 ? (
        // eslint-disable-next-line @next/next/no-img-element -- YouTube's CDN already serves sized JPEGs
        <img
          src={src}
          alt=""
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 size-full object-cover"
          onError={() => setStage((s) => (s === 0 ? 1 : 2))}
          // maxresdefault answers with a 120×90 grey placeholder instead of a 404 for some videos
          onLoad={(e) => { if (stage === 0 && e.currentTarget.naturalWidth <= 120) setStage(1); }}
        />
      ) : (
        <span aria-hidden className="absolute inset-0 flex items-end p-4 text-[13px] leading-snug text-white/70">{title}</span>
      )}
    </span>
  );
}

export function PlayMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const box = size === "lg" ? "size-16" : size === "sm" ? "size-9" : "size-12";
  return (
    <span aria-hidden className={`${box} flex items-center justify-center rounded-full bg-paper/95 text-ink shadow-[0_6px_20px_-6px_rgba(0,16,43,0.5)] transition-transform duration-200 group-hover:scale-105`}>
      <svg viewBox="0 0 24 24" className="ml-0.5 size-[38%]" fill="currentColor"><path d="M7 4.5v15l13-7.5z" /></svg>
    </span>
  );
}
