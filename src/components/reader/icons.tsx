const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const paths: Record<string, React.ReactNode> = {
  toc: <path d="M4 6h16M4 12h10M4 18h13" />,
  prev: <path d="m14.5 6-6 6 6 6" />,
  next: <path d="m9.5 6 6 6-6 6" />,
  minus: <path d="M6 12h12" />,
  plus: <path d="M12 6v12M6 12h12" />,
  fit: <path d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4M8 12h8" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>,
  download: <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14" />,
  print: <><path d="M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2" /><path d="M7 14h10v6H7z" /></>,
  expand: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  more: <><circle cx="5.5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="18.5" cy="12" r="1" /></>,
  close: <path d="M6 6l12 12M18 6 6 18" />,
};
export function Icon({ name, className = "size-[18px]" }: { name: keyof typeof paths | string; className?: string }) {
  return <svg aria-hidden viewBox="0 0 24 24" className={className} {...P}>{paths[name]}</svg>;
}
