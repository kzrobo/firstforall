export function Notice({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "warning" }) {
  const styles = tone === "warning" ? "border-honey bg-honey-pale/50" : "border-line bg-soft";
  return <div role="status" className={`border-l-2 px-5 py-4 text-[15px] text-ink-muted ${styles}`}>{children}</div>;
}
