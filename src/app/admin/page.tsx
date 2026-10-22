import { redirect } from "next/navigation";
import { getTeamSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signOut } from "../login/actions";

export const metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getTeamSession();
  if (!session) redirect("/login");
  const supabase = (await createSupabaseServerClient())!;
  const { data: manuals } = await supabase
    .from("manuals")
    .select("id, slug, title, season, status, revision, manual_translations(language_code, status, ingestion_status)")
    .order("updated_at", { ascending: false });

  return (
    <div className="mx-auto max-w-content px-5 py-14 lg:px-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-3xl font-semibold text-navy">Admin overview</h1>
        <form action={signOut} className="text-sm text-ink-muted">
          {session.email} · {session.role === "super_admin" ? "Founder / Super Admin" : "Editor"}{" "}
          <button className="ml-2 font-semibold text-tech hover:underline">Sign out</button>
        </form>
      </div>
      <p className="mt-3 max-w-2xl text-ink-muted">
        Manual creation, PDF upload and publishing screens are Milestone C. Until then, manage records in the Supabase dashboard; database policies enforce the same role rules.
      </p>
      <table className="mt-10 w-full text-left text-sm">
        <thead className="border-b border-line text-xs uppercase tracking-wider text-ink-muted">
          <tr><th className="py-2">Manual</th><th>Season</th><th>Status</th><th>Translations</th></tr>
        </thead>
        <tbody>
          {(manuals ?? []).map((m) => (
            <tr key={m.id} className="border-b border-line">
              <td className="py-3 font-medium">{m.title}<span className="block text-xs text-ink-muted">/{m.slug} · rev {m.revision}</span></td>
              <td>{m.season}</td>
              <td className="capitalize">{m.status.replace("_", " ")}</td>
              <td>{m.manual_translations.map((t) => `${t.language_code} (${t.status}, AI: ${t.ingestion_status})`).join(", ") || "—"}</td>
            </tr>
          ))}
          {!manuals?.length && <tr><td colSpan={4} className="py-6 text-ink-muted">No manuals yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
