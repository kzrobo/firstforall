import Image from "next/image";

/**
 * FIRST FOR ALL lockup. The emblem file is the authentic MAVERICKS mark on white;
 * multiply blending lets it sit on any light ground, screen blending on navy.
 */
export function BrandMark({ tone = "light" }: { tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <span className="flex items-center gap-3">
      <Image
        src={dark ? "/brand/mavericks-emblem.jpg" : "/brand/mavericks-emblem-light.jpg"}
        alt=""
        width={40}
        height={40}
        priority
        className={`size-9 shrink-0 ${dark ? "mix-blend-screen [mask-image:radial-gradient(closest-side,#000_60%,transparent)]" : "mix-blend-multiply"}`}
      />
      <span className="leading-none">
        <span className={`font-display block text-[14px] font-semibold tracking-[-0.01em] ${dark ? "text-white" : "text-navy"}`}>FIRST FOR ALL</span>
        <span className={`mt-1 block text-[11.5px] font-medium tracking-[0.01em] ${dark ? "text-white/55" : "text-ink-muted"}`}>MAVERICKS · FTC #24034</span>
      </span>
    </span>
  );
}
