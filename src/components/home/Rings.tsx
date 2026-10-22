/** Concentric field rings — the BioBuzz season motif, drawn as fine linework. */
export function Rings({ className = "", stroke = "currentColor", count = 5 }: { className?: string; stroke?: string; count?: number }) {
  return (
    <svg aria-hidden viewBox="0 0 1000 1000" className={className} fill="none">
      {Array.from({ length: count }, (_, i) => (
        <circle key={i} cx="500" cy="500" r={140 + i * 85} stroke={stroke} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}
