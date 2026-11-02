import { redirect } from "next/navigation";
import { getTeamSession } from "@/lib/auth/session";
import { signOut } from "../login/actions";
import { AdminNav } from "./AdminNav";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Every /admin route is checked on the server; database policies enforce the same rules again. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getTeamSession();
  if (!session) redirect("/login");
  return (
    <div className="min-h-[70vh] bg-paper">
      <div className="border-b border-line">
        <div className="mx-auto flex max-w-content flex-wrap items-end justify-between gap-x-8 px-5 pt-8 lg:px-10">
          <div>
            <p className="t-index">Team workspace</p>
            <p className="font-display mt-1 text-[20px] font-medium tracking-[-0.02em] text-ink">Admin</p>
            <AdminNav />
          </div>
          <form action={signOut} className="pb-3 text-[13px] text-ink-muted">
            {session.email} · {session.role === "super_admin" ? "Founder / Super Admin" : session.canPublish ? "Editor (can publish)" : "Editor"}
            <button className="link-rule ml-3 font-medium text-tech">Sign out</button>
          </form>
        </div>
      </div>
      <div className="mx-auto max-w-content px-5 py-10 lg:px-10">{children}</div>
    </div>
  );
}
