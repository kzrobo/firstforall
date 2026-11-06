"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getTeamSession } from "@/lib/auth/session";
import { CATEGORY_FIELDS, CATEGORY_SECTIONS, HUB_CATEGORIES, PROJECT_STAGES, type HubCategory } from "@/lib/hub/categories";
import { isCountryCode } from "@/lib/hub/countries";
import { MAX_IMAGES_PER_SAVE, checkImage, parseList, parseMilestones, storagePathFor } from "@/lib/hub/uploads";
import { parseYouTubeUrl, slugify } from "@/lib/learn/youtube";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface HubFormState { error?: string; fieldErrors?: Partial<Record<string, string>> }

const opt = (max: number) => z.string().trim().max(max).transform((v) => v || null);

const base = z.object({
  id: z.string().uuid().optional(),
  category: z.enum(HUB_CATEGORIES),
  title: z.string().trim().min(2, "Enter a title (at least 2 characters).").max(160),
  slug: z.string().trim().max(80),
  subtitle: opt(240),
  summary: opt(800),
  stage: z.enum(PROJECT_STAGES).or(z.literal("")).transform((v) => v || null),
  event_date: z.string().trim().refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), "Use a full date.").transform((v) => v || null),
  season: opt(40),
  country_code: z.string().trim().toUpperCase().refine((v) => !v || isCountryCode(v), "Choose a country from the list.").transform((v) => v || null),
  city: opt(80),
  latitude: z.string().trim().refine((v) => !v || (Number(v) >= -90 && Number(v) <= 90), "Latitude must be between -90 and 90.").transform((v) => (v ? Number(v) : null)),
  longitude: z.string().trim().refine((v) => !v || (Number(v) >= -180 && Number(v) <= 180), "Longitude must be between -180 and 180.").transform((v) => (v ? Number(v) : null)),
  team_name: opt(120),
  team_number: z.string().trim().refine((v) => !v || /^\d{1,6}$/.test(v), "FTC numbers are digits only.").transform((v) => (v ? Number(v) : null)),
  video_url: z.string().trim().max(500),
  collaborators: z.string().max(4000),
  milestones: z.string().max(8000),
  display_order: z.coerce.number().int().min(-9999).max(9999),
  status: z.enum(["draft", "published", "archived"]),
  is_featured: z.boolean(),
});

function revalidateHub(category: HubCategory, slug?: string) {
  revalidatePath("/");
  revalidatePath("/mavericks");
  revalidatePath(`/mavericks/${category}`);
  if (slug) revalidatePath(`/mavericks/${category}/${slug}`);
  revalidatePath("/admin/hub");
}

async function upload(supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>, file: File, folder: string) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = checkImage(file.name, file.size, bytes.subarray(0, 16));
  if (!check.ok) return { error: check.error };
  const path = storagePathFor(folder, randomUUID(), check.type);
  // Uploads run as the signed-in member: storage policies decide, not this code.
  const { error } = await supabase.storage.from("public-media").upload(path, bytes, { contentType: check.type, upsert: false });
  return error ? { error: `${file.name}: upload refused (${error.message}).` } : { path };
}

const files = (form: FormData, key: string) => form.getAll(key).filter((f): f is File => f instanceof File && f.size > 0);

