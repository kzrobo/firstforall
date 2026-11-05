import Image from "next/image";

/**
 * FIRST FOR ALL lockup with the authentic MAVERICKS emblem. On white the light emblem file
 * multiplies into the page; inside an .on-media area (header over the hero video) the navy
 * emblem file is screened onto the image instead. Text colours follow the tokens.
 */
export function BrandMark() {
  return (
    <span className="flex items-center gap-3">
      <span className="relative size-9 shrink-0">
        <Image src="/brand/mavericks-emblem-light.jpg" alt="" width={40} height={40} priority className="size-9 mix-blend-multiply in-[.on-media]:hidden" />
        <Image src="/brand/mavericks-emblem.jpg" alt="" width={40} height={40} priority
          className="hidden size-9 mix-blend-screen [mask-image:radial-gradient(closest-side,#000_60%,transparent)] in-[.on-media]:block" />
      </span>
      <span className="leading-none">
        <span className="font-display block text-[14.5px] font-semibold tracking-[-0.02em] text-ink">FIRST FOR ALL</span>
        <span className="mt-1.5 block text-[13px] font-medium text-ink-muted">MAVERICKS · FTC #24034</span>
      </span>
    </span>
  );
}
