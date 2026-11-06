import { notFound, redirect } from "next/navigation";
import { EntryView } from "@/components/hub/EntryView";
import { getI18n } from "@/i18n/server";
import { getTeamSession } from "@/lib/auth/session";
import { countryName } from "@/lib/hub/countries";
import { listAllEntriesForAdmin } from "@/lib/hub/repository";

export const metadata = { title: "Draft preview · Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Team-only preview of any hub entry, drafts included (RLS limits rows to team members). */
export default async function HubPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await getTeamSession())) redirect("/login");
  const [{ id }, { t, locale }] = await Promise.all([params, getI18n()]);
  const all = await listAllEntriesForAdmin();
  if (!all.ok) notFound();
  const entry = all.data.find((e) => e.id === id);
  if (!entry) notFound();
  const byId = new Map(all.data.map((e) => [e.id, e]));
  const related = entry.relatedIds.map((r) => byId.get(r)).filter((r): r is NonNullable<typeof r> => Boolean(r));
  return (
    <div className="-mx-5 -my-10 bg-canvas lg:-mx-10">
      <EntryView e={entry} related={related} t={t} locale={locale} country={countryName(entry.countryCode, locale)} preview />
    </div>
  );
}
