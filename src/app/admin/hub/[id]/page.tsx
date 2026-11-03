import Link from "next/link";
import { notFound } from "next/navigation";
import { getTeamSession } from "@/lib/auth/session";
import { countryOptions } from "@/lib/hub/countries";
import { listAllEntriesForAdmin } from "@/lib/hub/repository";
import { HubEntryForm } from "../HubEntryForm";

export const metadata = { title: "Edit entry · Admin" };

export default async function EditHubEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [session, all] = await Promise.all([getTeamSession(), listAllEntriesForAdmin()]);
  if (!all.ok) return <p className="text-ink-muted">Could not load the entry.</p>;
  const entry = all.data.find((e) => e.id === id);
  if (!entry) notFound();
  return (
    <div>
      <Link href={`/admin/hub?category=${entry.category}`} className="text-[14px] text-ink-muted hover:text-ink">← MAVERICKS hub</Link>
      <h1 className="t-h2 mt-3 border-b border-rule pb-4 text-ink">Edit entry</h1>
      <div className="mt-8">
        <HubEntryForm entry={entry} initialCategory={entry.category} countries={countryOptions()}
          others={all.data.filter((e) => e.id !== entry.id).map((e) => ({ id: e.id, title: e.title, category: e.category }))} canPublish={Boolean(session?.canPublish)} />
      </div>
    </div>
  );
}
