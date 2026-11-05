"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Cluster } from "@/lib/hub/geo";
import type { ConnectionView, GlobeLabels } from "./types";

/**
 * Detail panel for a selected marker: side panel on desktop, bottom sheet on phones.
 * Focus moves into the panel and Escape closes it. A cluster first lists its teams.
 */
export function ConnectionPanel({ cluster, views, labels, onClose, onPick }: {
  cluster: Cluster; views: ConnectionView[]; labels: GlobeLabels; onClose: () => void; onPick: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cluster, onClose]);

  const many = views.length > 1;
  const v = views[0];
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="dialog"
      aria-modal="false"
      aria-label={many ? `${views.length} ${labels.teams}` : v?.teamName}
      className="fixed inset-x-0 bottom-0 z-30 max-h-[78svh] overflow-y-auto overscroll-contain rounded-t-xl bg-canvas px-5 pb-6 shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.28)] outline-none sm:px-6 lg:absolute lg:inset-x-auto lg:bottom-auto lg:right-4 lg:top-4 lg:max-h-[min(calc(78svh-2rem),728px)] lg:w-[400px] lg:rounded-md lg:border lg:border-line lg:shadow-[0_18px_50px_-24px_rgba(0,16,43,0.35)]"
    >
      <div className="sticky top-0 z-10 -mx-5 flex items-center justify-between gap-4 border-b border-line bg-canvas px-5 py-3 sm:-mx-6 sm:px-6">
        <p className="text-[15px] font-medium text-ink-muted">{many ? `${views.length} ${labels.teams}` : v?.countryName}</p>
        <button type="button" onClick={onClose} className="-mr-2 inline-flex h-11 items-center px-2 text-[15px] font-medium text-ink hover:underline">{labels.close} ✕</button>
      </div>

      {many ? (
        <ul className="mt-1">
          {views.map((x) => (
            <li key={x.id} className="border-b border-line">
              <button type="button" onClick={() => onPick(x.id)} className="flex w-full items-center gap-3 py-3.5 text-left hover:bg-paper">
                <Logo v={x} size="sm" />
                <span><span className="block text-[16px] font-semibold text-ink">{x.teamName}</span><span className="text-[14px] text-ink-muted">{x.countryName}{x.city ? ` · ${x.city}` : ""}</span></span>
              </button>
            </li>
          ))}
        </ul>
      ) : v ? (
        <article className="mt-5">
          <div className="flex items-center gap-4">
            <Logo v={v} size="lg" />
            <div>
              <h3 className="text-[22px] font-semibold leading-tight tracking-[-0.025em] text-ink">{v.teamName}</h3>
              <p className="mt-1 text-[15px] text-ink-muted">{[v.city, v.countryName].filter(Boolean).join(", ")}</p>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 border-t border-line pt-4 text-[15px]">
            {v.teamNumber && <><dt className="text-ink-muted">{labels.ftcNumber}</dt><dd className="t-num text-ink">#{v.teamNumber}</dd></>}
            {v.dateLabel && <><dt className="text-ink-muted">{labels.date}</dt><dd className="text-ink">{v.dateLabel}</dd></>}
          </dl>
          {v.precision === "country" && <p className="mt-2 text-[14px] text-ink-muted">{labels.countryLevel}</p>}
          {v.summary && <p className="mt-5 text-[16px] leading-relaxed text-ink-muted">{v.summary}</p>}
          {v.topics && <><h4 className="t-label mt-5 text-ink">{labels.topics}</h4><p className="mt-1.5 whitespace-pre-line text-[15px] leading-relaxed text-ink">{v.topics}</p></>}
          {v.outcomes && <><h4 className="t-label mt-5 text-ink">{labels.outcomes}</h4><p className="mt-1.5 whitespace-pre-line text-[15px] leading-relaxed text-ink">{v.outcomes}</p></>}
          {v.screenshots.length > 0 && (
            <>
              <h4 className="t-label mt-5 text-ink">{labels.screenshots}</h4>
              <ul className="mt-2 grid grid-cols-2 gap-2">
                {v.screenshots.slice(0, 4).map((s) => (
                  // eslint-disable-next-line @next/next/no-img-element -- storage-hosted screenshot thumbnails inside a client panel
                  <li key={s.url}><img src={s.url} alt={s.alt} loading="lazy" className="aspect-video w-full rounded-[3px] bg-soft object-cover" /></li>
                ))}
              </ul>
            </>
          )}
          <Link href={v.href} className="btn-primary mt-6 w-full justify-center">{labels.open}</Link>
        </article>
      ) : null}
    </div>
  );
}

function Logo({ v, size }: { v: ConnectionView; size: "sm" | "lg" }) {
  const box = size === "lg" ? "size-14" : "size-9";
  return v.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- team logos from storage, small fixed box
    <img src={v.logoUrl} alt="" className={`${box} shrink-0 rounded-full bg-white object-contain p-0.5 ring-1 ring-line`} />
  ) : (
    <span aria-hidden className={`${box} flex shrink-0 items-center justify-center rounded-full bg-navy text-[13px] font-semibold text-white`}>
      {v.teamName.split(/\s+/).slice(0, 2).map((w) => w[0]).join("")}
    </span>
  );
}
