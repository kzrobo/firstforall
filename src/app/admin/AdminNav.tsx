"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/lessons", label: "Lessons" },
  { href: "/admin/hub", label: "MAVERICKS hub" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-6 text-[15px]">
      {ITEMS.map((i) => {
        const active = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} aria-current={active ? "page" : undefined}
            className={`border-b-2 py-3 ${active ? "border-navy font-semibold text-ink" : "border-transparent text-ink-muted hover:text-ink"}`}>
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
