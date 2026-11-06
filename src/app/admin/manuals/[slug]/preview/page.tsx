import { notFound, redirect } from "next/navigation";
import { ManualReader } from "@/components/reader/ManualReader";
import { getI18n } from "@/i18n/server";
import { getTeamSession } from "@/lib/auth/session";
import { resolveReaderTarget } from "@/lib/manuals/reader-nav";
import { getManualForTeam } from "@/lib/manuals/repository";

export const metadata = { title: "Draft preview · Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string; page?: string }> };

/** Team-only reader for unpublished manuals (same reader as the public site; RLS limits rows to team members). */
export default async function DraftPreviewPage({ params, searchParams }: Props) {
  if (!(await getTeamSession())) redirect("/login");
  const [{ slug }, sp, { t, locale }] = await Promise.all([params, searchParams, getI18n()]);
  const result = await getManualForTeam(slug);
  if (!result.ok || !result.data) notFound();
  const { manual } = result.data;
  const { translation, page } = resolveReaderTarget(manual.translations, sp);
  if (!translation) notFound();
  return (
    <ManualReader
      key={translation.id}
      manual={{ slug: manual.slug, title: `${manual.title} — draft preview` }}
      translations={manual.translations}
      current={translation}
      initialPage={page}
      t={t.reader}
      locale={locale}
      basePath={`/admin/manuals/${encodeURIComponent(manual.slug)}/preview`}
      backHref="/admin/manuals"
    />
  );
}
