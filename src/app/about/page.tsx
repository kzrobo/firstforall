import Image from "next/image";
import Link from "next/link";
import { Rings } from "@/components/home/Rings";
import { MediaSlot } from "@/components/media/MediaSlot";
import { TeamGallery } from "@/components/media/TeamGallery";
import { getI18n } from "@/i18n/server";
import { getSiteMedia, showEmptyMediaSlots } from "@/lib/site/repository";

export const metadata = { title: "About" };

export default async function AboutPage() {
  const [{ t }, media] = await Promise.all([getI18n(), getSiteMedia()]);
  const showEmpty = showEmptyMediaSlots();
  const L = t.landing;
  const hero = media.aboutHero;

  return (
    <>
      {/* Opening: team photograph when uploaded; otherwise the emblem on night */}
      <header className="on-dark relative isolate overflow-hidden bg-[#0b1a2e] text-white">
        {hero ? (
          <>
            <Image src={hero.url} alt={hero.alt} fill priority sizes="100vw"
              className="-z-10 object-cover [object-position:var(--fm)] sm:[object-position:var(--f)]"
              style={{ "--f": hero.focus, "--fm": hero.focusMobile } as React.CSSProperties} />
            <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0b1a2e]/85 via-[#0b1a2e]/20 to-transparent" />
          </>
        ) : (
          <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_75%_50%,#173352_0%,#0b1a2e_60%)]" />
        )}
        <div className={`mx-auto grid max-w-content items-end gap-x-8 lg:gap-x-16 gap-y-10 px-5 lg:grid-cols-12 lg:px-10 ${hero ? "min-h-[min(78svh,720px)] pb-14 pt-40 lg:pb-20" : "py-20 lg:py-28"}`}>
          <div className="lg:col-span-7">
            <p className="t-label text-white/60">{t.nav.about}</p>
            <h1 className="t-display mt-5">{t.about.title}</h1>
            <p className="t-lead mt-6 max-w-xl text-white/85">{t.about.intro}</p>
          </div>
          {!hero && (
            <Image src="/brand/mavericks-emblem.jpg" alt="MAVERICKS emblem" width={480} height={480}
              className="hidden w-full max-w-sm justify-self-center self-center mix-blend-screen [mask-image:radial-gradient(closest-side,#000_50%,transparent_96%)] lg:col-span-5 lg:block" />
          )}
          {hero?.caption && <p className="text-[13px] text-white/60 lg:col-span-4 lg:col-start-9 lg:text-right">{hero.caption}</p>}
        </div>
      </header>

      {/* Story with photograph */}
      <section aria-labelledby="story-title" className="mx-auto grid max-w-content items-center gap-x-8 lg:gap-x-20 gap-y-12 px-5 py-20 md:grid-cols-12 lg:px-10 lg:py-28">
        <div className={media.aboutStory || showEmpty ? "md:col-span-6 lg:col-span-5" : "md:col-span-8"}>
          <h2 id="story-title" className="t-h1 text-navy">{t.about.story}</h2>
          <p className="t-lead mt-6 text-ink/80">{L.teamBody}</p>
          <div className="mt-12 border-t border-line pt-8">
            <h3 className="t-label text-ink-muted">{t.about.philosophy}</h3>
            <p className="font-display mt-4 text-[19px] font-medium leading-[1.45] tracking-[-0.012em] text-navy">{t.about.philosophyBody}</p>
          </div>
        </div>
        <MediaSlot item={media.aboutStory} slot="about_story" ratio="4 / 5" sizes="(min-width: 768px) 45vw, 100vw" showEmpty={showEmpty} className="md:col-span-6 lg:col-start-7" />
      </section>

      {/* Initiative and translation process */}
      <section id="initiative" aria-labelledby="initiative-title" className="relative isolate overflow-hidden bg-pollen">
        <Rings className="absolute -right-[20%] top-1/2 -z-10 h-[170%] -translate-y-1/2 text-honey-deep/20" count={6} />
        <div className="mx-auto grid max-w-content gap-x-8 lg:gap-x-16 gap-y-12 px-5 py-20 lg:grid-cols-12 lg:px-10 lg:py-28">
          <div className="lg:col-span-5">
            <p className="t-label text-honey-deep">{t.home.initiativeEyebrow}</p>
            <h2 id="initiative-title" className="t-h1 mt-4 text-navy">{t.home.initiativeTitle}</h2>
            {(media.photoInitiative || showEmpty) && (
              <MediaSlot item={media.photoInitiative} slot="photo_initiative" ratio="4 / 3" sizes="(min-width: 1024px) 38vw, 100vw" showEmpty={showEmpty} className="mt-10 hidden lg:block" />
            )}
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <p className="t-lead text-ink/80">{t.home.initiativeBody}</p>
            <h3 className="t-label mt-10 text-ink/60">{L.processLabel}</h3>
            <ol className="mt-4 border-t border-ink/15">
              {L.steps.map((s, i) => (
                <li key={s.title} className="grid grid-cols-[3rem_1fr] gap-x-4 border-b border-ink/15 py-5">
                  <span className="t-num text-[14px] font-semibold text-honey-deep">{String(i + 1).padStart(2, "0")}</span>
                  <span><span className="font-semibold text-navy">{s.title}.</span> <span className="text-ink/75">{s.body}</span></span>
                </li>
              ))}
            </ol>
            <Link href="/manuals" className="link-arrow mt-10 text-navy">{t.nav.explore}</Link>
          </div>
        </div>
      </section>

      {/* Gallery */}
      {(media.teamGallery.length > 0 || showEmpty) && (
        <section aria-labelledby="gallery-title" className="mx-auto max-w-content px-5 py-20 lg:px-10 lg:py-28">
          <div className="mb-10 grid gap-6 border-b-2 border-navy pb-6 md:grid-cols-12 md:items-end">
            <h2 id="gallery-title" className="t-h2 text-navy md:col-span-6">{t.about.gallery}</h2>
            <p className="text-ink-muted md:col-span-5 md:col-start-8">{t.about.galleryIntro}</p>
          </div>
          <TeamGallery items={media.teamGallery} showEmpty={showEmpty} />
        </section>
      )}
    </>
  );
}
