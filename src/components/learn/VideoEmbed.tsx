"use client";
import { useState } from "react";
import { youTubeEmbedUrl } from "@/lib/learn/youtube";
import { PlayMark, YouTubeThumb } from "./YouTubeThumb";

/**
 * Click-to-play YouTube embed. Nothing from YouTube loads (no iframe, no cookies)
 * until the visitor presses play; then the privacy-enhanced player starts.
 */
export function VideoEmbed({ id, title, playLabel }: { id: string; title: string; playLabel: string }) {
  const [playing, setPlaying] = useState(false);
  if (playing) {
    return (
      <div className="relative aspect-video w-full bg-black">
        <iframe
          src={youTubeEmbedUrl(id, { autoplay: true })}
          title={title}
          className="absolute inset-0 size-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <button type="button" onClick={() => setPlaying(true)} className="group relative block w-full text-left" aria-label={`${playLabel}: ${title}`}>
      <YouTubeThumb id={id} title={title} priority />
      <span className="absolute inset-0 flex items-center justify-center bg-navy/10 transition-colors group-hover:bg-navy/20">
        <PlayMark size="lg" />
      </span>
    </button>
  );
}
