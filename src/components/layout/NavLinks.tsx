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
    <ul className="flex items-center gap-1">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`font-display group relative inline-flex h-10 items-center px-3.5 text-[13px] font-medium tracking-[-0.005em] transition-colors ${active ? "text-navy" : "text-ink-muted hover:text-navy"}`}
            >
              {item.label}
              <span aria-hidden className={`absolute inset-x-3.5 bottom-1 h-[2px] origin-left bg-accent transition-transform duration-200 ${active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
