import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { TeamPreview } from "@/components/about/TeamRoster";
import { TeamGallery } from "@/components/media/TeamGallery";
import { TEAM } from "@/content/team";
import { getI18n } from "@/i18n/server";
import { getSiteMedia, showEmptyMediaSlots } from "@/lib/site/repository";

export const metadata: Metadata = {
  title: "About MAVERICKS",
  description: "MAVERICKS FTC #24034 from Nazarbayev Intellectual School, Shymkent — the team behind FIRST FOR ALL.",
};

export default async function AboutPage() {
  const [{ t }, media] = await Promise.all([getI18n(), getSiteMedia()]);
  const showEmpty = showEmptyMediaSlots();
  const A = t.about;
  const opening = media.aboutHero;

  return (
    <>
      {/* Opening: name, one line, then the team itself */}
      <header className="mx-auto max-w-content px-5 pt-14 lg:px-10 lg:pt-24">
        <div className="grid gap-x-6 gap-y-6 lg:grid-cols-12 lg:items-end">
          <h1 className="t-display text-ink lg:col-span-7">MAVERICKS <span className="text-ink-muted">#24034</span></h1>
          <p className="t-lead max-w-md text-ink lg:col-span-4 lg:col-start-9">{A.lead}</p>
        </div>
      </header>
      {opening && (
        <figure className="mx-auto mt-10 max-w-content sm:px-5 lg:mt-14 lg:px-10">
          <div className="relative aspect-[4/3] overflow-hidden bg-soft sm:aspect-[16/9] sm:rounded-[3px] lg:aspect-[21/9]">
            <Image src={opening.url} alt={opening.alt} fill priority sizes="(min-width: 1440px) 1360px, 100vw"
              className="object-cover [object-position:var(--fm)] sm:[object-position:var(--f)]"
              style={{ "--f": opening.focus, "--fm": opening.focusMobile } as React.CSSProperties} />
          </div>
          <figcaption className="t-meta mt-3 px-5 sm:px-0">{A.openingCaption}</figcaption>
        </figure>
      )}

      {/* Who we are — set as a statement, not a numbered section */}
      <section aria-labelledby="who-title" className="mx-auto grid max-w-content gap-x-6 gap-y-6 px-5 py-20 lg:grid-cols-12 lg:px-10 lg:py-28">
        <h2 id="who-title" className="t-label text-ink lg:col-span-3 lg:pt-2">{A.whoIndex}</h2>
        <div className="lg:col-span-8">
          <p className="t-statement max-w-[32ch] text-ink">{A.whoTitle}</p>
          <p className="mt-8 max-w-[62ch] text-[17px] leading-[1.7] text-ink-muted">{A.whoBody}</p>
        </div>
      </section>

      {/* The team — a short line of portraits; the full roster lives on /mavericks/team */}
      <section id="team" aria-labelledby="team-title" className="mx-auto max-w-content scroll-mt-20 border-t border-line px-5 py-20 lg:px-10 lg:py-28">
        <div className="grid gap-x-6 gap-y-6 lg:grid-cols-12 lg:items-end">
          <h2 id="team-title" className="t-h2 text-ink lg:col-span-5">{A.teamTitle}</h2>
          <div className="lg:col-span-5 lg:col-start-8">
            <p className="text-[17px] leading-relaxed text-ink-muted">{A.teamIntro}</p>
            <Link href="/mavericks/team" className="btn-primary mt-6">{t.home.meetTeam} · {TEAM.length}</Link>
          </div>
        </div>
        <div className="mt-12"><TeamPreview members={TEAM} label={t.home.meetTeam} /></div>
      </section>

      {/* The initiative */}
      <section id="initiative" aria-labelledby="what-title" className="mx-auto max-w-content scroll-mt-20 px-5 py-20 lg:px-10 lg:py-28">
        <div className="grid gap-x-6 gap-y-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="t-index">{A.whatIndex}</p>
            <h2 id="what-title" className="t-h2 mt-3 text-ink">{A.whatTitle}</h2>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <p className="text-[clamp(1.125rem,1.6vw,1.375rem)] leading-[1.55] tracking-[-0.01em] text-ink">{A.whatBody}</p>
            <div className="mt-10 grid gap-x-6 gap-y-8 border-t border-line pt-8 md:grid-cols-2">
              <div><h3 className="t-h3 text-ink">{A.whyTitle}</h3><p className="mt-3 text-[16px] leading-[1.65] text-ink-muted">{A.whyBody}</p></div>
              <div><h3 className="t-h3 text-ink">{A.howTitle}</h3><p className="mt-3 text-[16px] leading-[1.65] text-ink-muted">{A.howBody}</p></div>
            </div>
          </div>
        </div>
        <div className="mt-16 lg:mt-24">
          <h3 className="t-label text-ink">{A.processTitle}</h3>
          <ol className="mt-4 grid border-t border-ink md:grid-cols-4">
            {A.steps.map((s, i) => (
              <li key={s.title} className="border-b border-line py-6 md:border-b-0 md:border-r md:px-6 md:first:pl-0 md:last:border-r-0">
                <p className="text-[19px] font-semibold tracking-[-0.02em] text-ink"><span className="t-num mr-2 text-ink-muted">{i + 1}.</span>{s.title}</p>
                <p className="mt-2 text-[16px] leading-relaxed text-ink-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Education — the one neutral section on the page */}
      <section aria-labelledby="edu-title" className="bg-paper">
        <div className="mx-auto grid max-w-content gap-x-6 gap-y-10 px-5 py-20 lg:grid-cols-12 lg:px-10 lg:py-24">
          <div className="lg:col-span-6">
            <p className="t-index">{A.educationIndex}</p>
            <h2 id="edu-title" className="t-h2 mt-3 text-ink">{A.educationTitle}</h2>
            <p className="mt-5 max-w-[56ch] text-[17px] leading-[1.65] text-ink-muted">{A.educationBody}</p>
            <Link href="/learn" className="btn-primary mt-8">{A.educationLink}</Link>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <h3 className="t-label text-ink">{t.learn.plannedTitle}</h3>
            <ul className="mt-3 border-t border-ink text-[16px]">
              {t.learn.planned.map((p) => <li key={p} className="border-b border-line py-3.5 text-ink">{p}</li>)}
            </ul>
          </div>
        </div>
      </section>

      {/* Gallery — only real, non-duplicated photographs (site_settings team_gallery) */}
      {(media.teamGallery.length > 0 || showEmpty) && (
        <section id="gallery" aria-labelledby="gallery-title" className="mx-auto max-w-content scroll-mt-20 px-5 py-20 lg:px-10 lg:py-28">
          <div className="grid gap-x-6 gap-y-4 lg:grid-cols-12 lg:items-end">
            <h2 id="gallery-title" className="t-h2 text-ink lg:col-span-6">{A.gallery}</h2>
            <p className="max-w-sm text-[17px] text-ink-muted lg:col-span-4 lg:col-start-9">{A.galleryIntro}</p>
          </div>
          <div className="mt-10 lg:mt-14"><TeamGallery items={media.teamGallery} showEmpty={showEmpty} /></div>
        </section>
      )}
    </>
  );
}
