"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setUiLocale } from "@/app/actions";
import { LOCALE_LABELS, UI_LOCALES, type UiLocale } from "@/i18n/config";

/** Interface-language switch: four codes, the current one marked. Keyboard and screen-reader friendly. */
export function LanguageSwitcher({ locale, label, variant = "inline" }: { locale: UiLocale; label: string; variant?: "inline" | "stacked" }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const choose = (l: UiLocale) => start(async () => { await setUiLocale(l); router.refresh(); });
  return (
    <div role="group" aria-label={label} className={variant === "stacked" ? "grid grid-cols-4 overflow-hidden rounded-md border border-line" : "flex items-center gap-0.5"}>
      {UI_LOCALES.map((l, i) => {
        const on = l === locale;
        return (
          <button
            key={l}
            type="button"
            lang={l}
            disabled={pending}
            aria-pressed={on}
            title={LOCALE_LABELS[l]}
            onClick={() => !on && choose(l)}
            className={
              variant === "stacked"
                ? `h-12 text-[16px] font-semibold ${i ? "border-l border-line" : ""} ${on ? "bg-navy text-white" : "text-ink hover:bg-soft"}`
                : `h-10 min-w-9 px-1.5 text-[14px] xl:min-w-10 xl:px-2 font-semibold uppercase tracking-[0.04em] transition-colors ${on ? "text-ink underline decoration-2 underline-offset-[8px]" : "text-ink-muted hover:text-ink"}`
            }
          >
            <span aria-hidden={variant === "inline"}>{variant === "stacked" ? LOCALE_LABELS[l] : l}</span>
            {variant === "inline" && <span className="sr-only">{LOCALE_LABELS[l]}</span>}
          </button>
        );
      })}
    </div>
  );
}
