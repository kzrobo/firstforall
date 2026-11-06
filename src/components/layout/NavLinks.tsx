"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem { href: string; label: string }

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <ul className="flex items-center xl:gap-1">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`group relative inline-flex h-11 items-center whitespace-nowrap px-2.5 text-[15px] font-semibold tracking-[-0.012em] transition-colors xl:px-3.5 xl:text-[16px] ${active ? "text-ink" : "text-ink/80 hover:text-ink"}`}
            >
              {item.label}
              {/* active page: a short 2px rule under the label; hover previews it at half strength */}
              <span aria-hidden className={`absolute inset-x-2.5 bottom-[7px] xl:inset-x-3.5 h-[2px] rounded-full bg-current transition-[opacity,transform] duration-200 ${active ? "opacity-100" : "scale-x-50 opacity-0 group-hover:scale-x-100 group-hover:opacity-40"}`} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
