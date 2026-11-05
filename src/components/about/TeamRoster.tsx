import Image from "next/image";
import Link from "next/link";
import type { TeamMember } from "@/content/team";

function Portrait({ m, sizes, priority = false, large = false }: { m: TeamMember; sizes: string; priority?: boolean; large?: boolean }) {
  return (
    <figure className="group">
      <div className="relative aspect-[3/4] overflow-hidden rounded-[3px] bg-soft">
        <Image src={m.photo} alt={`${m.name}, ${m.role}`} fill sizes={sizes} priority={priority}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025] motion-reduce:transition-none"
          style={{ objectPosition: m.focus ?? "50% 28%" }} />
      </div>
      <figcaption className="mt-4">
        <span className={`block font-semibold tracking-[-0.02em] text-ink ${large ? "text-[22px]" : "text-[18px]"}`}>{m.name}</span>
        <span className={`mt-1 block leading-snug text-ink-muted ${large ? "text-[16px]" : "text-[15px]"}`}>{m.role}</span>
      </figcaption>
    </figure>
  );
}

/**
 * Editorial roster from the team's own materials. Documented leadership (Captain, Tech team
 * captain) leads at a larger size; everyone else follows in team order, four to a row on desktop
 * (12 members → three full rows), three on tablets, two on phones. Natural 3:4 portraits.
 */
export function TeamRoster({ members, labels, aside }: { members: TeamMember[]; labels: { leadership: string; members: string }; aside?: React.ReactNode }) {
  const leads = members.filter((m) => m.lead);
  const rest = members.filter((m) => !m.lead);
  return (
    <div>
      {leads.length > 0 && (
        <section aria-label={labels.leadership} className="grid gap-x-6 gap-y-10 lg:grid-cols-2 lg:items-end">
          <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6">
            {leads.map((m) => <li key={m.name}><Portrait m={m} large priority sizes="(min-width: 1024px) 22vw, 48vw" /></li>)}
          </ul>
          {aside && <div className="lg:pb-16 lg:pl-[8%]">{aside}</div>}
        </section>
      )}
      <section aria-label={labels.members} className={leads.length ? "mt-16 border-t border-line pt-10 lg:mt-24 lg:pt-14" : ""}>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 lg:gap-y-16">
          {rest.map((m) => <li key={m.name}><Portrait m={m} sizes="(min-width: 1024px) 22vw, (min-width: 640px) 31vw, 48vw" /></li>)}
        </ul>
      </section>
    </div>
  );
}

/** A short line of portraits that leads to /mavericks/team (About page). */
export function TeamPreview({ members, label }: { members: TeamMember[]; label: string }) {
  return (
    <Link href="/mavericks/team" className="group block" aria-label={label}>
      <ul className="grid grid-cols-4 gap-2 sm:grid-cols-7 sm:gap-3">
        {members.slice(0, 7).map((m, i) => (
          <li key={m.name} className={i >= 4 ? "hidden sm:block" : ""}>
            <div className="relative aspect-[3/4] overflow-hidden rounded-[3px] bg-soft">
              <Image src={m.photo} alt="" fill sizes="(min-width: 640px) 12vw, 24vw" className="object-cover" style={{ objectPosition: m.focus ?? "50% 28%" }} />
            </div>
          </li>
        ))}
      </ul>
    </Link>
  );
}
