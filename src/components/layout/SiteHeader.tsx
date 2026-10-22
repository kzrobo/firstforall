import Image from "next/image";
import Link from "next/link";
import type { UiLocale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionary";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileNav } from "./MobileNav";

export function navItems(t: Dictionary) {
  return [
    { href: "/manuals", label: t.nav.manuals },
    { href: "/guides", label: t.nav.guides },
    { href: "/ai", label: t.nav.ai },
    { href: "/about#initiative", label: t.nav.initiative },
    { href: "/about", label: t.nav.about },
  ];
}

export function SiteHeader({ t, locale }: { t: Dictionary; locale: UiLocale }) {
  const items = navItems(t);
  return (
    <header className="on-dark sticky top-0 z-40 bg-navy text-white">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:rounded focus:bg-honey focus:px-3 focus:py-2 focus:text-navy">
        {t.nav.skip}
      </a>
      <div className="mx-auto flex h-16 max-w-content items-center gap-6 px-5 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="MAVERICKS FTC #24034 — FIRST FOR ALL">
          <Image src="/brand/mavericks-emblem.jpg" alt="" width={36} height={36} className="rounded-sm" priority />
          <span className="hidden leading-tight sm:block">
            <span className="block text-[13px] font-semibold tracking-wide">FIRST FOR ALL</span>
            <span className="block text-[11px] text-white/60">MAVERICKS #24034</span>
          </span>
        </Link>
        <nav aria-label="Primary" className="ml-4 hidden flex-1 lg:block">
          <ul className="flex items-center gap-1">
            {items.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="rounded px-3 py-2 text-[15px] font-medium text-white/85 hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/manuals#search" className="hidden h-9 items-center gap-2 rounded-md px-2.5 text-sm text-white/85 hover:text-white md:inline-flex">
            <svg aria-hidden className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            {t.nav.search}
          </Link>
          <div className="hidden sm:block"><LanguageSwitcher locale={locale} label={t.nav.language} /></div>
          <Link href="/manuals" className="hidden h-9 items-center rounded-md bg-honey px-4 text-sm font-semibold text-navy hover:bg-[#f0c763] md:inline-flex">
            {t.nav.explore}
          </Link>
          <MobileNav items={items} t={t} locale={locale} />
        </div>
      </div>
    </header>
  );
}
