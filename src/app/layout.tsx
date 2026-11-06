import type { Metadata } from "next";
import { Onest, Unbounded } from "next/font/google";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getI18n } from "@/i18n/server";
import { publicEnv } from "@/lib/env";
import "./globals.css";

// Onest: the site's sans. A geometric grotesk close to the Mluvka / Plus Jakarta Sans reference, with
// full Russian and Kazakh coverage (Ә Ғ Қ Ң Ө Ұ Ү Һ І) — Mluvka and Plus Jakarta Sans have no Cyrillic.
// Variable font (one file per subset, every weight), self-hosted by next/font with metric-matched fallback.
const onest = Onest({ subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"], variable: "--font-onest", display: "swap" });
// Unbounded: brand display face only (FIRST FOR ALL wordmark, display lines, page titles). Variable too.
const unbounded = Unbounded({ subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"], variable: "--font-unbounded", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.siteUrl),
  title: { default: "FIRST FOR ALL — MANUAL FOR ALL", template: "%s · FIRST FOR ALL" },
  description: "Multilingual FTC manuals and robotics lessons by MAVERICKS FTC #24034. A community initiative, not an official FIRST product.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { locale, t } = await getI18n();
  return (
    <html lang={locale} className={`${onest.variable} ${unbounded.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        <SiteHeader t={t} locale={locale} />
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter t={t} />
      </body>
    </html>
  );
}
