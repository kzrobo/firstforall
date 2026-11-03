import Link from "next/link";
import { getTeamSession } from "@/lib/auth/session";
import { isHubCategory } from "@/lib/hub/categories";
import { countryOptions } from "@/lib/hub/countries";
import { listAllEntriesForAdmin } from "@/lib/hub/repository";
import { HubEntryForm } from "../HubEntryForm";

export const metadata = { title: "New entry · Admin" };

export default async function NewHubEntryPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const [{ category }, session, all] = await Promise.all([searchParams, getTeamSession(), listAllEntriesForAdmin()]);
  return (
    <div>
      <Link href="/admin/hub" className="text-[14px] text-ink-muted hover:text-ink">← MAVERICKS hub</Link>
      <h1 className="t-h2 mt-3 border-b border-rule pb-4 text-ink">New entry</h1>
      <div className="mt-8">
        <HubEntryForm initialCategory={category && isHubCategory(category) ? category : "inspires"} countries={countryOptions()}
          others={all.ok ? all.data.map((e) => ({ id: e.id, title: e.title, category: e.category })) : []} canPublish={Boolean(session?.canPublish)} />
      </div>
    </div>
  );
}
