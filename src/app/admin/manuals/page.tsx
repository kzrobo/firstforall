import Link from "next/link";
import { formatBytes } from "@/components/manuals/format";
import { languageName } from "@/lib/languages";
import { listManualsForTeam } from "@/lib/manuals/repository";

export const metadata = { title: "Manuals · Admin" };

/** Every manual edition and language the team can see, drafts included, with links to the draft preview reader. */
export default async function AdminManualsPage() {
  const result = await listManualsForTeam();
  return (
    <div>
      <h1 className="t-h2 text-ink">Manuals</h1>
      <p className="mt-3 max-w-2xl text-[15px] text-ink-muted">
        Imported with <code className="text-[14px]">scripts/import-manuals.mjs</code>. Drafts are visible only here; the public library lists published editions only.
      </p>
      {!result.ok ? (
        <p className="mt-8 text-ink-muted">The manuals database is not connected.</p>
      ) : (
        <div className="mt-10 space-y-12">
          {result.data.map(({ manual: m, status }) => (
            <section key={m.id} aria-labelledby={`m-${m.id}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-ink pb-3">
                <h2 id={`m-${m.id}`} className="text-[19px] font-semibold tracking-[-0.015em] text-ink">
                  {m.title} <span className="font-normal text-ink-muted">· {m.season} · {m.revision}</span>
                </h2>
                <p className="text-[14px] text-ink-muted">Edition: <span className="font-semibold text-ink">{status}</span> · {m.translations.length} languages</p>
              </div>
              <table className="w-full text-left text-[15px]">
                <thead className="text-[13px] text-ink-muted">
                  <tr className="border-b border-line"><th className="py-2.5 pr-4 font-medium">Language</th><th className="py-2.5 pr-4 font-medium">Type</th><th className="py-2.5 pr-4 font-medium">Revision</th><th className="py-2.5 pr-4 font-medium">Pages</th><th className="py-2.5 pr-4 font-medium">Size</th><th className="py-2.5 pr-4 font-medium">Status</th><th className="py-2.5 font-medium"><span className="sr-only">Actions</span></th></tr>
                </thead>
                <tbody>
                  {m.translations.map((tr) => (
                    <tr key={tr.id} className="border-b border-line">
                      <td className="py-3 pr-4 font-medium text-ink">{languageName(tr.language, "en")} <span className="text-[13px] text-ink-muted">{tr.language}</span></td>
                      <td className="py-3 pr-4 text-ink-muted">{tr.isSource ? "Official source" : "Community translation"}</td>
                      <td className="py-3 pr-4">{tr.revision}</td>
                      <td className="t-num py-3 pr-4">{tr.pageCount ?? "—"}</td>
                      <td className="t-num py-3 pr-4 text-ink-muted">{formatBytes(tr.fileSizeBytes)}</td>
                      <td className="py-3 pr-4">{tr.status === "published" ? "Published" : <span className="rounded bg-mist px-1.5 py-0.5 text-[13px] font-semibold text-navy">{tr.status}</span>}</td>
                      <td className="py-3 text-right"><Link href={`/admin/manuals/${m.slug}/preview?lang=${tr.language}`} className="link-rule font-medium text-ink">Preview</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
