import { ComingSoon } from "@/components/ui/ComingSoon";
import { getI18n } from "@/i18n/server";

export const metadata = { title: "Bookmarks" };
export default async function BookmarksPage() {
  const { t } = await getI18n();
  return <ComingSoon t={t} title="Bookmarks" />;
}
