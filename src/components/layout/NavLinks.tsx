"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <ul className="flex h-full items-stretch">
      {items.map((item) => {
        const base = item.href.split("#")[0];
        const active = !item.href.includes("#") && (pathname === base || pathname.startsWith(`${base}/`));
        return (
          <li key={item.href} className="flex">
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex items-center px-4 text-[15px] font-medium transition-colors xl:px-5 ${active ? "text-white" : "text-white/75 hover:text-white"}`}
            >
              {item.label}
              {active && <span aria-hidden className="absolute inset-x-4 bottom-0 h-[2px] bg-honey xl:inset-x-5" />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
