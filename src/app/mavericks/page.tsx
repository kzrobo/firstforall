import type { Metadata } from "next";
import Link from "next/link";
import { CategoryIndex } from "@/components/hub/CategoryIndex";
import { getI18n } from "@/i18n/server";
import { categoryCounts } from "@/lib/hub/repository";

export const metadata: Metadata = {
  title: "Explore MAVERICKS",
  description: "Seven areas of work by MAVERICKS FTC #24034: engineering for good, an international FTC network, robot engineering, teaching, outreach, competitions and long-term impact.",
};

export default async function MavericksHubPage() {
  const [{ t }, counts] = await Promise.all([getI18n(), categoryCounts()]);
  const H = t.hub;
  return (
    <>
      <header className="mx-auto max-w-content px-5 pt-14 lg:px-10 lg:pt-20">
        <p className="t-index">{H.kicker}</p>
        <div className="mt-4 grid gap-x-6 gap-y-6 lg:grid-cols-12 lg:items-end">
          <h1 className="t-display text-ink lg:col-span-7">{H.title}</h1>
          <div className="lg:col-span-4 lg:col-start-9">
            <p className="t-lead text-ink-muted">{H.intro}</p>
          </div>
        </div>
      </header>

      <section aria-label={H.title} className="mx-auto max-w-content px-5 pb-12 pt-14 lg:px-10 lg:pt-20">
        <CategoryIndex t={t} counts={counts} />
        <p className="mt-6 max-w-2xl text-[12px] text-ink-faint">{H.notAwards}</p>
      </section>

      {/* The network gets its own band: the one place on the page with indigo */}
      <section aria-labelledby="connects-band" className="bg-indigo">
        <div className="mx-auto grid max-w-content gap-x-6 gap-y-8 px-5 py-20 lg:grid-cols-12 lg:px-10 lg:py-24">
          <div className="lg:col-span-6">
            <p className="t-index">MAVERICKS Connects</p>
            <h2 id="connects-band" className="t-h1 mt-4 text-ink">{H.categories.connects.tagline}</h2>
          </div>
          <div className="lg:col-span-5 lg:col-start-8 lg:self-end">
            <p className="text-[16px] leading-relaxed text-ink-muted">{H.globe.lead}</p>
            <Link href="/mavericks/connects" className="btn-primary mt-8">{H.explore}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
