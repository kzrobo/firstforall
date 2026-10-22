"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({ email: z.string().email().max(254), password: z.string().min(8).max(200) });

export async function signIn(_prev: { error: boolean }, form: FormData): Promise<{ error: boolean }> {
  const parsed = schema.safeParse({ email: form.get("email"), password: form.get("password") });
  const supabase = await createSupabaseServerClient();
  if (!parsed.success || !supabase) return { error: true };
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: true };
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  redirect("/");
}
