"use client";
import { useActionState } from "react";
import { signIn } from "./actions";

export function LoginForm({ t }: { t: { email: string; password: string; submit: string; error: string } }) {
  const [state, action, pending] = useActionState(signIn, { error: false });
  const input = "mt-1.5 h-11 w-full rounded-md border border-line-strong bg-canvas px-3";
  return (
    <form action={action} className="mt-10 space-y-5">
      <label className="block text-sm font-medium">{t.email}<input name="email" type="email" autoComplete="email" required className={input} /></label>
      <label className="block text-sm font-medium">{t.password}<input name="password" type="password" autoComplete="current-password" required minLength={8} className={input} /></label>
      {state.error && <p role="alert" className="text-sm text-red-700">{t.error}</p>}
      <button disabled={pending} className="btn-primary w-full justify-center disabled:opacity-60">{t.submit}</button>
    </form>
  );
}
