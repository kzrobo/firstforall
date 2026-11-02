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
    <div role="group" aria-label={label} className={variant === "stacked" ? "grid grid-cols-4 border border-line" : "flex items-center"}>
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
                ? `h-12 text-[14px] font-medium ${i ? "border-l border-line" : ""} ${on ? "bg-ink text-canvas" : "text-ink hover:bg-soft"}`
                : `h-8 min-w-8 px-1.5 text-[12px] font-semibold uppercase tracking-[0.04em] transition-colors ${on ? "text-ink underline decoration-accent decoration-2 underline-offset-[6px]" : "text-ink-faint hover:text-ink"}`
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
