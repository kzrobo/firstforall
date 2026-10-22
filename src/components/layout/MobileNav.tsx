"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { UiLocale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionary";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function MobileNav({ items, t, locale }: { items: { href: string; label: string }[]; t: Dictionary; locale: UiLocale }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const pathname = usePathname();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); buttonRef.current?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-10 items-center justify-center rounded-md text-white hover:bg-white/10"
      >
        <span className="sr-only">{open ? t.nav.close : t.nav.menu}</span>
        <svg aria-hidden className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {open && (
        <div id={panelId} className="absolute inset-x-0 top-16 border-t border-white/10 bg-navy px-5 pb-6 pt-2 shadow-xl">
          <nav aria-label="Mobile">
            <ul className="divide-y divide-white/10">
              {items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="block py-3.5 text-base font-medium text-white">{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-4 flex items-center gap-3">
            <LanguageSwitcher locale={locale} label={t.nav.language} />
            <Link href="/manuals" className="inline-flex h-9 items-center rounded-md bg-honey px-4 text-sm font-semibold text-navy">{t.nav.explore}</Link>
          </div>
        </div>
      )}
    </div>
  );
}
