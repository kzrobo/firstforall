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
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="-mr-2 inline-flex h-11 items-center gap-2 px-2 text-[14px] font-medium text-white"
      >
        {open ? t.nav.close : t.nav.menu}
        <svg aria-hidden className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 8h16M4 16h16" />}
        </svg>
      </button>
      {open && (
        <div id={panelId} className="fixed inset-x-0 bottom-0 top-16 overflow-y-auto bg-night px-5 pb-10">
          <nav aria-label="Mobile">
            <ul>
              {items.map((item) => (
                <li key={item.href} className="border-b border-white/10">
                  <Link href={item.href} className="flex items-center justify-between py-4 text-[22px] font-semibold tracking-[-0.01em] text-white">
                    {item.label}<span aria-hidden className="text-white/40">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-8 flex flex-col gap-5 text-white/80">
            <Link href="/manuals#search" className="text-[15px]">{t.nav.search}</Link>
            <LanguageSwitcher locale={locale} label={t.nav.language} />
            <Link href="/login" className="text-[15px] text-white/60">{t.landing.signIn}</Link>
          </div>
        </div>
      )}
    </>
  );
}
