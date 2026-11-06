import Image from "next/image";

/**
 * FIRST FOR ALL lockup with the authentic MAVERICKS emblem. On white the light emblem file
 * multiplies into the page; inside an .on-media area (header over the hero video) the navy
 * emblem file is screened onto the image instead. Text colours follow the tokens.
 */
export function BrandMark() {
  return (
    <span className="flex items-center gap-3">
      <span className="relative size-9 shrink-0 lg:size-10">
        <Image src="/brand/mavericks-emblem-light.jpg" alt="" width={40} height={40} priority className="size-9 mix-blend-multiply in-[.on-media]:hidden lg:size-10" />
        <Image src="/brand/mavericks-emblem.jpg" alt="" width={40} height={40} priority
          className="hidden size-9 mix-blend-screen lg:size-10 [mask-image:radial-gradient(closest-side,#000_60%,transparent)] in-[.on-media]:block" />
      </span>
      <span className="leading-none">
        <span data-wordmark className="font-display block whitespace-nowrap text-[16px] font-bold tracking-[-0.01em] text-ink xl:text-[17px]">FIRST FOR ALL</span>
        <span data-sublabel className="mt-[7px] block whitespace-nowrap text-[12.5px] font-semibold uppercase tracking-[0.05em] text-ink-muted xl:text-[13px] xl:tracking-[0.06em]">MAVERICKS · FTC #24034</span>
      </span>
    </span>
  );
}
