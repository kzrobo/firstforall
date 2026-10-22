"use client";
import Link from "next/link";
import { useState } from "react";
import { languageName, nativeLanguageName } from "@/lib/languages";
import { readerHref } from "@/components/manuals/format";

interface Item { slug: string; title: string; season: string; languages: string[] }

export function LanguagePicker({ items, languages, locale, emptyLabel }: { items: Item[]; languages: string[]; locale: string; emptyLabel: string }) {
  const [lang, setLang] = useState(languages.includes(locale) ? locale : languages[0] ?? "");
  const matches = items.filter((m) => m.languages.includes(lang));
  if (!languages.length) return <p className="mt-10 text-ink-muted">{emptyLabel}</p>;
  return (
    <div className="mt-10 grid gap-10 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
      <div role="radiogroup" aria-label="Document language" className="flex flex-wrap gap-2 md:flex-col md:items-start">
        {languages.map((l) => (
          <button
            key={l}
            role="radio"
            aria-checked={lang === l}
            onClick={() => setLang(l)}
            className={`border-b-2 py-2 text-left text-lg font-medium md:text-2xl ${lang === l ? "border-honey text-navy" : "border-transparent text-ink-muted hover:text-navy"}`}
          >
            <span lang={l}>{nativeLanguageName(l)}</span>
            {nativeLanguageName(l) !== languageName(l, locale) && <span className="ml-2 text-sm text-ink-muted">{languageName(l, locale)}</span>}
          </button>
        ))}
      </div>
      <ul className="divide-y divide-line border-y border-line" aria-live="polite">
        {matches.length === 0 && <li className="py-5 text-ink-muted">{emptyLabel}</li>}
        {matches.map((m) => (
          <li key={m.slug}>
            <Link href={readerHref(m.slug, lang)} className="group flex items-baseline justify-between gap-6 py-5">
              <span>
                <span className="block text-lg font-medium text-navy group-hover:underline">{m.title}</span>
                <span className="text-sm text-ink-muted">{m.season}</span>
              </span>
              <span aria-hidden className="text-tech">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
