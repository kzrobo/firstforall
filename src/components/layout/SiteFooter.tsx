import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionary";
import { BrandMark } from "./BrandMark";

export function SiteFooter({ t }: { t: Dictionary }) {
  const col = "t-label text-white/45";
  const link = "text-[15px] text-white/80 hover:text-white";
  return (
    <footer className="on-dark bg-night text-white">
      <div className="mx-auto max-w-content px-5 pt-16 lg:px-10">
        <div className="grid gap-12 border-b border-white/10 pb-14 md:grid-cols-12">
          <div className="md:col-span-5">
            <BrandMark />
            <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-white/70">
              FIRST FOR ALL — MANUAL FOR ALL. {t.meta.tagline}
            </p>
          </div>
          <nav aria-label={t.footer.documentation} className="md:col-span-3 md:col-start-7">
            <h2 className={col}>{t.footer.documentation}</h2>
            <ul className="mt-5 space-y-3">
              <li><Link className={link} href="/manuals">{t.nav.manuals}</Link></li>
              <li><Link className={link} href="/guides">{t.nav.guides}</Link></li>
              <li><Link className={link} href="/ai">{t.nav.ai}</Link></li>
              <li><Link className={link} href="/bookmarks">Bookmarks</Link></li>
            </ul>
          </nav>
          <nav aria-label={t.footer.project} className="md:col-span-3">
            <h2 className={col}>{t.footer.project}</h2>
            <ul className="mt-5 space-y-3">
              <li><Link className={link} href="/about">{t.nav.about}</Link></li>
              <li><Link className={link} href="/about#initiative">{t.nav.initiative}</Link></li>
              <li><Link className={link} href="/sponsors">{t.sponsors.title}</Link></li>
              <li><Link className={link} href="/login">{t.landing.signIn}</Link></li>
            </ul>
          </nav>
        </div>
        <div className="grid gap-6 py-8 text-[13px] leading-relaxed text-white/50 md:grid-cols-12">
          <p className="md:col-span-7">{t.footer.disclaimer}</p>
          <p className="md:col-span-4 md:col-start-9 md:text-right">© {new Date().getFullYear()} MAVERICKS FTC #24034<br />{t.footer.rights}</p>
        </div>
      </div>
    </footer>
  );
}
