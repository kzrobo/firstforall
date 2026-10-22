import Image from "next/image";

/**
 * MAVERICKS lockup: the authentic emblem (its dark field dropped with a screen
 * blend so it sits cleanly on the night header) + a typeset wordmark.
 */
export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <Image src="/brand/mavericks-emblem.jpg" alt="" width={44} height={44} priority className="size-11 -m-1 mix-blend-screen [mask-image:radial-gradient(closest-side,#000_55%,transparent_100%)]" />
      {!compact && (
        <span className="flex items-center gap-3 leading-none">
          <span className="font-display text-[14px] font-semibold tracking-[0.04em] text-white">MAVERICKS</span>
          <span aria-hidden className="h-4 w-px bg-white/25" />
          <span className="text-[13px] font-medium text-white/60 t-num">#24034</span>
        </span>
      )}
    </span>
  );
}
