import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionary";
import { HUB_CATEGORIES, type HubCategory } from "@/lib/hub/categories";

/** Section navigation for the MAVERICKS experience: overview, the seven directions, the team. */
export function HubNav({ t, current }: { t: Dictionary; current: "overview" | "team" | HubCategory }) {
  const items: { key: string; href: string; label: string }[] = [
    { key: "overview", href: "/mavericks", label: t.hub.overview },
    ...HUB_CATEGORIES.map((c) => ({ key: c, href: `/mavericks/${c}`, label: c.charAt(0).toUpperCase() + c.slice(1) })),
    { key: "team", href: "/mavericks/team", label: t.nav.team },
  ];
  return (
    <nav aria-label="MAVERICKS" className="border-b border-line">
      <div className="mx-auto flex max-w-content items-center gap-6 px-5 lg:px-10">
        <span className="hidden shrink-0 text-[15px] font-semibold text-ink sm:block">MAVERICKS</span>
        <ul className="-mr-5 flex flex-1 gap-1 overflow-x-auto pr-5 [scrollbar-width:none] lg:mr-0 lg:pr-0">
          {items.map((i) => {
            const on = i.key === current;
            return (
              <li key={i.key} className="shrink-0">
                <Link href={i.href} aria-current={on ? "page" : undefined}
                  className={`relative flex h-12 items-center px-2.5 text-[15px] transition-colors ${on ? "font-medium text-ink" : "text-ink-muted hover:text-ink"}`}>
                  {i.label}
                  {on && <span aria-hidden className="absolute inset-x-2.5 bottom-0 h-[2px] bg-navy" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
