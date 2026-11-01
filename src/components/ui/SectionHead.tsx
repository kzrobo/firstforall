import Link from "next/link";

/**
 * Publication-style section opener: "(02) Library" index on the left, heading across the
 * middle, an optional text link on the right — all on one hairline-ruled row.
 */
export function SectionHead({ index, label, title, id, link }: {
  index: number; label: string; title: string; id: string; link?: { href: string; label: string };
}) {
  return (
    <div className="grid gap-x-6 gap-y-4 border-t border-navy pt-5 lg:grid-cols-12">
      <p className="t-index lg:col-span-3"><span className="t-num">({String(index).padStart(2, "0")})</span> {label}</p>
      <h2 id={id} className="t-h2 max-w-[22ch] text-navy lg:col-span-6">{title}</h2>
      {link && (
        <p className="lg:col-span-3 lg:text-right">
          <Link href={link.href} className="link-arrow text-[15px] text-navy">{link.label}</Link>
        </p>
      )}
    </div>
  );
}
