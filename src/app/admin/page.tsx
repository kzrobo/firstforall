import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminOverviewPage() {
  const supabase = (await createSupabaseServerClient())!;
  const [{ data: manuals }, { count: lessonCount }, { count: publishedLessons }] = await Promise.all([
    supabase.from("manuals").select("id, slug, title, season, status, revision, manual_translations(language_code, status, ingestion_status)").order("updated_at", { ascending: false }),
    supabase.from("lessons").select("id", { count: "exact", head: true }),
    supabase.from("lessons").select("id", { count: "exact", head: true }).eq("status", "published"),
  ]);

  return (
    <div className="space-y-14">
      <section aria-labelledby="lessons-h">
        <div className="flex items-baseline justify-between border-b border-rule pb-3">
          <h1 id="lessons-h" className="t-h3 text-ink">Lessons</h1>
          <Link href="/admin/lessons" className="link-arrow text-[14px] text-tech">Manage lessons</Link>
        </div>
        <p className="mt-4 text-[15px] text-ink-muted"><span className="t-num font-semibold text-ink">{publishedLessons ?? 0}</span> published of <span className="t-num font-semibold text-ink">{lessonCount ?? 0}</span> total.</p>
      </section>

      <section aria-labelledby="manuals-h">
        <div className="flex items-baseline justify-between border-b border-rule pb-3">
          <h2 id="manuals-h" className="t-h3 text-ink">Manuals</h2>
        </div>
        <p className="mt-4 max-w-2xl text-[14px] text-ink-muted">
          Manual upload and publishing screens are not built yet. Until then, manage manual records in the Supabase dashboard; database policies enforce the same role rules.
        </p>
        <table className="mt-6 w-full text-left text-[14px]">
          <thead className="border-b border-line text-[13px] text-ink-muted">
            <tr><th className="py-2 font-medium">Manual</th><th className="font-medium">Season</th><th className="font-medium">Status</th><th className="font-medium">Translations</th></tr>
          </thead>
          <tbody>
            {(manuals ?? []).map((m) => (
              <tr key={m.id} className="border-b border-line">
                <td className="py-3 font-medium">{m.title}<span className="block text-[13px] font-normal text-ink-muted">/{m.slug} · rev {m.revision}</span></td>
                <td>{m.season}</td>
                <td className="capitalize">{m.status.replace("_", " ")}</td>
                <td>{m.manual_translations.map((t) => `${t.language_code} (${t.status})`).join(", ") || "—"}</td>
              </tr>
            ))}
            {!manuals?.length && <tr><td colSpan={4} className="py-6 text-ink-muted">No manuals yet.</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}
