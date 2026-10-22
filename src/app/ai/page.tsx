import { ComingSoon } from "@/components/ui/ComingSoon";
import { getI18n } from "@/i18n/server";

export const metadata = { title: "Mavericks AI" };
export default async function AiPage() {
  const { t } = await getI18n();
  return (
    <ComingSoon t={t} title={t.nav.ai}>
      <p className="mt-6 max-w-xl text-ink-muted">{t.home.aiBody}</p>
    </ComingSoon>
  );
}
