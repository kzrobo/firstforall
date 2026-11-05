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
    <ul className="flex items-center gap-2">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`group relative inline-flex h-11 items-center px-3 text-[15px] font-medium tracking-[-0.01em] transition-colors ${active ? "text-ink" : "text-ink-muted hover:text-ink"}`}
            >
              {item.label}
              <span aria-hidden className={`absolute inset-x-3 bottom-1.5 h-[1.5px] origin-left bg-ink transition-transform duration-200 ${active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
