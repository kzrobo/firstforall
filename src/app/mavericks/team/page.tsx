import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { TeamRoster } from "@/components/about/TeamRoster";
import { HubNav } from "@/components/hub/HubNav";
import { TEAM } from "@/content/team";
import { getI18n } from "@/i18n/server";
import { plural } from "@/i18n/plural";
import { getSiteMedia } from "@/lib/site/repository";

export const metadata: Metadata = {
  title: "The team · MAVERICKS",
  description: "The fourteen members of MAVERICKS FTC #24034, Nazarbayev Intellectual School, Shymkent.",
};

export default async function TeamPage() {
  const [{ t, locale }, media] = await Promise.all([getI18n(), getSiteMedia()]);
  const A = t.about;
  const n = TEAM.length;
  const group = media.teamFeature;

  return (
    <>
      <HubNav t={t} current="team" />
      <header className="mx-auto max-w-content px-5 pb-12 pt-12 lg:px-10 lg:pb-16 lg:pt-20">
        <h1 className="t-h1 text-ink">{A.teamPageTitle}</h1>
        <p className="mt-4 text-[17px] text-ink-muted"><span className="t-num font-semibold text-ink">{n}</span> {plural(locale, n, { one: A.memberOne, few: A.memberFew, many: A.memberMany })} · MAVERICKS FTC #24034</p>
      </header>

      <section aria-label={A.teamPageTitle} data-roster className="mx-auto max-w-content px-5 pb-20 lg:px-10 lg:pb-28">
        <TeamRoster members={TEAM} labels={{ leadership: A.leadership, members: A.members }}
          aside={<p className="t-lead max-w-lg text-ink">{A.teamPageLead}</p>} />
        <p className="t-meta mt-14">{A.rolesNote}</p>
      </section>

      {group && (
        <figure className="mx-auto max-w-content px-5 pb-24 lg:px-10 lg:pb-32">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[3px] bg-soft sm:aspect-[16/9]">
            <Image src={group.url} alt={group.alt} fill sizes="(min-width: 1440px) 1360px, 100vw" className="object-cover" style={{ objectPosition: group.focus }} />
          </div>
          <figcaption className="mt-4 flex flex-wrap items-baseline justify-between gap-4">
            <span className="t-meta">{A.teamPhotoCaption}</span>
            <Link href="/about" className="link-arrow text-[16px] text-ink">{t.home.teamLink}</Link>
          </figcaption>
        </figure>
      )}
    </>
  );
}
