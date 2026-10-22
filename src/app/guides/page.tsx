import { ComingSoon } from "@/components/ui/ComingSoon";
import { getI18n } from "@/i18n/server";

export const metadata = { title: "Technical guides" };
export default async function GuidesPage() {
  const { t } = await getI18n();
  return <ComingSoon t={t} title={t.nav.guides} />;
}
