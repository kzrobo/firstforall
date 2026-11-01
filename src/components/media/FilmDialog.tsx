"use client";
import { useRef } from "react";

/** "Watch the film" button that opens the uploaded team film in a native modal dialog. */
export function FilmDialog({ src, poster, label, closeLabel, className = "" }: { src: string; poster?: string; label: string; closeLabel: string; className?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const close = () => { video.current?.pause(); dialog.current?.close(); };
  return (
    <>
      <button type="button" onClick={() => { dialog.current?.showModal(); void video.current?.play(); }} className={`group inline-flex items-center gap-3 ${className}`}>
        <span className="inline-flex size-11 items-center justify-center rounded-full ring-1 ring-current transition-colors group-hover:bg-white group-hover:text-navy">
          <svg aria-hidden viewBox="0 0 24 24" className="ml-0.5 size-4" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
        </span>
        <span className="text-[15px] font-semibold">{label}</span>
      </button>
      <dialog ref={dialog} onClose={() => video.current?.pause()} onClick={(e) => e.target === dialog.current && close()}
        className="m-auto w-[min(92vw,1200px)] bg-transparent p-0 backdrop:bg-navy/90">
        <div className="flex justify-end pb-3">
          <button type="button" onClick={close} className="text-[14px] font-medium text-white/80 hover:text-white">{closeLabel} ✕</button>
        </div>
        <video ref={video} src={src} poster={poster} controls playsInline preload="none" className="aspect-video w-full bg-black" />
      </dialog>
    </>
  );
}
