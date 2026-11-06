/**
 * Pure planning for the YouTube → LEARN sync. No network or database access here, so every rule
 * (what is importable, which fields may change, how duplicates are avoided) is unit-tested.
 *
 * Rules
 * - One lesson per YouTube video id (the database enforces it too).
 * - Only public, processed, embeddable, non-live videos from our own channel are imported.
 * - YouTube's values always refresh the youtube_* columns. An editorial column (title, description,
 *   category, duration) is written only while it is not in locked_fields; admin edits lock it.
 * - Status, featured flag, order and spoken language are set once at import and never changed.
 * - A lesson that already existed for a channel video (added by hand) is adopted: its editorial
 *   fields are all locked, so nothing visible changes.
 * - A video that disappears or stops being public is marked unavailable (hidden publicly), never deleted.
 * - Running the same plan twice produces no changes the second time (idempotent).
 */

export const EDITORIAL_FIELDS = ["title", "description", "category_id", "duration_seconds"] as const;
export type EditorialField = (typeof EDITORIAL_FIELDS)[number];

export interface VideoInfo {
  id: string;
  channelId: string;
  title: string;
  description: string;
  publishedAt: string | null;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
  privacyStatus: string;
  uploadStatus: string;
  embeddable: boolean;
  liveBroadcastContent: string;
  defaultAudioLanguage: string | null;
}

export interface ExistingLesson {
  id: string;
  slug: string;
  youtube_id: string;
  source: "manual" | "youtube";
  locked_fields: string[];
  title: string;
  description: string | null;
  category_id: string;
  duration_seconds: number | null;
  youtube_title: string | null;
  youtube_description: string | null;
  youtube_published_at: string | null;
  youtube_duration_seconds: number | null;
  thumbnail_url: string | null;
  youtube_playlist_ids: string[];
  youtube_availability: "available" | "unavailable" | null;
  youtube_unavailable_reason: string | null;
}

export interface SyncSettings {
  channelId: string;
  autoPublish: boolean;
  defaultCategoryId: string;
  defaultLanguage: string;
}

export interface PlaylistMapping { playlistId: string; categoryId: string; priority: number }

export interface PlanInput {
  settings: SyncSettings;
  mappings: PlaylistMapping[];
  /** video id → mapped playlists that contain it */
  membership: Map<string, string[]>;
  /** every id the run asked YouTube about; ids missing from `videos` no longer exist */
  requestedIds: string[];
  videos: VideoInfo[];
  existing: ExistingLesson[];
  ignoredIds: Set<string>;
  takenSlugs: Set<string>;
  now: string;
}

export type LessonInsert = Record<string, unknown> & { youtube_id: string; slug: string };
export interface LessonUpdate { id: string; youtube_id: string; patch: Record<string, unknown> }
export interface Plan {
  inserts: LessonInsert[];
  updates: LessonUpdate[];
  unchanged: number;
  skipped: { id: string; reason: string }[];
  unavailable: number;
}

const YT_ID = /^[A-Za-z0-9_-]{11}$/;

/** ISO 8601 duration ("PT1H2M3S", "P1DT2H") → seconds; 0 or unparsable → null. */
export function parseIsoDuration(value: string | null | undefined): number | null {
  if (!value) return null;
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(value);
  if (!m) return null;
  const s = Number(m[1] ?? 0) * 86400 + Number(m[2] ?? 0) * 3600 + Number(m[3] ?? 0) * 60 + Math.round(Number(m[4] ?? 0));
  return s > 0 ? s : null;
}

/** Lesson durations are 1 s – 24 h (database check); anything else is stored as unknown. */
export function lessonDuration(seconds: number | null): number | null {
  return seconds && seconds >= 1 && seconds <= 86400 ? seconds : null;
}

type Thumbs = Partial<Record<"maxres" | "standard" | "high" | "medium" | "default", { url?: string }>>;

