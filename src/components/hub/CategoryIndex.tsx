import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionary";
import { HUB_CATEGORIES, categoryTitle, type HubCategory } from "@/lib/hub/categories";

/**
 * The seven categories as a typographic index — numbered rows, not cards. "full" shows the
 * description and published count; "compact" is the two-column homepage version.
 */
export function CategoryIndex({ t, counts, variant = "full" }: { t: Dictionary; counts: Record<HubCategory, number> | null; variant?: "full" | "compact" }) {
  const H = t.hub;
  if (variant === "compact") {
    return (
      <ol className="grid border-t border-rule sm:grid-cols-2 sm:gap-x-6">
        {HUB_CATEGORIES.map((c, i) => (
          <li key={c} className="border-b border-line">
            <Link href={`/mavericks/${c}`} className="group flex items-baseline gap-4 py-4">
              <span className="t-num w-6 shrink-0 text-[12px] text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
              <span className="min-w-0">
                <span className="font-display block text-[17px] font-medium tracking-[-0.02em] text-ink decoration-accent decoration-1 underline-offset-[5px] group-hover:underline">{categoryTitle(c)}</span>
                <span className="mt-0.5 block text-[13px] text-ink-faint">{H.categories[c].tagline}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    );
  }
  return (
    <ol className="border-t border-rule">
      {HUB_CATEGORIES.map((c, i) => {
        const n = counts?.[c] ?? 0;
        return (
          <li key={c} className="border-b border-line">
            <Link href={`/mavericks/${c}`} className="group grid gap-x-6 gap-y-2 py-7 transition-colors hover:bg-paper/60 sm:grid-cols-[3rem_1fr] lg:grid-cols-12 lg:items-baseline lg:py-9">
              <span className="t-num text-[13px] text-ink-faint lg:col-span-1">{String(i + 1).padStart(2, "0")}</span>
              <span className="lg:col-span-5">
                <span className="font-display block text-[clamp(1.5rem,2.8vw,2.375rem)] font-normal leading-[1.1] tracking-[-0.035em] text-ink">
                  <span className="text-ink-faint">MAVERICKS</span> <span className="transition-colors group-hover:text-accent">{c.charAt(0).toUpperCase() + c.slice(1)}</span>
                </span>
                <span className="mt-2 block text-[14px] font-medium text-ink-muted">{H.categories[c].tagline}</span>
              </span>
              <span className="text-[15px] leading-relaxed text-ink-muted sm:col-start-2 lg:col-span-4 lg:col-start-7">{H.categories[c].description}</span>
              <span className="flex items-baseline justify-between gap-4 text-[13px] text-ink-faint sm:col-start-2 lg:col-span-2 lg:col-start-11 lg:justify-end">
                <span>{n ? <><span className="t-num font-medium text-ink">{n}</span> {H.entries}</> : null}</span>
                <span aria-hidden className="text-ink transition-transform duration-200 group-hover:translate-x-1">→</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
