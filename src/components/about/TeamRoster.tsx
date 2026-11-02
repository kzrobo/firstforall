import Image from "next/image";
import type { TeamMember } from "@/content/team";

/**
 * Editorial roster: uniform 3:4 portraits (the source photos share one backdrop and light),
 * names in Unbounded, roles in Inter. Two columns on phones, seven on desktop — 14 members
 * fill both without gaps.
 */
export function TeamRoster({ members }: { members: TeamMember[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-10 sm:grid-cols-4 sm:gap-x-5 lg:grid-cols-7 lg:gap-x-4 lg:gap-y-12">
      {members.map((m) => (
        <li key={m.name} className="group">
          <figure>
            <div className="relative aspect-[3/4] overflow-hidden bg-soft">
              <Image
                src={m.photo}
                alt={`${m.name}, ${m.role}`}
                fill
                sizes="(min-width: 1024px) 14vw, (min-width: 640px) 24vw, 48vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
                style={{ objectPosition: m.focus ?? "50% 30%" }}
              />
            </div>
            <figcaption className="mt-3">
              <span className="font-display block text-[15px] font-medium tracking-[-0.02em] text-ink">{m.name}</span>
              <span className="mt-0.5 block text-[13px] leading-snug text-ink-faint">{m.role}</span>
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