/** Best thumbnail from the API, accepted only from YouTube's image CDN (or an allowed test origin). */
export function pickThumbnail(thumbs: Thumbs | undefined, allowedTestOrigin?: string | null): string | null {
  for (const k of ["maxres", "standard", "high", "medium", "default"] as const) {
    const url = thumbs?.[k]?.url;
    if (url && isAllowedThumbnail(url, allowedTestOrigin)) return url;
  }
  return null;
}

export function isAllowedThumbnail(url: string, allowedTestOrigin?: string | null): boolean {
  if (/^https:\/\/i[0-9]?\.ytimg\.com\/[A-Za-z0-9_\-./]+$/.test(url)) return true;
  return Boolean(allowedTestOrigin && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(allowedTestOrigin) && url.startsWith(`${allowedTestOrigin}/`));
}

/** Why a video cannot be shown, or null when it can. */
export function unavailableReason(v: VideoInfo | undefined, channelId: string): string | null {
  if (!v) return "removed";
  if (v.channelId !== channelId) return "other_channel";
  if (v.privacyStatus !== "public") return v.privacyStatus === "unlisted" ? "unlisted" : "private";
  if (v.uploadStatus !== "processed") return "processing";
  if (v.liveBroadcastContent !== "none") return "live_or_upcoming";
  if (!v.embeddable) return "not_embeddable";
  return null;
}

/** "en-US" → "en"; anything that is not a language tag → null. */
export function normalizeLanguage(tag: string | null | undefined): string | null {
  if (!tag) return null;
  const primary = tag.trim().toLowerCase().split(/[-_]/)[0];
  return /^[a-z]{2,3}$/.test(primary) && primary !== "zxx" && primary !== "und" ? primary : null;
}

export function lessonTitle(title: string, id: string): string {
  const t = title.replace(/\s+/g, " ").trim();
  return t.length >= 2 ? t.slice(0, 160) : `Video ${id}`;
}

export function lessonDescription(description: string): string | null {
  const d = description.replace(/\r\n/g, "\n").trim();
  return d ? d.slice(0, 4000) : null;
}

const CYRILLIC: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", ғ: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z", и: "i", і: "i", й: "y", к: "k", қ: "q",
  л: "l", м: "m", н: "n", ң: "n", о: "o", ө: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ұ: "u", ү: "u", ф: "f", х: "h",
  һ: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya", ә: "a",
};

/** URL slug from a title in any of our languages (Kazakh/Russian transliterated). */
export function slugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[Ѐ-ӿ]/g, (c) => CYRILLIC[c] ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

function idSlug(id: string): string {
  return id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "video";
}

/** A slug no other lesson uses: title-based, then title + video id, then "video-<id>". */
export function uniqueSlug(title: string, id: string, taken: Set<string>): string {
  const base = slugFromTitle(title);
  const candidates = [base, base && `${base}-${idSlug(id)}`.slice(0, 80).replace(/-+$/g, ""), `video-${idSlug(id)}`].filter(Boolean) as string[];
  for (const c of candidates) if (!taken.has(c)) return c;
  let n = 2;
  while (taken.has(`video-${idSlug(id)}-${n}`)) n++;
  return `video-${idSlug(id)}-${n}`;
}

/** Category from mapped playlists (lowest priority wins), or null when no mapped playlist has the video. */
export function categoryFromPlaylists(videoId: string, membership: Map<string, string[]>, mappings: PlaylistMapping[]): string | null {
  const lists = membership.get(videoId) ?? [];
  const hit = mappings.filter((m) => lists.includes(m.playlistId)).sort((a, b) => a.priority - b.priority || a.playlistId.localeCompare(b.playlistId))[0];
  return hit?.categoryId ?? null;
}

const same = (a: unknown, b: unknown) => {
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => x === b[i]);
  if (typeof a === "string" && typeof b === "string" && !Number.isNaN(Date.parse(a)) && !Number.isNaN(Date.parse(b)) && /\d{4}-\d{2}-\d{2}T/.test(a) && /\d{4}-\d{2}-\d{2}T/.test(b)) {
    return Date.parse(a) === Date.parse(b);
  }
  return a === b;
};

