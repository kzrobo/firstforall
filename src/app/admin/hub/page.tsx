import Link from "next/link";
import { getTeamSession } from "@/lib/auth/session";
import { HUB_CATEGORIES, categoryTitle, isHubCategory } from "@/lib/hub/categories";
import { listAllEntriesForAdmin } from "@/lib/hub/repository";
import { HubDeleteButton } from "./HubDeleteButton";
import { deleteHubEntry, setHubStatus } from "./actions";

export const metadata = { title: "MAVERICKS hub · Admin" };
type Props = { searchParams: Promise<Record<string, string | undefined>> };
const MESSAGES: Record<string, string> = { forbidden: "That change was refused for your role.", invalid: "That request was incomplete. Nothing was changed." };

export default async function AdminHubPage({ searchParams }: Props) {
  const [sp, session, result] = await Promise.all([searchParams, getTeamSession(), listAllEntriesForAdmin()]);
  const active = sp.category && isHubCategory(sp.category) ? sp.category : null;
  const all = result.ok ? result.data : [];
  const rows = active ? all.filter((e) => e.category === active) : all;
  const notice = sp.saved ? `Saved “${sp.saved}”.` : sp.deleted ? "Entry deleted." : sp.status ? `Status changed to ${sp.status}.` : null;
  const error = sp.error ? MESSAGES[sp.error] ?? MESSAGES.invalid : null;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-4">
        <div>
          <h1 className="t-h2 text-ink">MAVERICKS hub</h1>
          <p className="mt-2 text-[14px] text-ink-muted">Projects, collaborations, case studies, events and milestones. Only published entries are public; drafts can be incomplete.</p>
        </div>
        <Link href={`/admin/hub/new${active ? `?category=${active}` : ""}`} className="btn-primary">New entry</Link>
      </div>
      <nav aria-label="Categories" className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[14px]">
        {[null, ...HUB_CATEGORIES].map((c) => (
          <Link key={c ?? "all"} href={c ? `/admin/hub?category=${c}` : "/admin/hub"} aria-current={c === active ? "page" : undefined}
            className={`border-b-2 py-1.5 ${c === active ? "border-accent text-ink" : "border-transparent text-ink-muted hover:text-ink"}`}>
            {c ? categoryTitle(c).replace("MAVERICKS ", "") : "All"} <span className="t-num text-ink-faint">{c ? all.filter((e) => e.category === c).length : all.length}</span>
          </Link>
        ))}
      </nav>
      {notice && <p role="status" className="mt-6 border-l-2 border-accent bg-accent-pale px-4 py-3 text-[14px]">{notice}</p>}
      {error && <p role="alert" className="mt-6 border-l-2 border-red-700 bg-red-950/40 px-4 py-3 text-[14px] text-red-100">{error}</p>}
      {!result.ok ? (
        <p className="mt-8 text-ink-muted">Could not load entries: {result.reason === "not_configured" ? "database not configured." : result.message}</p>
      ) : rows.length === 0 ? (
        <p className="mt-8 text-ink-muted">No entries here yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-[14px]">
            <thead className="border-b border-line text-[13px] text-ink-faint">
              <tr><th className="py-2 pr-4 font-medium">Entry</th><th className="pr-4 font-medium">Category</th><th className="pr-4 font-medium">Status</th><th className="pr-4 font-medium">Updated</th><th><span className="sr-only">Actions</span></th></tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className="border-b border-line align-top">
                  <td className="py-4 pr-4">
                    <Link href={`/admin/hub/${e.id}`} className="font-medium text-ink hover:underline">{e.title}</Link>
                    <span className="mt-0.5 block text-[13px] text-ink-faint">/mavericks/{e.category}/{e.slug}</span>
                  </td>
                  <td className="py-4 pr-4 text-ink-muted">{categoryTitle(e.category).replace("MAVERICKS ", "")}</td>
                  <td className="py-4 pr-4">
                    <span className={e.status === "published" ? "font-medium text-ink" : "text-ink-muted"}>{e.status === "published" ? "Published" : e.status === "archived" ? "Archived" : "Draft"}</span>
                    {e.isFeatured && <span className="ml-2 rounded bg-mist px-1.5 py-0.5 text-[13px] font-semibold text-navy">Featured</span>}
                  </td>
                  <td className="t-num py-4 pr-4 text-ink-faint">{e.updatedAt.slice(0, 10)}</td>
                  <td className="whitespace-nowrap py-3 text-right">
                    <Link href={`/admin/hub/${e.id}`} className="link-rule mr-4 text-tech">Edit</Link>
                    {session?.canPublish && (
                      <>
                        <form action={setHubStatus} className="mr-4 inline">
                          <input type="hidden" name="id" value={e.id} />
                          <input type="hidden" name="status" value={e.status === "published" ? "draft" : "published"} />
                          <button className="link-rule text-tech">{e.status === "published" ? "Unpublish" : "Publish"}</button>
                        </form>
                        {e.status !== "archived" && (
                          <form action={setHubStatus} className="mr-4 inline">
                            <input type="hidden" name="id" value={e.id} /><input type="hidden" name="status" value="archived" />
                            <button className="link-rule text-ink-muted">Archive</button>
                          </form>
                        )}
                      </>
                    )}
                    <Link href={`/admin/hub/${e.id}/preview`} className="link-rule mr-4 text-ink-muted">Preview</Link>
                    {e.status === "published" && <Link href={`/mavericks/${e.category}/${e.slug}`} className="link-rule mr-4 text-ink-muted">View</Link>}
                    {session?.canPublish && <HubDeleteButton id={e.id} title={e.title} action={deleteHubEntry} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
