"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getTeamSession } from "@/lib/auth/session";
import { parseDuration, parseYouTubeUrl, slugify } from "@/lib/learn/youtube";
import { isLanguageTag } from "@/lib/languages";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EDITORIAL_FIELDS, type EditorialField } from "@/lib/youtube/plan";
import { runYouTubeSync } from "@/lib/youtube/sync";

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
  // Browsers submit textarea line breaks as CRLF; store and compare plain LF (as YouTube sends).
  v.description = v.description.replace(/\r\n?/g, "\n");

  const supabase = (await createSupabaseServerClient())!;
  // A lesson the YouTube sync tracks keeps its video; its editorial fields lock when edited.
  const { data: current } = v.id
    ? await supabase.from("lessons").select("youtube_id, source, locked_fields, title, description, category_id, duration_seconds, youtube_title, youtube_description, youtube_duration_seconds, youtube_availability").eq("id", v.id).maybeSingle()
    : { data: null };
  const tracked = Boolean(current && (current.source === "youtube" || current.youtube_availability !== null));
  const youtubeId = current?.source === "youtube" ? current.youtube_id as string : parseYouTubeUrl(v.youtube_url);
  if (!youtubeId) return { fieldErrors: { youtube_url: "This is not a YouTube video link. Use a youtube.com/watch, youtu.be or /shorts/ link." } };
  // One lesson per video: say which lesson already has it instead of failing on the unique index.
  const { data: twin } = await supabase.from("lessons").select("id, title").eq("youtube_id", youtubeId).neq("id", v.id ?? "00000000-0000-0000-0000-000000000000").maybeSingle();
  if (twin) return { fieldErrors: { youtube_url: `This video is already in the library as “${twin.title}”. Edit that lesson instead.` } };
  const duration = parseDuration(v.duration);
  if (Number.isNaN(duration)) return { fieldErrors: { duration: "Use minutes:seconds, e.g. 12:05, or leave it empty." } };
  const slug = (v.slug ? slugify(v.slug) : slugify(v.title)) || youtubeId.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (v.status === "published" && !session.canPublish) return { error: "Your role can save drafts but not publish. Ask a founder to publish this lesson." };

  if (v.is_featured) {
    // Only one featured lesson: clear the previous one first (guarded by a unique index too).
    let clear = supabase.from("lessons").update({ is_featured: false }).eq("is_featured", true);
    if (v.id) clear = clear.neq("id", v.id);
    const { error } = await clear;
    if (error) return { error: `Could not change the featured lesson: ${error.message}` };
  }

  const row: Record<string, unknown> = {
    slug, youtube_id: youtubeId, title: v.title, description: v.description || null, category_id: v.category_id,
    language_code: v.language_code, duration_seconds: duration, display_order: v.display_order, status: v.status, is_featured: v.is_featured,
  };
  if (tracked && current) {
    // Changed field → locked (the sync stops writing it). Unchanged and "keep in sync" ticked → unlocked;
    // a field unlocked again takes YouTube's current value right away.
    const fromYouTube: Record<EditorialField, unknown> = {
      title: current.youtube_title ? String(current.youtube_title).replace(/\s+/g, " ").trim().slice(0, 160) : undefined,
      description: current.youtube_description != null ? (String(current.youtube_description).trim().slice(0, 4000) || null) : undefined,
      duration_seconds: current.youtube_duration_seconds && current.youtube_duration_seconds <= 86400 ? current.youtube_duration_seconds : undefined,
      category_id: undefined, // the next sync applies the playlist category
    };
    const wasLocked = new Set<string>(current.locked_fields ?? []);
    const locked: EditorialField[] = [];
    for (const f of EDITORIAL_FIELDS) {
      const changed = (row[f] ?? null) !== (current[f] ?? null);
      const keepSynced = form.get(`sync_${f}`) === "on";
      if (changed || !keepSynced) locked.push(f);
      else if (wasLocked.has(f) && fromYouTube[f] !== undefined) row[f] = fromYouTube[f];
    }
    row.locked_fields = locked;
  }
  const { error } = v.id
    ? await supabase.from("lessons").update(row).eq("id", v.id).select("id").single()
    : await supabase.from("lessons").insert({ ...row, created_by: session.userId }).select("id").single();
  if (error) {
    if (error.code === "23505" && /youtube_id/.test(`${error.message} ${error.details ?? ""}`)) return { fieldErrors: { youtube_url: "This video is already in the library." } };
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
  // Deleting a video the sync imports would only bring it back next hour: remember it as ignored.
  const { data: lesson } = await supabase.from("lessons").select("youtube_id, title, source, youtube_availability").eq("id", id.data).maybeSingle();
  if (lesson && (lesson.source === "youtube" || lesson.youtube_availability !== null)) {
    const { error: ignoreError } = await supabase.from("youtube_ignored_videos").upsert({ youtube_id: lesson.youtube_id, title: lesson.title });
    if (ignoreError) redirect("/admin/lessons?error=forbidden");
  }
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

/* ---------- YouTube channel sync ---------- */

/** Runs the sync now (publishers only). The run is logged like a scheduled one. */
export async function syncYouTubeNow() {
  const session = await getTeamSession();
  if (!session?.canPublish) redirect("/admin/lessons?error=forbidden");
  const r = await runYouTubeSync("admin");
  revalidateLearn();
  redirect(`/admin/lessons?sync=${r.status}&syncmsg=${encodeURIComponent(r.message.slice(0, 300))}`);
}

const settingsSchema = z.object({
  enabled: z.boolean(),
  auto_publish: z.boolean(),
  default_category_id: z.string().uuid(),
  default_language: z.string().trim().refine(isLanguageTag),
});

export async function saveYouTubeSettings(form: FormData) {
  const session = await getTeamSession();
  if (!session?.canPublish) redirect("/admin/lessons/youtube?error=forbidden");
  const v = settingsSchema.safeParse({
    enabled: form.get("enabled") === "on", auto_publish: form.get("auto_publish") === "on",
    default_category_id: form.get("default_category_id"), default_language: form.get("default_language"),
  });
  if (!v.success) redirect("/admin/lessons/youtube?error=invalid");
  const supabase = (await createSupabaseServerClient())!;
  const { data, error } = await supabase.from("youtube_sync_settings").update(v.data).eq("id", true).select("id");
  if (error || !data?.length) redirect("/admin/lessons/youtube?error=forbidden");
  redirect("/admin/lessons/youtube?saved=settings");
}

/** Replaces the playlist → category mapping with the submitted rows (empty category = not mapped). */
export async function savePlaylistMapping(form: FormData) {
  const session = await getTeamSession();
  if (!session?.canPublish) redirect("/admin/lessons/youtube?error=forbidden");
  const count = Math.min(Number(form.get("count")) || 0, 200);
  const rows: { playlist_id: string; playlist_title: string | null; category_id: string; priority: number }[] = [];
  for (let i = 0; i < count; i++) {
    const playlist = String(form.get(`p_${i}_id`) ?? "").trim();
    const category = String(form.get(`p_${i}_category`) ?? "");
    if (!playlist || !category) continue;
    if (!/^[A-Za-z0-9_-]{10,64}$/.test(playlist) || !z.string().uuid().safeParse(category).success) redirect("/admin/lessons/youtube?error=playlist");
    rows.push({ playlist_id: playlist, playlist_title: String(form.get(`p_${i}_title`) ?? "").slice(0, 300) || null, category_id: category, priority: Number(form.get(`p_${i}_priority`)) || 0 });
  }
  const supabase = (await createSupabaseServerClient())!;
  const { error: delError } = await supabase.from("youtube_playlist_categories").delete().neq("playlist_id", "");
  if (delError) redirect("/admin/lessons/youtube?error=forbidden");
  if (rows.length) {
    const { error } = await supabase.from("youtube_playlist_categories").insert(rows);
    if (error) redirect("/admin/lessons/youtube?error=forbidden");
  }
  redirect("/admin/lessons/youtube?saved=playlists");
}

/** Lets the sync import a previously deleted video again. */
export async function allowReimport(form: FormData) {
  const session = await getTeamSession();
  const id = z.string().regex(/^[A-Za-z0-9_-]{11}$/).safeParse(form.get("youtube_id"));
  if (!session?.canPublish || !id.success) redirect("/admin/lessons/youtube?error=forbidden");
  const supabase = (await createSupabaseServerClient())!;
  await supabase.from("youtube_ignored_videos").delete().eq("youtube_id", id.data);
  redirect("/admin/lessons/youtube?saved=reimport");
}
