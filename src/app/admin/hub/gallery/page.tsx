import Link from "next/link";
import { redirect } from "next/navigation";
import { ProjectGallerySection } from "@/components/hub/ProjectGallerySection";
import { getI18n } from "@/i18n/server";
import { getTeamSession } from "@/lib/auth/session";
import { toGalleryItems } from "@/lib/hub/gallery";
import { listAllEntriesForAdmin } from "@/lib/hub/repository";
import { sortEntries } from "@/lib/hub/types";

export const metadata = { title: "Gallery preview · Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Team-only: the project gallery with drafts included; tiles open the draft previews. */
export default async function HubGalleryPreview() {
  if (!(await getTeamSession())) redirect("/login");
  const [{ t }, all] = await Promise.all([getI18n(), listAllEntriesForAdmin()]);
  const entries = all.ok ? sortEntries(all.data.filter((e) => e.status !== "archived" && e.category !== "connects")) : [];
  const items = toGalleryItems(entries, (e) => `/admin/hub/${e.id}/preview`);
  return (
    <div className="-mx-5 -my-10 bg-canvas lg:-mx-10">
      <p role="status" className="border-b border-line bg-mist px-5 py-3 text-center text-[15px] font-medium text-navy lg:px-10">{t.hub.draftPreview}</p>
      <div className="pt-12 lg:pt-16">
        {items.length ? <ProjectGallerySection t={t} items={items} /> : (
          <p className="mx-auto max-w-content px-5 pb-20 text-ink-muted lg:px-10">No entries with images yet. <Link href="/admin/hub" className="link-rule text-ink">Back to the hub</Link></p>
        )}
      </div>
    </div>
  );
}
