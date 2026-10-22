"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setUiLocale } from "@/app/actions";
import { LOCALE_LABELS, UI_LOCALES, type UiLocale } from "@/i18n/config";

export function LanguageSwitcher({ locale, label }: { locale: UiLocale; label: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <label className="relative inline-flex items-center text-white/80 hover:text-white">
      <span className="sr-only">{label}</span>
      <svg aria-hidden className="pointer-events-none absolute left-0 size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
      </svg>
      <select
        value={locale}
        disabled={pending}
        onChange={(e) => start(async () => { await setUiLocale(e.target.value); router.refresh(); })}
        className="h-9 cursor-pointer appearance-none bg-transparent pl-6 pr-4 text-[14px] [&>option]:text-ink"
      >
        {UI_LOCALES.map((l) => (
          <option key={l} value={l} lang={l}>{LOCALE_LABELS[l as UiLocale]}</option>
        ))}
      </select>
      <svg aria-hidden className="pointer-events-none absolute right-0 size-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m3 4.5 3 3 3-3" /></svg>
    </label>
  );
}
