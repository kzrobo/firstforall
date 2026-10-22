import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionary";

export function SiteFooter({ t }: { t: Dictionary }) {
  return (
    <footer className="on-dark mt-auto bg-navy text-white/75">
      <div className="mx-auto grid max-w-content gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <p className="text-lg font-semibold text-white">FIRST FOR ALL — MANUAL FOR ALL</p>
          <p className="mt-1 text-sm">MAVERICKS FTC #24034</p>
          <p className="mt-6 max-w-md text-[13px] leading-relaxed text-white/60">{t.footer.disclaimer}</p>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-honey">{t.footer.documentation}</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link className="hover:text-white" href="/manuals">{t.nav.manuals}</Link></li>
            <li><Link className="hover:text-white" href="/guides">{t.nav.guides}</Link></li>
            <li><Link className="hover:text-white" href="/ai">{t.nav.ai}</Link></li>
            <li><Link className="hover:text-white" href="/bookmarks">Bookmarks</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-honey">{t.footer.project}</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link className="hover:text-white" href="/about">{t.nav.about}</Link></li>
            <li><Link className="hover:text-white" href="/sponsors">{t.sponsors.title}</Link></li>
            <li><Link className="hover:text-white" href="/login">{t.login.title}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-content px-5 py-5 text-xs text-white/50 lg:px-8">
          © {new Date().getFullYear()} MAVERICKS FTC #24034 · {t.footer.rights}
        </p>
      </div>
    </footer>
  );
}
