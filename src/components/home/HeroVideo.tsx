"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Background video for the hero. Autoplays muted and looped unless the user
 * prefers reduced motion; on small screens only the poster is shown to save data.
 */
export function HeroVideo({ src, poster, labels }: { src: string | null; poster: string | null; labels: { pause: string; play: string } }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!src) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.matchMedia("(max-width: 640px)").matches;
    setEnabled(!reduce && !small);
  }, [src]);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) void v.play(); else v.pause();
  };

  return (
    <>
      {poster && !enabled && (
        // eslint-disable-next-line @next/next/no-img-element -- remote storage poster, sized by CSS
        <img src={poster} alt="" className="absolute inset-0 size-full object-cover" />
      )}
      {src && enabled && (
        <>
          <video
            ref={ref}
            className="absolute inset-0 size-full object-cover"
            src={src}
            poster={poster ?? undefined}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
          <button
            type="button"
            onClick={toggle}
            className="absolute bottom-6 right-5 z-20 inline-flex items-center gap-2 text-[13px] font-medium text-white/80 hover:text-white lg:right-10"
          >
            <svg aria-hidden viewBox="0 0 24 24" className="size-3.5" fill="currentColor">
              {playing ? <path d="M7 5h3v14H7zM14 5h3v14h-3z" /> : <path d="M8 5v14l11-7z" />}
            </svg>
            {playing ? labels.pause : labels.play}
          </button>
        </>
      )}
    </>
  );
}
