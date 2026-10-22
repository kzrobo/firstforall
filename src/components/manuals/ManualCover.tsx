import type { Manual } from "@/lib/manuals/types";

/** Real cover if uploaded; otherwise a typographic document plate (clearly not a photo). */
export function ManualCover({ manual, className = "" }: { manual: Manual; className?: string }) {
  if (manual.coverUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- storage-hosted cover
    return <img src={manual.coverUrl} alt={`${manual.title} cover`} className={`aspect-[8.5/11] w-full border border-line bg-paper object-cover ${className}`} />;
  }
  return (
    <div className={`flex aspect-[8.5/11] w-full flex-col justify-between border border-line bg-paper p-6 ${className}`} aria-hidden>
      <div className="h-1 w-10 bg-honey" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">{manual.season}{manual.seasonName ? ` · ${manual.seasonName}` : ""}</p>
        <p className="mt-2 text-xl font-semibold leading-tight text-navy">{manual.title}</p>
      </div>
      <p className="text-xs text-ink-muted">Rev. {manual.revision}</p>
    </div>
  );
}
