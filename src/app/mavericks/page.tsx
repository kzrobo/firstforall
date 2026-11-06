import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CategoryIndex } from "@/components/hub/CategoryIndex";
import { HubNav } from "@/components/hub/HubNav";
import { ProjectGallerySection } from "@/components/hub/ProjectGallerySection";
import { toGalleryItems } from "@/lib/hub/gallery";
import { sortEntries } from "@/lib/hub/types";
import { TEAM } from "@/content/team";
import { getI18n } from "@/i18n/server";
import type { HubCategory } from "@/lib/hub/categories";
import { categoryCounts, listPublishedEntries } from "@/lib/hub/repository";
import { getSiteMedia } from "@/lib/site/repository";

export const metadata: Metadata = {
  title: "Explore MAVERICKS",
  description: "Seven areas of work by MAVERICKS FTC #24034: engineering for good, an international FTC network, robot engineering, teaching, outreach, competitions and long-term impact.",
};

export default async function MavericksHubPage() {
  const [{ t }, counts, entries, media] = await Promise.all([getI18n(), categoryCounts(), listPublishedEntries(), getSiteMedia()]);
  const H = t.hub;
  // One real photograph per direction where one exists (newest first); never a placeholder.
  const images: Partial<Record<HubCategory, string>> = {};
  for (const e of entries.ok ? entries.data : []) {
    const photo = e.coverUrl ?? e.media.find((m) => m.kind === "photo")?.url;
    if (photo && !images[e.category]) images[e.category] = photo;
  }
  const group = media.teamFeature;

  return (
    <>
      <HubNav t={t} current="overview" />
      <header className="mx-auto grid max-w-content gap-x-6 gap-y-6 px-5 pb-12 pt-12 lg:grid-cols-12 lg:px-10 lg:pb-16 lg:pt-20">
        <h1 className="t-h1 text-ink lg:col-span-6">{H.title}</h1>
        <p className="t-lead max-w-xl text-ink-muted lg:col-span-5 lg:col-start-8 lg:pt-2">{H.intro}</p>
      </header>

      <ProjectGallerySection t={t} items={toGalleryItems(sortEntries(entries.ok ? entries.data.filter((e) => e.category !== "connects") : []), (e) => `/mavericks/${e.category}/${e.slug}`)} />

      <section aria-label={H.title} className="mx-auto max-w-content px-5 pb-10 lg:px-10">
        <CategoryIndex t={t} counts={counts} images={images} />
        <p className="t-meta mt-6 max-w-2xl">{H.notAwards}</p>
      </section>

      {/* Two ways further in: the people, and the network */}
      <section className="mx-auto grid max-w-content gap-x-6 gap-y-12 px-5 py-20 lg:grid-cols-12 lg:px-10 lg:py-28">
        <Link href="/mavericks/team" className="group block lg:col-span-7">
          {group && (
            <span className="img-zoom relative block aspect-[16/10] overflow-hidden rounded-[3px] bg-soft">
              <Image src={group.url} alt={group.alt} fill sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" style={{ objectPosition: group.focus }} />
            </span>
          )}
          <span className="mt-5 flex items-baseline justify-between gap-4">
            <span className="text-[24px] font-semibold tracking-[-0.025em] text-ink group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">{t.about.teamPageTitle}</span>
            <span className="text-[15px] text-ink-muted"><span className="t-num font-semibold text-ink">{TEAM.length}</span> · MAVERICKS FTC #24034</span>
          </span>
        </Link>
        <div className="flex flex-col justify-between gap-8 rounded-[3px] bg-paper p-7 lg:col-span-5 lg:p-10">
          <div>
            <p className="t-index">MAVERICKS Connects</p>
            <h2 className="t-h2 mt-3 text-ink">{H.categories.connects.tagline}</h2>
            <p className="mt-4 text-[16px] leading-relaxed text-ink-muted">{H.globe.lead}</p>
          </div>
          <Link href="/mavericks/connects" className="btn-primary self-start">{H.explore}</Link>
        </div>
      </section>
    </>
  );
}
