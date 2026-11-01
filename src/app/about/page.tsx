import type { Metadata } from "next";
import Link from "next/link";
import { MediaSlot } from "@/components/media/MediaSlot";
import { TeamGallery } from "@/components/media/TeamGallery";
import { getI18n } from "@/i18n/server";
import { getSiteMedia, showEmptyMediaSlots } from "@/lib/site/repository";

export const metadata: Metadata = {
  title: "About MAVERICKS",
  description: "MAVERICKS FTC #24034 from Nazarbayev Intellectual School, Shymkent, and the FIRST FOR ALL initiative.",
};

function Index({ n, label }: { n: number; label: string }) {
  return <p className="t-index lg:col-span-3"><span className="t-num">({String(n).padStart(2, "0")})</span> {label}</p>;
}

export default async function AboutPage() {
  const [{ t }, media] = await Promise.all([getI18n(), getSiteMedia()]);
  const showEmpty = showEmptyMediaSlots();
  const A = t.about;

  return (
    <>
      {/* Opening */}
      <header className="mx-auto max-w-content px-5 pt-12 lg:px-10 lg:pt-20">
        <div className="grid gap-x-6 gap-y-8 lg:grid-cols-12">
          <p className="t-index lg:col-span-3">{A.title}</p>
          <h1 className="t-display text-navy lg:col-span-5">MAVERICKS<span className="block text-ink-faint">FTC #24034</span></h1>
          <p className="t-lead max-w-md self-end text-ink-muted lg:col-span-4">{A.lead}</p>
        </div>
      </header>

      {(media.aboutHero || showEmpty) && (
        <div className="mx-auto mt-12 max-w-content sm:px-5 lg:mt-20 lg:px-10">
          <MediaSlot item={media.aboutHero} slot="about_hero" ratio="21 / 9" ratioMobile="4 / 5" sizes="(min-width: 1440px) 1360px, 100vw" priority showEmpty={showEmpty}
            className="[&_figcaption]:px-5 sm:[&_figcaption]:px-0" />
        </div>
      )}

      {/* (01) Who we are */}
      <section aria-labelledby="who-title" className="mx-auto max-w-content px-5 pt-20 lg:px-10 lg:pt-32">
        <div className="grid gap-x-6 gap-y-8 border-t border-navy pt-5 lg:grid-cols-12">
          <Index n={1} label={A.whoIndex} />
          <div className={media.aboutStory || showEmpty ? "lg:col-span-5" : "lg:col-span-6"}>
            <h2 id="who-title" className="t-h2 max-w-[20ch] text-navy">{A.whoTitle}</h2>
            <p className="mt-6 max-w-[60ch] text-[17px] leading-[1.7] text-ink-muted">{A.whoBody}</p>
          </div>
          <MediaSlot item={media.aboutStory} slot="about_story" ratio="4 / 5" sizes="(min-width: 1024px) 26vw, 100vw" showEmpty={showEmpty} className="lg:col-span-3 lg:col-start-10" />
        </div>
      </section>

      {/* (02) The initiative */}
      <section id="initiative" aria-labelledby="what-title" className="mx-auto max-w-content scroll-mt-24 px-5 pt-20 lg:px-10 lg:pt-32">
        <div className="grid gap-x-6 gap-y-8 border-t border-navy pt-5 lg:grid-cols-12">
          <Index n={2} label={A.whatIndex} />
          <div className="lg:col-span-9">
            <h2 id="what-title" className="t-h2 text-navy">{A.whatTitle}</h2>
            <p className="mt-6 max-w-[46ch] text-[clamp(1.125rem,1.7vw,1.4375rem)] leading-[1.5] tracking-[-0.01em] text-navy">{A.whatBody}</p>
            <div className="mt-14 grid gap-x-6 gap-y-10 md:grid-cols-2 lg:max-w-[56rem]">
              <div>
                <h3 className="t-h3 text-navy">{A.whyTitle}</h3>
                <p className="mt-3 leading-[1.7] text-ink-muted">{A.whyBody}</p>
              </div>
              <div>
                <h3 className="t-h3 text-navy">{A.howTitle}</h3>
                <p className="mt-3 leading-[1.7] text-ink-muted">{A.howBody}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 grid gap-x-6 lg:mt-24 lg:grid-cols-12">
          <h3 className="t-index pb-4 lg:col-span-3">{A.processTitle}</h3>
          <ol className="border-t border-line lg:col-span-9">
            {A.steps.map((s, i) => (
              <li key={s.title} className="grid grid-cols-[2.5rem_1fr] gap-x-6 border-b border-line py-6 md:grid-cols-[2.5rem_12rem_1fr]">
                <span className="t-num pt-1 text-[13px] text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-display text-[19px] font-medium tracking-[-0.02em] text-navy">{s.title}</span>
                <span className="col-start-2 mt-2 max-w-[56ch] text-ink-muted md:col-start-3 md:mt-0">{s.body}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* (03) Education */}
      <section aria-labelledby="edu-title" className="mx-auto max-w-content px-5 pt-20 lg:px-10 lg:pt-32">
        <div className="grid gap-x-6 gap-y-8 border-t border-navy pt-5 lg:grid-cols-12">
          <Index n={3} label={A.educationIndex} />
          <div className="lg:col-span-5">
            <h2 id="edu-title" className="t-h2 text-navy">{A.educationTitle}</h2>
            <p className="mt-5 max-w-[56ch] leading-[1.7] text-ink-muted">{A.educationBody}</p>
            <Link href="/learn" className="btn-primary mt-8">{A.educationLink}</Link>
          </div>
          <div className="lg:col-span-3 lg:col-start-10">
            <h3 className="t-index">{t.learn.plannedTitle}</h3>
            <ul className="mt-3 border-t border-line text-[15px]">
              {t.learn.planned.map((p) => <li key={p} className="border-b border-line py-2.5">{p}</li>)}
            </ul>
          </div>
        </div>
      </section>

      {/* (04) Gallery */}
      <section id="gallery" aria-labelledby="gallery-title" className="mx-auto max-w-content scroll-mt-24 px-5 pb-24 pt-20 lg:px-10 lg:pb-32 lg:pt-32">
        <div className="grid gap-x-6 gap-y-6 border-t border-navy pt-5 lg:grid-cols-12">
          <Index n={4} label={A.gallery} />
          <h2 id="gallery-title" className="t-h2 text-navy lg:col-span-5">{A.gallery}</h2>
          <p className="max-w-sm text-ink-muted lg:col-span-4">{A.galleryIntro}</p>
        </div>
        <div className="mt-10 lg:mt-14">
          {media.teamGallery.length > 0 || showEmpty ? (
            <TeamGallery items={media.teamGallery} showEmpty={showEmpty} />
          ) : (
            <p className="border-t border-line pt-5 text-ink-muted">{A.galleryEmpty}</p>
          )}
        </div>
      </section>
    </>
  );
}