export async function saveHubEntry(_prev: HubFormState, form: FormData): Promise<HubFormState> {
  const session = await getTeamSession();
  if (!session) return { error: "Your session has expired. Sign in again." };
  const get = (k: string) => (form.get(k) as string | null) ?? "";
  const parsed = base.safeParse({
    id: get("id") || undefined, category: get("category"), title: get("title"), slug: get("slug"), subtitle: get("subtitle"), summary: get("summary"),
    stage: get("stage"), event_date: get("event_date"), season: get("season"), country_code: get("country_code"), city: get("city"),
    latitude: get("latitude"), longitude: get("longitude"), team_name: get("team_name"), team_number: get("team_number"),
    video_url: get("video_url"), collaborators: get("collaborators"), milestones: get("milestones"),
    display_order: get("display_order") || 0, status: get("status") || "draft", is_featured: form.get("is_featured") === "on",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { fieldErrors };
  }
  const v = parsed.data;
  const fields = CATEGORY_FIELDS[v.category];
  if ((v.latitude == null) !== (v.longitude == null)) return { fieldErrors: { latitude: "Enter both latitude and longitude, or neither." } };
  if (v.latitude != null && !v.city) return { fieldErrors: { city: "Exact coordinates need a verified city. Otherwise leave them empty: the team is shown at country level." } };
  const videoId = v.video_url ? parseYouTubeUrl(v.video_url) : null;
  if (v.video_url && !videoId) return { fieldErrors: { video_url: "Use a YouTube video link (watch, youtu.be or Shorts)." } };
  if (v.status === "published" && !session.canPublish) return { error: "Your role can save drafts but not publish. Ask a founder to publish this entry." };

  const sections: Record<string, string> = {};
  for (const key of CATEGORY_SECTIONS[v.category]) {
    const text = get(`section_${key}`).trim().slice(0, 4000);
    if (text) sections[key] = text;
  }

  // Existing media: keep, edit alt/caption/kind, or remove.
  type Kind = "photo" | "screenshot" | "graphic";
  const asKind = (v: string): Kind => (v === "screenshot" || v === "graphic" ? v : "photo");
  // Each kept image may get a new position (the carousel order) and a replacement file.
  const kept: { path: string; alt: string; caption?: string; kind: Kind }[] = [];
  const existing: { item: (typeof kept)[number]; order: number; replace?: File }[] = [];
  const count = Number(get("media_count")) || 0;
  for (let i = 0; i < Math.min(count, 60); i++) {
    const path = get(`media_${i}_path`);
    if (!path.startsWith("hub/") || form.get(`media_${i}_remove`) === "on") continue;
    const alt = get(`media_${i}_alt`).trim().slice(0, 300);
    if (!alt) return { fieldErrors: { media: "Every image needs a short description (alt text)." } };
    const order = Number(get(`media_${i}_order`));
    existing.push({
      item: { path, alt, caption: get(`media_${i}_caption`).trim().slice(0, 300) || undefined, kind: asKind(get(`media_${i}_kind`)) },
      order: Number.isFinite(order) && order > 0 ? order : i + 1,
      replace: files(form, `media_${i}_replace`)[0],
    });
  }
  existing.sort((a, b) => a.order - b.order); // stable: equal positions keep their previous order

  const newMedia = files(form, "new_media");
  const logo = files(form, "logo")[0];
  const cover = files(form, "cover")[0];
  const replacements = existing.filter((x) => x.replace).length;
  if (newMedia.length + replacements + (logo ? 1 : 0) + (cover ? 1 : 0) > MAX_IMAGES_PER_SAVE) return { fieldErrors: { media: `Upload at most ${MAX_IMAGES_PER_SAVE} images per save.` } };
  const newAlt = get("new_media_alt").trim().slice(0, 300);
  if (newMedia.length && !newAlt) return { fieldErrors: { media: "Describe the new images (alt text) before uploading." } };

  const supabase = (await createSupabaseServerClient())!;
  const folder = v.category;
  let logoPath = get("logo_path") || null;
  let coverPath = get("cover_path") || null;
  if (form.get("remove_logo") === "on") logoPath = null;
  if (form.get("remove_cover") === "on") coverPath = null;
  for (const [file, set] of [[logo, (p: string) => (logoPath = p)], [cover, (p: string) => (coverPath = p)]] as const) {
    if (!file) continue;
    const r = await upload(supabase, file, folder);
    if ("error" in r) return { fieldErrors: { media: r.error } };
    set(r.path!);
  }
  for (const x of existing) {
    if (x.replace) {
      const r = await upload(supabase, x.replace, folder);
      if ("error" in r) return { fieldErrors: { media: r.error } };
      if (coverPath === x.item.path) coverPath = r.path!; // a replaced cover image stays the cover
      x.item.path = r.path!;
    }
    kept.push(x.item);
  }
  for (const f of newMedia) {
    const r = await upload(supabase, f, folder);
    if ("error" in r) return { fieldErrors: { media: r.error } };
    kept.push({ path: r.path!, alt: newAlt, kind: asKind(get("new_media_kind")) });
  }

  if (v.is_featured) {
    let clear = supabase.from("hub_entries").update({ is_featured: false }).eq("category", v.category).eq("is_featured", true);
    if (v.id) clear = clear.neq("id", v.id);
    await clear;
  }

  const slug = (v.slug ? slugify(v.slug) : slugify(v.title)) || randomUUID().slice(0, 8);
  const related = form.getAll("related_ids").map(String).filter((x) => z.string().uuid().safeParse(x).success && x !== v.id).slice(0, 12);
  const row = {
    category: v.category, slug, title: v.title, subtitle: v.subtitle, summary: v.summary, sections,
    stage: fields.stage ? v.stage : null,
    event_date: fields.date ? v.event_date : null,
    season: fields.season ? v.season : null,
    country_code: fields.location ? v.country_code : null,
    city: fields.location ? v.city : null,
    latitude: fields.location ? v.latitude : null,
    longitude: fields.location ? v.longitude : null,
    team_name: fields.team ? v.team_name : null,
    team_number: fields.team ? v.team_number : null,
    logo_path: fields.team ? logoPath : null,
    cover_path: coverPath, media: kept, milestones: parseMilestones(v.milestones), video_youtube_id: videoId,
    collaborators: parseList(v.collaborators), related_ids: related,
    is_featured: v.is_featured, display_order: v.display_order, status: v.status,
  };
  const { error } = v.id
    ? await supabase.from("hub_entries").update(row).eq("id", v.id).select("id").single()
    : await supabase.from("hub_entries").insert({ ...row, created_by: session.userId }).select("id").single();
  if (error) {
    if (error.code === "23505") return { fieldErrors: { slug: "Another entry in this category already uses this address." } };
    if (error.code === "42501" || error.code === "PGRST116") return { error: "The database refused this change for your role." };
    return { error: `Could not save: ${error.message}` };
  }
  revalidateHub(v.category, slug);
  redirect(`/admin/hub?category=${v.category}&saved=${encodeURIComponent(v.title)}`);
}

export async function setHubStatus(form: FormData) {
  const session = await getTeamSession();
  const id = z.string().uuid().safeParse(form.get("id"));
  const status = z.enum(["draft", "published", "archived"]).safeParse(form.get("status"));
  if (!session || !id.success || !status.success) redirect("/admin/hub?error=invalid");
  if (!session.canPublish) redirect("/admin/hub?error=forbidden");
  const supabase = (await createSupabaseServerClient())!;
  const { data, error } = await supabase.from("hub_entries").update({ status: status.data }).eq("id", id.data).select("category, slug");
  if (error || !data?.length) redirect("/admin/hub?error=forbidden");
  revalidateHub(data[0].category as HubCategory, data[0].slug);
  redirect(`/admin/hub?category=${data[0].category}&status=${status.data}`);
}

export async function deleteHubEntry(form: FormData) {
  const session = await getTeamSession();
  const id = z.string().uuid().safeParse(form.get("id"));
  if (!session || !id.success || form.get("confirm") !== "delete") redirect("/admin/hub?error=invalid");
  if (!session.canPublish) redirect("/admin/hub?error=forbidden");
  const supabase = (await createSupabaseServerClient())!;
  const { data, error } = await supabase.from("hub_entries").delete().eq("id", id.data).select("category, slug");
  if (error || !data?.length) redirect("/admin/hub?error=forbidden");
  revalidateHub(data[0].category as HubCategory, data[0].slug);
  redirect(`/admin/hub?category=${data[0].category}&deleted=1`);
}
