"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getTeamSession } from "@/lib/auth/session";
import { DRAFT_BUCKET, PUBLIC_BUCKET } from "@/lib/manuals/repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Publishing a manual edition: every unpublished translation's file is copied from the private
 * 'manuals-draft' bucket to 'manuals-public' (the original stays in the draft bucket), then the
 * translations and the edition are marked published. Only roles that may publish can do this;
 * the database policies enforce the same rule.
 */
export async function publishManual(form: FormData) {
  const session = await getTeamSession();
  const id = z.string().uuid().safeParse(form.get("id"));
  if (!session?.canPublish || !id.success) redirect("/admin/manuals?error=forbidden");
  const supabase = (await createSupabaseServerClient())!;
  const { data: manual } = await supabase.from("manuals").select("id, slug, manual_translations ( id, file_path, status )").eq("id", id.data).maybeSingle();
  if (!manual) redirect("/admin/manuals?error=missing");
  const now = new Date().toISOString();
  const problems: string[] = [];
  for (const t of (manual.manual_translations ?? []) as { id: string; file_path: string; status: string }[]) {
    if (t.status === "published") continue;
    const { error: copyError } = await supabase.storage.from(DRAFT_BUCKET).copy(t.file_path, t.file_path, { destinationBucket: PUBLIC_BUCKET });
    // "already exists": a file imported before drafts were private — it is already public.
    if (copyError && !/exists|duplicate/i.test(copyError.message)) { problems.push(`${t.file_path}: ${copyError.message}`); continue; }
    const { error } = await supabase.from("manual_translations").update({ status: "published", published_at: now }).eq("id", t.id);
    if (error) problems.push(`${t.file_path}: ${error.message}`);
  }
  if (problems.length) redirect(`/admin/manuals?error=publish&detail=${encodeURIComponent(problems.slice(0, 3).join("; "))}`);
  const { error } = await supabase.from("manuals").update({ status: "published", published_at: now }).eq("id", manual.id);
  if (error) redirect(`/admin/manuals?error=publish&detail=${encodeURIComponent(error.message)}`);
  revalidatePath("/manuals"); revalidatePath(`/manuals/${manual.slug}`); revalidatePath("/"); revalidatePath("/admin/manuals");
  redirect(`/admin/manuals?published=${encodeURIComponent(manual.slug)}`);
}

/** Unpublishing (super admins): back to draft and the public copies are removed; originals stay private. */
export async function unpublishManual(form: FormData) {
  const session = await getTeamSession();
  const id = z.string().uuid().safeParse(form.get("id"));
  if (session?.role !== "super_admin" || !id.success) redirect("/admin/manuals?error=forbidden");
  const supabase = (await createSupabaseServerClient())!;
  const { data: manual } = await supabase.from("manuals").select("id, slug, manual_translations ( id, file_path )").eq("id", id.data).maybeSingle();
  if (!manual) redirect("/admin/manuals?error=missing");
  const translations = (manual.manual_translations ?? []) as { id: string; file_path: string }[];
  const { error } = await supabase.from("manuals").update({ status: "draft" }).eq("id", manual.id);
  if (error) redirect(`/admin/manuals?error=publish&detail=${encodeURIComponent(error.message)}`);
  await supabase.from("manual_translations").update({ status: "draft" }).eq("manual_id", manual.id);
  // Remove public copies only where the private original exists, so nothing is ever lost.
  const { data: drafts } = await supabase.storage.from(DRAFT_BUCKET).createSignedUrls(translations.map((t) => t.file_path), 60);
  const safe = (drafts ?? []).filter((d) => d.signedUrl && !d.error && d.path).map((d) => d.path!) ;
  if (safe.length) await supabase.storage.from(PUBLIC_BUCKET).remove(safe);
  revalidatePath("/manuals"); revalidatePath(`/manuals/${manual.slug}`); revalidatePath("/"); revalidatePath("/admin/manuals");
  redirect(`/admin/manuals?unpublished=${encodeURIComponent(manual.slug)}`);
}
