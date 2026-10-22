export function Section({ id, eyebrow, title, children, className = "", labelId }: {
  id?: string; eyebrow: string; title?: string; children: React.ReactNode; className?: string; labelId?: string;
}) {
  const headingId = labelId ?? (id ? `${id}-title` : undefined);
  return (
    <section id={id} aria-labelledby={title ? headingId : undefined} className={`mx-auto max-w-content px-5 py-20 lg:px-8 lg:py-28 ${className}`}>
      <p className="eyebrow">{eyebrow}</p>
      {title && <h2 id={headingId} className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.02em] text-navy md:text-[2.5rem]">{title}</h2>}
      {children}
    </section>
  );
}
