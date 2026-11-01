import type { Metadata } from "next";
import { AiWorkspaceShell } from "@/components/ai/AiWorkspaceShell";
import { getI18n } from "@/i18n/server";

export const metadata: Metadata = { title: "Mavericks AI" };

export default async function AiPage() {
  const { t } = await getI18n();
  return (
    <div className="mx-auto grid max-w-content gap-x-6 gap-y-10 px-5 py-16 lg:grid-cols-12 lg:px-10 lg:py-24">
      <div className="lg:col-span-4">
        <h1 className="t-h1 text-navy">{t.ai.title}</h1>
        <p className="mt-5 text-ink-muted">{t.ai.intro}</p>
        <p className="mt-6 border-l-2 border-accent pl-4 text-[14px] text-ink-muted">{t.ai.status}</p>
      </div>
      <div className="lg:col-span-7 lg:col-start-6"><AiWorkspaceShell t={t} mode="preview" /></div>
    </div>
  );
}
