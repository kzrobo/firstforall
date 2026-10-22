import type { Metadata } from "next";
import { Inter, Unbounded } from "next/font/google";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getI18n } from "@/i18n/server";
import { publicEnv } from "@/lib/env";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"], weight: ["400", "500", "600", "700"], variable: "--font-inter", display: "swap" });
// Unbounded (Google Fonts distribution — the same family Figma serves). Real 500/600/700 weights only.
const unbounded = Unbounded({ subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"], weight: ["500", "600", "700"], variable: "--font-unbounded", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.siteUrl),
  title: { default: "FIRST FOR ALL — MANUAL FOR ALL", template: "%s · FIRST FOR ALL" },
  description: "Community translations of FIRST Tech Challenge documentation by MAVERICKS FTC #24034. Not an official FIRST product.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { locale, t } = await getI18n();
  return (
    <html lang={locale} className={`${inter.variable} ${unbounded.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        <SiteHeader t={t} locale={locale} />
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter t={t} />
      </body>
    </html>
  );
}
