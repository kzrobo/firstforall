import Image from "next/image";
import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionary";
import { HUB_CATEGORIES, categoryTitle, type HubCategory } from "@/lib/hub/categories";

/**
 * The seven directions as a studio-style directory: the direction name large, its description
 * beside it, and — only where a real published photo exists — a small image. "MAVERICKS" is
 * stated once in the page heading; each link still carries the full brand name for assistive tech.
 */
export function CategoryIndex({ t, counts, images = {} }: {
  t: Dictionary; counts: Record<HubCategory, number> | null; images?: Partial<Record<HubCategory, string>>;
}) {
  const H = t.hub;
  return (
    <ul className="border-t border-ink">
      {HUB_CATEGORIES.map((c) => {
        const n = counts?.[c] ?? 0;
        const img = images[c];
        return (
          <li key={c} className="border-b border-line">
            <Link href={`/mavericks/${c}`} aria-label={`${categoryTitle(c)} — ${H.categories[c].tagline}`}
              className="group grid items-center gap-x-6 gap-y-3 py-7 sm:grid-cols-[1fr_auto] lg:grid-cols-12 lg:py-9">
              <span className="lg:col-span-5">
                <span className="block text-[clamp(1.875rem,3.6vw,3rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-ink transition-colors group-hover:text-navy">
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </span>
                <span className="mt-2 block text-[16px] font-medium text-ink-muted">{H.categories[c].tagline}</span>
              </span>
              <span className="text-[16px] leading-relaxed text-ink-muted sm:col-span-2 lg:col-span-4 lg:col-start-6">{H.categories[c].description}</span>
              <span className="flex items-center justify-between gap-6 sm:col-span-2 lg:col-span-3 lg:col-start-10 lg:justify-end">
                {img ? (
                  <span className="relative hidden aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-[3px] bg-soft sm:block">
                    <Image src={img} alt="" fill sizes="112px" className="object-cover" />
                  </span>
                ) : null}
                <span className="text-[15px] text-ink-muted">{n ? <><span className="t-num font-semibold text-ink">{n}</span> {H.entries}</> : null}</span>
                <span aria-hidden className="text-[20px] text-ink transition-transform duration-200 group-hover:translate-x-1">→</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
