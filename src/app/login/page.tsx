import { Notice } from "@/components/ui/Notice";
import { getI18n } from "@/i18n/server";
import { isSupabaseConfigured } from "@/lib/env";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Team sign in", robots: { index: false } };

export default async function LoginPage() {
  const { t } = await getI18n();
  return (
    <div className="mx-auto max-w-md px-5 py-20">
      <h1 className="text-3xl font-semibold tracking-[-0.02em] text-navy">{t.login.title}</h1>
      <p className="mt-3 text-ink-muted">{t.login.intro}</p>
      {isSupabaseConfigured() ? <LoginForm t={t.login} /> : <div className="mt-8"><Notice tone="warning">{t.login.notConfigured}</Notice></div>}
    </div>
  );
}
