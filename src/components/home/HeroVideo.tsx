"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { MediaItem } from "@/lib/site/repository";

/**
 * Full-bleed background video. Muted autoplay + loop + playsInline, started explicitly so it
 * really plays (not just a first frame). Reduced motion or data saver → poster only, with a
 * play control. The poster also covers the time before the first frame arrives.
 * Phones in portrait get the lighter portrait files (source `media` query) and poster when provided.
 */
const PHONE = "(max-width: 767px) and (orientation: portrait)";

export function HeroVideo({ video, poster, posterMobile = null, labels }: {
  video: MediaItem; poster: MediaItem | null; posterMobile?: MediaItem | null; labels: { pause: string; play: string };
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null); // null until we know the preference
  const [playing, setPlaying] = useState(false);
  const [phone, setPhone] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
    setPhone(window.matchMedia(PHONE).matches);
    setAllowed(!reduce && !saveData);
  }, []);

  useEffect(() => {
    const v = ref.current;
    if (!v || !allowed) return;
    v.muted = true; // property, not just the attribute: required for autoplay in every browser
    v.play().catch(() => setPlaying(false));
  }, [allowed]);

  const toggle = () => {
    const v = ref.current;
    if (!v) { setAllowed(true); return; }
    if (v.paused) void v.play(); else v.pause();
  };

  return (
    <>
    <div className="absolute inset-0 -z-10 overflow-hidden bg-canvas">
      {poster && (
        <Image src={poster.url} alt="" fill priority sizes="100vw"
          className={`object-cover transition-opacity duration-700 ${playing ? "opacity-0" : "opacity-100"} ${posterMobile ? "max-md:portrait:hidden" : ""}`}
          style={{ objectPosition: poster.focus }} />
      )}
      {posterMobile && (
        <Image src={posterMobile.url} alt="" fill priority sizes="100vw"
          className={`hidden object-cover transition-opacity duration-700 max-md:portrait:block ${playing ? "opacity-0" : "opacity-100"}`}
          style={{ objectPosition: posterMobile.focus }} />
      )}
      {allowed && (
        <video
          ref={ref}
          className="absolute inset-0 size-full object-cover"
          style={{ objectPosition: phone ? (video.mobileUrl ? "50% 50%" : video.focusMobile) : video.focus }}
          poster={(phone && posterMobile ? posterMobile : poster)?.url}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          aria-label={video.alt || undefined}
          onPlaying={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        >
          {video.mobileWebmUrl && <source src={video.mobileWebmUrl} media={PHONE} type="video/webm" />}
          {video.mobileUrl && <source src={video.mobileUrl} media={PHONE} type="video/mp4" />}
          {video.webmUrl && <source src={video.webmUrl} type="video/webm" />}
          <source src={video.url} type="video/mp4" />
        </video>
      )}
    </div>
    {allowed !== null && (
        <button type="button" onClick={toggle}
          className="absolute bottom-7 right-5 z-30 inline-flex items-center gap-2 text-[12px] font-medium text-ink/75 hover:text-ink lg:right-10">
          <svg aria-hidden viewBox="0 0 24 24" className="size-3" fill="currentColor">{playing ? <path d="M7 5h3v14H7zM14 5h3v14h-3z" /> : <path d="M8 5v14l11-7z" />}</svg>
          {playing ? labels.pause : labels.play}
        </button>
      )}
    </>
  );
}
