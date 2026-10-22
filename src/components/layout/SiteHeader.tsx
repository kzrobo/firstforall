import Link from "next/link";
import type { UiLocale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionary";
import { BrandMark } from "./BrandMark";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileNav } from "./MobileNav";
import { NavLinks } from "./NavLinks";

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
    <header className="on-dark sticky top-0 z-40 text-white">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:bg-honey focus:px-3 focus:py-2 focus:text-night">
        {t.nav.skip}
      </a>
      {/* Tier 1 — identity and primary navigation */}
      <div className="bg-night">
        <div className="mx-auto flex h-16 max-w-content items-stretch px-5 lg:px-10">
          <Link href="/" className="flex items-center" aria-label="MAVERICKS FTC #24034 — FIRST FOR ALL, home">
            <BrandMark />
          </Link>
          <nav aria-label="Primary" className="ml-auto hidden lg:block">
            <NavLinks items={items} />
          </nav>
          <Link href="/login" className="ml-6 hidden items-center gap-2 text-[13px] font-medium text-white/60 hover:text-white lg:flex">
            {t.landing.signIn}
          </Link>
          <div className="ml-auto flex items-center lg:hidden">
            <MobileNav items={items} t={t} locale={locale} />
          </div>
        </div>
      </div>
      {/* Tier 2 — programme and documentation utilities */}
      <div className="hidden border-t border-white/[0.06] bg-night-2 lg:block">
        <div className="mx-auto flex h-11 max-w-content items-center gap-7 px-5 text-[14px] lg:px-10">
          <span className="t-label text-white/50">{t.landing.programme} — {t.meta.tagline}</span>
          <Link href="/manuals#search" className="ml-auto flex items-center gap-2 text-white/80 hover:text-white">
            <svg aria-hidden className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
            {t.nav.search}
          </Link>
          <LanguageSwitcher locale={locale} label={t.nav.language} />
          <Link href="/manuals" className="link-arrow text-honey hover:text-[#f3cd74]">{t.nav.explore}</Link>
        </div>
      </div>
    </header>
  );
}
