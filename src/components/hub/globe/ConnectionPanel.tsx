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
      className="fixed inset-x-0 bottom-0 z-30 max-h-[78svh] overflow-y-auto border-t border-rule bg-paper p-5 shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.6)] outline-none sm:p-6 lg:absolute lg:inset-x-auto lg:bottom-auto lg:right-0 lg:top-0 lg:max-h-[min(78svh,760px)] lg:w-[400px] lg:border lg:border-rule"
    >
      <div className="flex items-start justify-between gap-4">
        <p className="t-index">{many ? `${views.length} ${labels.teams}` : v?.countryName}</p>
        <button type="button" onClick={onClose} className="-m-2 p-2 text-[13px] font-medium text-ink-muted hover:text-ink">{labels.close} ✕</button>
      </div>

      {many ? (
        <ul className="mt-4 border-t border-line">
          {views.map((x) => (
            <li key={x.id} className="border-b border-line">
              <button type="button" onClick={() => onPick(x.id)} className="flex w-full items-center gap-3 py-3 text-left hover:text-accent">
                <Logo v={x} size="sm" />
                <span><span className="block text-[15px] font-medium text-ink">{x.teamName}</span><span className="text-[13px] text-ink-faint">{x.countryName}{x.city ? ` · ${x.city}` : ""}</span></span>
              </button>
            </li>
          ))}
        </ul>
      ) : v ? (
        <article className="mt-4">
          <div className="flex items-center gap-4">
            <Logo v={v} size="lg" />
            <div>
              <h3 className="font-display text-[20px] font-medium leading-tight tracking-[-0.02em] text-ink">{v.teamName}</h3>
              <p className="mt-1 text-[13px] text-ink-muted">{[v.city, v.countryName].filter(Boolean).join(", ")}</p>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 border-t border-line pt-4 text-[14px]">
            {v.teamNumber && <><dt className="text-ink-faint">{labels.ftcNumber}</dt><dd className="t-num text-ink">#{v.teamNumber}</dd></>}
            {v.dateLabel && <><dt className="text-ink-faint">{labels.date}</dt><dd className="text-ink">{v.dateLabel}</dd></>}
          </dl>
          {v.precision === "country" && <p className="mt-2 text-[12px] text-ink-faint">{labels.countryLevel}</p>}
          {v.summary && <p className="mt-5 text-[15px] leading-relaxed text-ink-muted">{v.summary}</p>}
          {v.topics && <><h4 className="t-index mt-5">{labels.topics}</h4><p className="mt-1.5 whitespace-pre-line text-[14px] leading-relaxed text-ink">{v.topics}</p></>}
          {v.outcomes && <><h4 className="t-index mt-5">{labels.outcomes}</h4><p className="mt-1.5 whitespace-pre-line text-[14px] leading-relaxed text-ink">{v.outcomes}</p></>}
          {v.screenshots.length > 0 && (
            <>
              <h4 className="t-index mt-5">{labels.screenshots}</h4>
              <ul className="mt-2 grid grid-cols-2 gap-2">
                {v.screenshots.slice(0, 4).map((s) => (
                  // eslint-disable-next-line @next/next/no-img-element -- storage-hosted screenshot thumbnails inside a client panel
                  <li key={s.url}><img src={s.url} alt={s.alt} loading="lazy" className="aspect-video w-full bg-soft object-cover" /></li>
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
    <img src={v.logoUrl} alt="" className={`${box} shrink-0 rounded-full bg-ink object-contain p-1`} />
  ) : (
    <span aria-hidden className={`${box} flex shrink-0 items-center justify-center rounded-full bg-soft text-[12px] font-semibold text-ink`}>
      {v.teamName.split(/\s+/).slice(0, 2).map((w) => w[0]).join("")}
    </span>
  );
}
