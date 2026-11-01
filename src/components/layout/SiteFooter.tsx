import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionary";
import { BrandMark } from "./BrandMark";

export function SiteFooter({ t }: { t: Dictionary }) {
  const head = "text-[12px] font-medium text-white/45";
  const link = "text-[15px] text-white/85 decoration-accent decoration-2 underline-offset-4 hover:text-white hover:underline";
  return (
    <footer className="bg-navy text-white [&_:focus-visible]:outline-accent">
      <div className="mx-auto max-w-content px-5 lg:px-10">
        <div className="grid gap-x-6 gap-y-14 border-b border-white/12 py-16 lg:grid-cols-12 lg:py-20">
          <p className="font-display max-w-[18ch] text-[clamp(1.5rem,2.6vw,2.25rem)] font-normal leading-[1.2] tracking-[-0.03em] lg:col-span-6">
            {t.footer.statement}
          </p>
          <nav aria-label={t.footer.platform} className="lg:col-span-2 lg:col-start-8">
            <h2 className={head}>{t.footer.platform}</h2>
            <ul className="mt-5 space-y-3">
              <li><Link className={link} href="/">{t.nav.home}</Link></li>
              <li><Link className={link} href="/manuals">{t.nav.manuals}</Link></li>
              <li><Link className={link} href="/learn">{t.nav.learn}</Link></li>
            </ul>
          </nav>
          <nav aria-label={t.footer.team} className="lg:col-span-2">
            <h2 className={head}>{t.footer.team}</h2>
            <ul className="mt-5 space-y-3">
              <li><Link className={link} href="/about">{t.nav.about}</Link></li>
              <li><Link className={link} href="/about#gallery">{t.nav.gallery}</Link></li>
              <li><Link className={link} href="/login">{t.nav.signIn}</Link></li>
            </ul>
          </nav>
        </div>
        <div className="grid gap-x-6 gap-y-6 py-10 text-[13px] leading-relaxed text-white/50 lg:grid-cols-12">
          <div className="lg:col-span-3"><BrandMark tone="dark" /></div>
          <p className="lg:col-span-6">{t.footer.disclaimer}</p>
          <p className="lg:col-span-3 lg:text-right">© {new Date().getFullYear()} MAVERICKS FTC #24034<br />{t.footer.rights}</p>
        </div>
      </div>
    </footer>
  );
}
