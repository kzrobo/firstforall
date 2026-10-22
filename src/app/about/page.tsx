import Image from "next/image";
import { getI18n } from "@/i18n/server";

export const metadata = { title: "About" };

export default async function AboutPage() {
  const { t } = await getI18n();
  return (
    <>
      <section className="mx-auto grid max-w-content gap-12 px-5 py-20 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:px-8 lg:py-28">
        <div>
          <p className="eyebrow">{t.nav.about}</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.025em] text-navy md:text-6xl">{t.about.title}</h1>
          <p className="mt-6 max-w-xl text-xl text-ink-muted">{t.about.intro}</p>
        </div>
        <Image src="/brand/mavericks-emblem.jpg" alt="MAVERICKS emblem" width={420} height={420} className="w-full max-w-sm justify-self-end" />
      </section>
      <section id="initiative" className="on-dark bg-navy text-white">
        <div className="mx-auto max-w-content px-5 py-20 lg:px-8 lg:py-28">
          <p className="eyebrow !text-white/60">{t.home.initiativeEyebrow}</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight md:text-[2.5rem]">{t.home.initiativeTitle}</h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80">{t.home.initiativeBody}</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-content gap-14 px-5 py-20 md:grid-cols-2 lg:px-8 lg:py-28">
        <div><h2 className="text-2xl font-semibold text-navy">{t.about.story}</h2><p className="mt-4 text-ink-muted">{t.about.storyBody}</p></div>
        <div><h2 className="text-2xl font-semibold text-navy">{t.about.philosophy}</h2><p className="mt-4 text-ink-muted">{t.about.philosophyBody}</p></div>
      </section>
    </>
  );
}
