import type { Dictionary } from "@/i18n/dictionary";

/**
 * The Mavericks AI conversation layout. In "preview" mode nothing is interactive and
 * no answers are shown: the assistant is not connected yet, so none are invented.
 */
export function AiWorkspaceShell({ t, mode }: { t: Dictionary; mode: "preview" }) {
  const L = t.ai;
  const disabled = mode === "preview";
  return (
    <div className="bg-paper shadow-[0_1px_2px_rgba(14,22,32,0.08),0_30px_60px_-30px_rgba(14,22,32,0.30)] ring-1 ring-line">
      {disabled && (
        <p className="border-b border-line bg-accent-pale/60 px-5 py-2 text-[13px] font-medium tracking-[0.02em] text-ink/70">{L.previewLabel}</p>
      )}
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <p className="flex items-center gap-2.5 text-[14px] font-semibold text-ink">
          <span aria-hidden className="inline-block size-2 bg-accent" />Mavericks AI
        </p>
        <p className="text-[13px] text-ink-faint">{t.manuals.language}: <span className="font-medium text-ink-muted">EN · KK · RU · ES</span></p>
      </div>

      <div className="px-5 pb-6 pt-8 sm:px-8">
        <p className="t-h3 text-ink">{L.askTitle}</p>
        <ul className="mt-5 border-t border-line">
          {L.suggestions.map((q) => (
            <li key={q} className="flex items-center justify-between gap-4 border-b border-line py-3.5 text-[15px] text-ink">
              {q}<span aria-hidden className="text-tech">→</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-muted">
          <span aria-hidden className="mt-[3px] inline-flex shrink-0 items-center border border-line px-1.5 text-[11px] font-semibold text-tech">p.</span>
          {L.citationNote}
        </p>
      </div>

      <div className="border-t border-line p-4 sm:px-6">
        <div className="flex items-end gap-3 border border-line-strong bg-canvas px-4 py-3">
          <label className="flex-1">
            <span className="sr-only">{L.composer}</span>
            <textarea rows={1} disabled={disabled} placeholder={L.composer} className="block w-full resize-none bg-transparent text-[15px] placeholder:text-ink-faint focus:outline-none disabled:cursor-not-allowed" />
          </label>
          <button type="button" disabled={disabled} className="inline-flex size-9 items-center justify-center bg-navy text-white disabled:opacity-30" aria-label={t.nav.search}>
            <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
          </button>
        </div>
        <p className="mt-3 text-[13px] text-ink-faint">{L.disclaimer}</p>
      </div>
    </div>
  );
}
