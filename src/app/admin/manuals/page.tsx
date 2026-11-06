import Link from "next/link";
import { formatBytes } from "@/components/manuals/format";
import { languageName } from "@/lib/languages";
import { getTeamSession } from "@/lib/auth/session";
import { listManualsForTeam } from "@/lib/manuals/repository";
import { publishManual, unpublishManual } from "./actions";

export const metadata = { title: "Manuals · Admin" };

/** Every manual edition and language the team can see, drafts included, with links to the draft preview reader. */
type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function AdminManualsPage({ searchParams }: Props) {
  const [result, session, sp] = await Promise.all([listManualsForTeam(), getTeamSession(), searchParams]);
  const notice = sp.published ? `Published “${sp.published}”. It is now in the public library.` : sp.unpublished ? `“${sp.unpublished}” is a draft again; its public files were removed.` : null;
  const error = sp.error === "forbidden" ? "That change was refused for your role." : sp.error ? `Could not change the edition${sp.detail ? `: ${sp.detail}` : "."}` : null;
  return (
    <div>
      <h1 className="t-h2 text-ink">Manuals</h1>
      <p className="mt-3 max-w-2xl text-[15px] text-ink-muted">
        Imported with <code className="text-[14px]">scripts/import-manuals.mjs</code>. Draft files are stored privately and visible only here; publishing an edition copies its files to the public library.
      </p>
      {notice && <p role="status" className="mt-6 border-l-2 border-accent bg-accent-pale/50 px-4 py-3 text-[14px]">{notice}</p>}
      {error && <p role="alert" className="mt-6 border-l-2 border-red-700 bg-canvas px-4 py-3 text-[14px] text-red-700">{error}</p>}
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
                <div className="flex flex-wrap items-center gap-4">
                  <p className="text-[14px] text-ink-muted">Edition: <span className="font-semibold text-ink">{status}</span> · {m.translations.length} languages</p>
                  {session?.canPublish && m.translations.some((tr) => tr.status !== "published") && (
                    <form action={publishManual}><input type="hidden" name="id" value={m.id} /><button className="btn-primary min-h-10 px-4 text-[14px]">Publish edition</button></form>
                  )}
                  {session?.role === "super_admin" && status === "published" && (
                    <form action={unpublishManual}><input type="hidden" name="id" value={m.id} /><button className="link-rule text-[14px] text-red-700">Unpublish</button></form>
                  )}
                </div>
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
