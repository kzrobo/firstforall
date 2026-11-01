"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/lessons", label: "Lessons" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-6 text-[14px]">
      {ITEMS.map((i) => {
        const active = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} aria-current={active ? "page" : undefined}
            className={`border-b-2 py-3 ${active ? "border-accent font-semibold text-navy" : "border-transparent text-ink-muted hover:text-navy"}`}>
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
