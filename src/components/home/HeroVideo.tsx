"use client";
import { useEffect, useRef, useState } from "react";
import type { MediaItem } from "@/lib/site/repository";

/**
 * Background media for the hero. Video autoplays muted and looped unless the user
 * prefers reduced motion or is on a small screen, where the poster is shown instead.
 */
export function HeroVideo({ video, poster, posterMobile, labels }: {
  video: MediaItem | null; poster: MediaItem | null; posterMobile: MediaItem | null; labels: { pause: string; play: string };
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!video) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.matchMedia("(max-width: 640px)").matches;
    setEnabled(!reduce && !small);
  }, [video]);

  const still = poster ?? posterMobile;

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) void v.play(); else v.pause();
  };

  return (
    <div className="absolute inset-0 -z-10">
      {still && !enabled && (
        <picture>
          {posterMobile && <source media="(max-width: 640px)" srcSet={posterMobile.url} />}
          <img src={still.url} alt={still.alt} fetchPriority="high" className="size-full object-cover" />
        </picture>
      )}
      {video && enabled && (
        <>
          <video
            ref={ref}
            className="size-full object-cover"
            src={video.url}
            poster={poster?.url}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={video.alt || undefined}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
          <button type="button" onClick={toggle}
            className="absolute right-5 top-5 z-20 inline-flex items-center gap-2 text-[13px] font-medium text-white/75 hover:text-white lg:right-10 lg:top-8">
            <svg aria-hidden viewBox="0 0 24 24" className="size-3.5" fill="currentColor">
              {playing ? <path d="M7 5h3v14H7zM14 5h3v14h-3z" /> : <path d="M8 5v14l11-7z" />}
            </svg>
            {playing ? labels.pause : labels.play}
          </button>
        </>
      )}
    </div>
  );
}
