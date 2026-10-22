import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-content px-5 py-28 lg:px-8">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 text-4xl font-semibold text-navy">This page or document is not published.</h1>
      <Link href="/manuals" className="mt-8 inline-flex font-semibold text-tech hover:underline">← Manual library</Link>
    </div>
  );
}
