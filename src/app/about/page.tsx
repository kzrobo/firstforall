import Image from "next/image";
import Link from "next/link";
import { Rings } from "@/components/home/Rings";
import { getI18n } from "@/i18n/server";

export const metadata = { title: "About" };

export default async function AboutPage() {
  const { t } = await getI18n();
  const L = t.landing;
  return (
    <>
      <header className="on-dark relative isolate overflow-hidden bg-[#0b1a2e] text-white">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_75%_50%,#173352_0%,#0b1a2e_60%)]" />
        <div className="mx-auto grid max-w-content items-center gap-x-16 gap-y-10 px-5 py-20 lg:grid-cols-12 lg:px-10 lg:py-28">
          <div className="lg:col-span-7">
            <p className="t-label text-white/50">{t.nav.about}</p>
            <h1 className="t-h1 mt-4">{t.about.title}</h1>
            <p className="t-lead mt-6 max-w-xl text-white/80">{t.about.intro}</p>
          </div>
          <Image src="/brand/mavericks-emblem.jpg" alt="MAVERICKS emblem" width={480} height={480}
            className="hidden w-full max-w-sm justify-self-center mix-blend-screen [mask-image:radial-gradient(closest-side,#000_50%,transparent_96%)] lg:col-span-5 lg:block" />
        </div>
      </header>

      <section aria-labelledby="story-title" className="mx-auto grid max-w-content gap-x-16 gap-y-12 px-5 py-20 lg:grid-cols-12 lg:px-10 lg:py-28">
        <div className="lg:col-span-5">
          <h2 id="story-title" className="t-h2 text-navy">{t.about.story}</h2>
          <p className="mt-5 text-ink-muted">{L.teamBody}</p>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <h2 className="t-label text-ink-muted">{t.about.philosophy}</h2>
          <p className="mt-5 text-[22px] leading-snug tracking-[-0.012em] text-ink">{t.about.philosophyBody}</p>
        </div>
      </section>

      <section id="initiative" aria-labelledby="initiative-title" className="relative isolate overflow-hidden bg-pollen">
        <Rings className="absolute -right-[20%] top-1/2 -z-10 h-[170%] -translate-y-1/2 text-honey-deep/20" count={6} />
        <div className="mx-auto grid max-w-content gap-x-16 gap-y-12 px-5 py-20 lg:grid-cols-12 lg:px-10 lg:py-28">
          <div className="lg:col-span-5">
            <p className="t-label text-honey-deep">{t.home.initiativeEyebrow}</p>
            <h2 id="initiative-title" className="t-h2 mt-4 text-navy">{t.home.initiativeTitle}</h2>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <p className="t-lead text-ink/80">{t.home.initiativeBody}</p>
            <ol className="mt-10 border-t border-ink/15">
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
    </>
  );
}
