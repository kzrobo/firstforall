"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getTeamSession } from "@/lib/auth/session";
import { parseDuration, parseYouTubeUrl, slugify } from "@/lib/learn/youtube";
import { isLanguageTag } from "@/lib/languages";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface LessonFormState { error?: string; fieldErrors?: Partial<Record<string, string>> }

const formSchema = z.object({
  id: z.string().uuid().optional(),
  youtube_url: z.string().min(1, "Paste a YouTube link."),
  title: z.string().trim().min(2, "Enter a title (at least 2 characters).").max(160),
  slug: z.string().trim().max(80),
  description: z.string().trim().max(4000),
  category_id: z.string().uuid("Choose a category."),
  language_code: z.string().trim().refine(isLanguageTag, "Use a language code such as en, kk, ru or es."),
  duration: z.string(),
  display_order: z.coerce.number().int().min(-9999).max(9999),
  status: z.enum(["draft", "published"]),
  is_featured: z.boolean(),
});

function revalidateLearn(slug?: string) {
  revalidatePath("/");
  revalidatePath("/learn");
  if (slug) revalidatePath(`/learn/${slug}`);
  revalidatePath("/admin/lessons");
}

export async function saveLesson(_prev: LessonFormState, form: FormData): Promise<LessonFormState> {
  const session = await getTeamSession();
  if (!session) return { error: "Your session has expired. Sign in again." };

  const parsed = formSchema.safeParse({
    id: (form.get("id") as string) || undefined,
    youtube_url: form.get("youtube_url") ?? "",
    title: form.get("title") ?? "",
    slug: form.get("slug") ?? "",
    description: form.get("description") ?? "",
    category_id: form.get("category_id") ?? "",
    language_code: form.get("language_code") ?? "",
    duration: form.get("duration") ?? "",
    display_order: form.get("display_order") || 0,
    status: form.get("status") ?? "draft",
    is_featured: form.get("is_featured") === "on",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { fieldErrors };
  }
  const v = parsed.data;

  const youtubeId = parseYouTubeUrl(v.youtube_url);
  if (!youtubeId) return { fieldErrors: { youtube_url: "This is not a YouTube video link. Use a youtube.com/watch, youtu.be or /shorts/ link." } };
  const duration = parseDuration(v.duration);
  if (Number.isNaN(duration)) return { fieldErrors: { duration: "Use minutes:seconds, e.g. 12:05, or leave it empty." } };
  const slug = (v.slug ? slugify(v.slug) : slugify(v.title)) || youtubeId.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (v.status === "published" && !session.canPublish) return { error: "Your role can save drafts but not publish. Ask a founder to publish this lesson." };

  const supabase = (await createSupabaseServerClient())!;
  if (v.is_featured) {
    // Only one featured lesson: clear the previous one first (guarded by a unique index too).
    let clear = supabase.from("lessons").update({ is_featured: false }).eq("is_featured", true);
    if (v.id) clear = clear.neq("id", v.id);
    const { error } = await clear;
    if (error) return { error: `Could not change the featured lesson: ${error.message}` };
  }

  const row = {
    slug, youtube_id: youtubeId, title: v.title, description: v.description || null, category_id: v.category_id,
    language_code: v.language_code, duration_seconds: duration, display_order: v.display_order, status: v.status, is_featured: v.is_featured,
  };
  const { error } = v.id
    ? await supabase.from("lessons").update(row).eq("id", v.id).select("id").single()
    : await supabase.from("lessons").insert({ ...row, created_by: session.userId }).select("id").single();
  if (error) {
    if (error.code === "23505") return { fieldErrors: { slug: "Another lesson already uses this address. Change the slug." } };
    if (error.code === "42501" || error.code === "PGRST116") return { error: "The database refused this change for your role." };
    return { error: `Could not save: ${error.message}` };
  }
  revalidateLearn(slug);
  redirect(`/admin/lessons?saved=${encodeURIComponent(v.title)}`);
}

export async function setLessonStatus(form: FormData) {
  const session = await getTeamSession();
  const id = z.string().uuid().safeParse(form.get("id"));
  const status = z.enum(["draft", "published"]).safeParse(form.get("status"));
  if (!session || !id.success || !status.success) redirect("/admin/lessons?error=invalid");
  if (status.data === "published" && !session.canPublish) redirect("/admin/lessons?error=forbidden");
  const supabase = (await createSupabaseServerClient())!;
  const { data, error } = await supabase.from("lessons").update({ status: status.data }).eq("id", id.data).select("slug");
  if (error || !data?.length) redirect("/admin/lessons?error=forbidden");
  revalidateLearn(data[0].slug);
  redirect(`/admin/lessons?status=${status.data}`);
}

export async function deleteLesson(form: FormData) {
  const session = await getTeamSession();
  const id = z.string().uuid().safeParse(form.get("id"));
  if (!session || !id.success || form.get("confirm") !== "delete") redirect("/admin/lessons?error=invalid");
  if (!session.canPublish) redirect("/admin/lessons?error=forbidden");
  const supabase = (await createSupabaseServerClient())!;
  const { data, error } = await supabase.from("lessons").delete().eq("id", id.data).select("slug");
  if (error || !data?.length) redirect("/admin/lessons?error=forbidden");
  revalidateLearn(data[0].slug);
  redirect("/admin/lessons?deleted=1");
}

/** Reads the public title via YouTube oEmbed (no API key). Falls back to manual entry on any failure. */
export async function fetchYouTubeTitle(url: string): Promise<{ title?: string; error?: string }> {
  if (!(await getTeamSession())) return { error: "Sign in again." };
  const id = parseYouTubeUrl(url);
  if (!id) return { error: "Paste a valid YouTube link first." };
  try {
    const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`, {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!res.ok) return { error: res.status === 401 || res.status === 403 ? "This video does not allow embedding or is private." : "YouTube did not return details. Enter the title manually." };
    const body = z.object({ title: z.string().min(1).max(300) }).safeParse(await res.json());
    return body.success ? { title: body.data.title.slice(0, 160) } : { error: "YouTube did not return a title. Enter it manually." };
  } catch {
    return { error: "Could not reach YouTube from the server. Enter the title manually." };
  }
}
