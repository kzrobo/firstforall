import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionary";

export function ComingSoon({ t, title, children }: { t: Dictionary; title: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-content px-5 py-20 lg:px-10 lg:py-28">
      <p className="t-label text-ink-muted">{title}</p>
      <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.025em] text-navy">{t.common.comingSoon}</h1>
      <p className="mt-5 max-w-xl text-lg text-ink-muted">{t.common.comingSoonBody}</p>
      {children}
      <Link href="/" className="mt-10 inline-flex font-semibold text-tech hover:underline">← {t.common.backHome}</Link>
    </div>
  );
}