export function planSync(input: PlanInput): Plan {
  const { settings, now } = input;
  const byId = new Map(input.videos.map((v) => [v.id, v]));
  const existingByYt = new Map(input.existing.map((r) => [r.youtube_id, r]));
  const taken = new Set(input.takenSlugs);
  const plan: Plan = { inserts: [], updates: [], unchanged: 0, skipped: [], unavailable: 0 };
  const ids = [...new Set([...input.requestedIds, ...input.existing.filter(isTracked).map((r) => r.youtube_id)])].filter((id) => YT_ID.test(id));

  for (const id of ids) {
    const v = byId.get(id);
    const reason = unavailableReason(v, settings.channelId);
    const row = existingByYt.get(id);
    const playlists = (input.membership.get(id) ?? []).slice().sort();
    const mappedCategory = categoryFromPlaylists(id, input.membership, input.mappings);

    if (!row) {
      if (reason) { plan.skipped.push({ id, reason }); continue; }
      if (input.ignoredIds.has(id)) { plan.skipped.push({ id, reason: "ignored" }); continue; }
      const title = lessonTitle(v!.title, id);
      const slug = uniqueSlug(title, id, taken);
      taken.add(slug);
      plan.inserts.push({
        slug,
        youtube_id: id,
        title,
        description: lessonDescription(v!.description),
        category_id: mappedCategory ?? settings.defaultCategoryId,
        language_code: normalizeLanguage(v!.defaultAudioLanguage) ?? settings.defaultLanguage,
        duration_seconds: lessonDuration(v!.durationSeconds),
        is_featured: false,
        display_order: 0,
        status: settings.autoPublish ? "published" : "draft",
        published_at: settings.autoPublish ? v!.publishedAt ?? now : null,
        source: "youtube",
        locked_fields: [],
        ...youtubeColumns(v!, playlists),
        youtube_availability: "available",
        youtube_unavailable_reason: null,
        youtube_synced_at: now,
      });
      continue;
    }

    // A lesson added by hand is adopted only when its video is a public video of our channel;
    // otherwise the sync leaves it exactly as it is.
    if (!isTracked(row) && reason) continue;

    const patch: Record<string, unknown> = {};
    const adopting = !isTracked(row);
    const locked = new Set(adopting ? [...EDITORIAL_FIELDS] : row.locked_fields);
    if (adopting) patch.locked_fields = [...EDITORIAL_FIELDS];

    if (v && reason !== "other_channel") {
      Object.assign(patch, youtubeColumns(v, playlists));
      const editorial: Partial<Record<EditorialField, unknown>> = {
        title: lessonTitle(v.title, id),
        description: lessonDescription(v.description),
        duration_seconds: lessonDuration(v.durationSeconds),
      };
      if (mappedCategory) editorial.category_id = mappedCategory; // no mapped playlist: keep the current category
      for (const [k, value] of Object.entries(editorial) as [EditorialField, unknown][]) if (!locked.has(k)) patch[k] = value;
    } else if (!v) {
      patch.youtube_playlist_ids = [];
    }
    patch.youtube_availability = reason ? "unavailable" : "available";
    patch.youtube_unavailable_reason = reason;
    if (reason) plan.unavailable++;

    const changed = Object.fromEntries(Object.entries(patch).filter(([k, val]) => !same((row as unknown as Record<string, unknown>)[k], val)));
    if (Object.keys(changed).length) plan.updates.push({ id: row.id, youtube_id: id, patch: { ...changed, youtube_synced_at: now } });
    else plan.unchanged++;
  }
  return plan;
}

function isTracked(r: ExistingLesson): boolean {
  return r.source === "youtube" || r.youtube_availability !== null;
}

function youtubeColumns(v: VideoInfo, playlists: string[]) {
  return {
    youtube_title: v.title.slice(0, 300),
    youtube_description: v.description.slice(0, 10000),
    youtube_published_at: v.publishedAt,
    youtube_duration_seconds: v.durationSeconds,
    thumbnail_url: v.thumbnailUrl,
    youtube_playlist_ids: playlists,
  };
}
