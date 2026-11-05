"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * On the homepage the header floats transparently (white type) over the full-viewport hero video
 * and turns into the white bar once the page scrolls. If the hero has no media, or on any other
 * page, it is the white sticky bar from the start.
 */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const home = usePathname() === "/";
  const [media, setMedia] = useState(home);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    setMedia(home && !!document.querySelector("[data-hero-media]"));
    if (!home) return;
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [home]);

  const overlay = home && media && !scrolled;
  const solid = "border-b border-line bg-canvas/95 supports-[backdrop-filter]:bg-canvas/85 backdrop-blur-[8px]";
  const cls = home && media
    ? `fixed inset-x-0 top-0 z-40 transition-[background-color,border-color] duration-300 ${overlay ? "on-media border-b border-transparent bg-transparent" : solid}`
    : `sticky top-0 z-40 ${solid}`;
  return <header data-overlay={overlay ? "" : undefined} className={cls}>{children}</header>;
}
