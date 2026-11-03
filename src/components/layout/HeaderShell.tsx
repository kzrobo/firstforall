"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * On the homepage the header floats transparently over the full-viewport hero and turns solid
 * once the page scrolls; everywhere else it is a solid sticky bar.
 */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const overlay = usePathname() === "/";
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    if (!overlay) return;
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [overlay]);

  const solid = "border-b border-line bg-canvas/95 supports-[backdrop-filter]:bg-canvas/85 backdrop-blur-[6px]";
  const cls = overlay
    ? `fixed inset-x-0 top-0 z-40 transition-[background-color,border-color] duration-300 ${scrolled ? solid : "border-b border-transparent bg-transparent"}`
    : `sticky top-0 z-40 ${solid}`;
  return <header data-overlay={overlay && !scrolled ? "" : undefined} className={cls}>{children}</header>;
}
