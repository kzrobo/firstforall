"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { UiLocale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionary";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { isActive, type NavItem } from "./NavLinks";

export function MobileNav({ items, t, locale }: { items: NavItem[]; t: Dictionary; locale: UiLocale }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const pathname = usePathname();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); buttonRef.current?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a")?.focus();
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
        className="font-display -mr-2 inline-flex h-11 items-center gap-2.5 px-2 text-[13px] font-medium text-ink"
      >
        {open ? t.nav.close : t.nav.menu}
        <span aria-hidden className="relative block h-3 w-5">
          <span className={`absolute left-0 h-[1.5px] w-5 bg-navy transition-transform ${open ? "top-1/2 rotate-45" : "top-0.5"}`} />
          <span className={`absolute left-0 h-[1.5px] w-5 bg-navy transition-transform ${open ? "top-1/2 -rotate-45" : "bottom-0.5"}`} />
        </span>
      </button>
      {open && (
        <div ref={panelRef} id={panelId} className="fixed inset-x-0 bottom-0 top-16 flex flex-col overflow-y-auto bg-canvas px-5 pb-8 pt-4">
          <nav aria-label={t.nav.primary}>
            <ol>
              {items.map((item, i) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href} className="border-b border-line">
                    <Link href={item.href} aria-current={active ? "page" : undefined} className="flex items-baseline gap-4 py-5">
                      <span className="t-num w-6 text-[12px] text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
                      <span className={`font-display text-[26px] font-medium tracking-[-0.03em] ${active ? "text-ink underline decoration-accent decoration-[3px] underline-offset-[8px]" : "text-ink"}`}>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </nav>
          <div className="mt-auto pt-10">
            <p className="t-index mb-3">{t.nav.language}</p>
            <LanguageSwitcher locale={locale} label={t.nav.language} variant="stacked" />
            <Link href="/login" className="mt-6 inline-block text-[14px] text-ink-muted">{t.nav.signIn}</Link>
          </div>
        </div>
      )}
    </>
  );
}
