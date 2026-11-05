import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionary";
import { BrandMark } from "./BrandMark";

/** Light editorial footer: one statement, three short link groups, the non-affiliation notice. */
export function SiteFooter({ t }: { t: Dictionary }) {
  const head = "t-label text-ink";
  const link = "text-[15px] text-ink-muted underline-offset-4 hover:text-ink hover:underline";
  return (
    <footer className="border-t border-rule bg-canvas">
      <div className="mx-auto max-w-content px-5 lg:px-10">
        <div className="grid gap-x-6 gap-y-12 py-16 sm:grid-cols-2 lg:grid-cols-12 lg:py-20">
          <div className="sm:col-span-2 lg:col-span-5">
            <BrandMark />
            <p className="t-statement mt-8 max-w-[20ch] text-ink">{t.footer.statement}</p>
          </div>
          <nav aria-label={t.footer.platform} className="lg:col-span-2 lg:col-start-7">
            <h2 className={head}>{t.footer.platform}</h2>
            <ul className="mt-4 space-y-2.5">
              <li><Link className={link} href="/">{t.nav.home}</Link></li>
              <li><Link className={link} href="/manuals">{t.nav.manuals}</Link></li>
              <li><Link className={link} href="/learn">{t.nav.learn}</Link></li>
            </ul>
          </nav>
          <nav aria-label="MAVERICKS" className="lg:col-span-2">
            <h2 className={head}>MAVERICKS</h2>
            <ul className="mt-4 space-y-2.5">
              <li><Link className={link} href="/mavericks">{t.hub.title}</Link></li>
              <li><Link className={link} href="/mavericks/team">{t.nav.team}</Link></li>
              <li><Link className={link} href="/mavericks/connects">MAVERICKS Connects</Link></li>
            </ul>
          </nav>
          <nav aria-label={t.footer.team} className="lg:col-span-2">
            <h2 className={head}>{t.footer.team}</h2>
            <ul className="mt-4 space-y-2.5">
              <li><Link className={link} href="/about">{t.nav.about}</Link></li>
              <li><Link className={link} href="/login">{t.nav.signIn}</Link></li>
            </ul>
          </nav>
        </div>
        <div className="grid gap-x-6 gap-y-4 border-t border-line py-8 text-[14px] leading-relaxed text-ink-muted lg:grid-cols-12">
          <p className="lg:col-span-7">{t.footer.disclaimer}</p>
          <p className="lg:col-span-4 lg:col-start-9 lg:text-right">© {new Date().getFullYear()} MAVERICKS FTC #24034 · {t.footer.rights}</p>
        </div>
      </div>
    </footer>
  );
}
