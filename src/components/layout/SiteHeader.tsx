import Link from "next/link";
import type { UiLocale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionary";
import { BrandMark } from "./BrandMark";
import { HeaderShell } from "./HeaderShell";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileNav } from "./MobileNav";
import { NavLinks } from "./NavLinks";

export function navItems(t: Dictionary) {
  return [
    { href: "/", label: t.nav.home },
    { href: "/manuals", label: t.nav.manuals },
    { href: "/learn", label: t.nav.learn },
    { href: "/mavericks", label: t.nav.mavericks },
    { href: "/about", label: t.nav.about },
  ];
}

export function SiteHeader({ t, locale }: { t: Dictionary; locale: UiLocale }) {
  const items = navItems(t);
  return (
    <HeaderShell>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:bg-accent focus:px-3 focus:py-2 focus:text-canvas">
        {t.nav.skip}
      </a>
      <div className="mx-auto grid h-16 max-w-content grid-cols-[1fr_auto] items-center gap-6 px-5 lg:h-[72px] lg:grid-cols-[1fr_auto_1fr] lg:px-10">
        <Link href="/" className="justify-self-start" aria-label="FIRST FOR ALL — MAVERICKS FTC #24034">
          <BrandMark tone="dark" />
        </Link>
        <nav aria-label={t.nav.primary} className="hidden lg:block">
          <NavLinks items={items} />
        </nav>
        <div className="hidden items-center justify-self-end gap-5 lg:flex">
          <LanguageSwitcher locale={locale} label={t.nav.language} />
        </div>
        <div className="justify-self-end lg:hidden">
          <MobileNav items={items} t={t} locale={locale} />
        </div>
      </div>
    </HeaderShell>
  );
}
