import Link from "next/link";
import { getTeamSession } from "@/lib/auth/session";
import { listCategories } from "@/lib/learn/repository";
import { createYouTubeClient } from "@/lib/youtube/api";
import { getSyncOverview } from "@/lib/youtube/overview";
import { RunStatus, timeAgo } from "../YouTubeSyncPanel";
import { allowReimport, savePlaylistMapping, saveYouTubeSettings, syncYouTubeNow } from "../actions";

export const metadata = { title: "YouTube import · Admin" };

type Props = { searchParams: Promise<Record<string, string | undefined>> };

const SAVED: Record<string, string> = { settings: "Settings saved.", playlists: "Playlist categories saved. The next sync applies them.", reimport: "The video will be imported again on the next sync." };
const ERRORS: Record<string, string> = { forbidden: "That change was refused for your role.", invalid: "Some settings were invalid. Nothing was changed.", playlist: "A playlist ID was not valid. Nothing was changed." };
const LANGS = [{ code: "en", label: "English" }, { code: "kk", label: "Kazakh" }, { code: "ru", label: "Russian" }, { code: "es", label: "Spanish" }];

export default async function YouTubeSettingsPage({ searchParams }: Props) {
  const [sp, session, overview, cats] = await Promise.all([searchParams, getTeamSession(), getSyncOverview(15), listCategories("en")]);
  const categories = cats.ok ? cats.data : [];
  const canPublish = Boolean(session?.canPublish);
  const { config, settings } = overview;

  // Channel playlists for the mapping table: one quota unit, read live so new playlists appear here.
  let playlists: { id: string; title: string; itemCount: number | null }[] = [];
  let playlistError: string | null = null;
  if (config.apiKey && settings) {
    try { playlists = await createYouTubeClient(process.env.YOUTUBE_API_KEY!, { timeoutMs: 6000 }).channelPlaylists(settings.channel_id); }
    catch { playlistError = "Could not load the channel's playlists from YouTube right now. Saved mappings are listed below."; }
  }
  const mapped = new Map(overview.mappings.map((m) => [m.playlist_id, m]));
  const rows = [
    ...playlists.map((p) => ({ id: p.id, title: p.title, count: p.itemCount, map: mapped.get(p.id) })),
    ...overview.mappings.filter((m) => !playlists.some((p) => p.id === m.playlist_id)).map((m) => ({ id: m.playlist_id, title: m.playlist_title ?? m.playlist_id, count: null, map: m })),
  ];
  const input = "mt-1.5 block h-11 w-full rounded-md border border-line-strong bg-canvas px-3 text-[15px] focus:border-rule focus:outline-none disabled:opacity-60";
  const check = (ok: boolean, name: string, hint: string) => (
    <li className="flex items-start gap-3 border-b border-line py-3">
      <span aria-hidden className={`mt-1.5 size-2 shrink-0 rounded-full ${ok ? "bg-navy" : "border border-red-700"}`} />
      <span><span className="font-medium text-ink">{name}</span> <span className={ok ? "text-ink-muted" : "text-red-700"}>{ok ? "configured" : "missing"}</span><span className="block text-[13px] text-ink-muted">{hint}</span></span>
    </li>
  );

  return (
    <div>
      <Link href="/admin/lessons" className="text-[14px] text-ink-muted hover:text-ink">← Lessons</Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-4">
        <div>
          <h1 className="t-h2 text-ink">YouTube import</h1>
          <p className="mt-2 max-w-2xl text-[14px] text-ink-muted">New public videos on the FTC Builder Academy channel are added to /learn automatically. Your edits to a lesson are never overwritten by the import.</p>
        </div>
        {canPublish && overview.migrated && <form action={syncYouTubeNow}><button className="btn-primary">Sync now</button></form>}
      </div>
      {sp.saved && <p role="status" className="mt-6 border-l-2 border-accent bg-accent-pale/50 px-4 py-3 text-[14px]">{SAVED[sp.saved] ?? "Saved."}</p>}
      {sp.error && <p role="alert" className="mt-6 border-l-2 border-red-700 bg-canvas px-4 py-3 text-[14px] text-red-700">{ERRORS[sp.error] ?? ERRORS.invalid}</p>}
      {!overview.migrated && <p role="alert" className="mt-6 border-l-2 border-red-700 bg-canvas px-4 py-3 text-[14px] text-red-700">Apply the database migration supabase/migrations/20261107000000_youtube_sync.sql first.</p>}

      <div className="mt-8 grid gap-x-12 gap-y-12 lg:grid-cols-12">
        <section aria-labelledby="setup" className="lg:col-span-5">
          <h2 id="setup" className="t-h3 text-ink">Server setup</h2>
          <ul className="mt-3 border-t border-rule text-[14px]">
            {check(config.apiKey, "YOUTUBE_API_KEY", "YouTube Data API v3 key. Server-only environment variable; never shown here.")}
            {check(config.serviceKey, "SUPABASE_SERVICE_ROLE_KEY", "Lets the scheduled job write lessons without a signed-in user.")}
            {check(config.cronSecret, "CRON_SECRET", "Shared secret the scheduler sends to /api/cron/youtube-sync.")}
          </ul>
          <p className="mt-3 text-[13px] text-ink-muted">Step-by-step setup: docs/YOUTUBE_SYNC.md in the repository.</p>

          <h2 className="t-h3 mt-12 text-ink">Import settings</h2>
          {settings ? (
            <form action={saveYouTubeSettings} className="mt-4 space-y-5 border-t border-rule pt-5">
              <p className="text-[14px]">Channel <code className="text-[13px]">{settings.channel_id}</code></p>
              <label className="flex items-start gap-3 text-[15px]">
                <input type="checkbox" name="enabled" defaultChecked={settings.enabled} disabled={!canPublish} className="mt-1 accent-tech" />
                <span>Import automatically <span className="block text-[13px] text-ink-muted">Off: scheduled runs do nothing until switched on again.</span></span>
              </label>
              <label className="flex items-start gap-3 text-[15px]">
                <input type="checkbox" name="auto_publish" defaultChecked={settings.auto_publish} disabled={!canPublish} className="mt-1 accent-tech" />
                <span>Publish new videos right away <span className="block text-[13px] text-ink-muted">Off: new videos arrive as drafts for review.</span></span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block text-[14px] font-medium text-ink">Category for unmapped videos
                  <select name="default_category_id" defaultValue={settings.default_category_id ?? categories[0]?.id} disabled={!canPublish} className={input}>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
                <label className="block text-[14px] font-medium text-ink">Spoken language if YouTube has none
                  <select name="default_language" defaultValue={settings.default_language} disabled={!canPublish} className={input}>
                    {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                  </select>
                </label>
              </div>
              {canPublish && <button className="btn-primary">Save settings</button>}
            </form>
          ) : null}
        </section>

        <section aria-labelledby="playlists" className="lg:col-span-7">
          <h2 id="playlists" className="t-h3 text-ink">Playlists → lesson categories</h2>
          <p className="mt-2 text-[14px] text-ink-muted">Videos in a mapped playlist go to its category. In several mapped playlists, the lowest priority number wins. Videos in no mapped playlist use the default category. A category you change by hand on a lesson is kept.</p>
          {playlistError && <p className="mt-3 text-[13px] text-red-700">{playlistError}</p>}
          {!config.apiKey && <p className="mt-3 text-[13px] text-ink-muted">The channel&apos;s playlists are listed here once YOUTUBE_API_KEY is configured. Until then you can map a playlist by its ID.</p>}
          <form action={savePlaylistMapping} className="mt-4">
            <input type="hidden" name="count" value={rows.length + 1} />
            <table className="w-full text-left text-[14px]">
              <thead className="border-b border-rule text-[13px] text-ink-muted"><tr><th className="py-2 pr-3 font-medium">Playlist</th><th className="pr-3 font-medium">Category</th><th className="w-20 font-medium">Priority</th></tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} className="border-b border-line">
                    <td className="py-3 pr-3">
                      <input type="hidden" name={`p_${i}_id`} value={r.id} /><input type="hidden" name={`p_${i}_title`} value={r.title} />
                      <span className="font-medium text-ink">{r.title}</span>
                      <span className="block text-[13px] text-ink-muted">{r.id}{r.count != null ? ` · ${r.count} videos` : ""}</span>
                    </td>
                    <td className="pr-3">
                      <select name={`p_${i}_category`} defaultValue={r.map?.category_id ?? ""} disabled={!canPublish} aria-label={`Category for ${r.title}`} className="h-10 w-full rounded-md border border-line-strong bg-canvas px-2">
                        <option value="">Not mapped</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </td>
                    <td><input type="number" name={`p_${i}_priority`} defaultValue={r.map?.priority ?? 0} disabled={!canPublish} aria-label={`Priority for ${r.title}`} className="h-10 w-20 rounded-md border border-line-strong bg-canvas px-2" /></td>
                  </tr>
                ))}
                {canPublish && (
                  <tr className="border-b border-line">
                    <td className="py-3 pr-3"><input name={`p_${rows.length}_id`} placeholder="Add by playlist ID (PL…)" aria-label="Playlist ID" className="h-10 w-full rounded-md border border-line-strong bg-canvas px-2" /></td>
                    <td className="pr-3">
                      <select name={`p_${rows.length}_category`} defaultValue="" aria-label="Category for the new playlist" className="h-10 w-full rounded-md border border-line-strong bg-canvas px-2">
                        <option value="">Choose…</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </td>
                    <td><input type="number" name={`p_${rows.length}_priority`} defaultValue={0} aria-label="Priority for the new playlist" className="h-10 w-20 rounded-md border border-line-strong bg-canvas px-2" /></td>
                  </tr>
                )}
              </tbody>
            </table>
            {canPublish && <button className="btn-secondary mt-5">Save playlist categories</button>}
          </form>

          <h2 className="t-h3 mt-12 text-ink">Recent runs</h2>
          {overview.runs.length === 0 ? <p className="mt-3 text-[14px] text-ink-muted">No runs yet.</p> : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-[14px]">
                <thead className="border-b border-rule text-[13px] text-ink-muted"><tr><th className="py-2 pr-3 font-medium">When</th><th className="pr-3 font-medium">Result</th><th className="pr-3 font-medium">New / updated</th><th className="font-medium">Details</th></tr></thead>
                <tbody>
                  {overview.runs.map((r) => (
                    <tr key={r.id} className="border-b border-line align-top">
                      <td className="whitespace-nowrap py-3 pr-3">{timeAgo(r.started_at)}<span className="block text-[13px] text-ink-muted">{{ schedule: "Scheduled", admin: "Sync now", cli: "Command line" }[r.trigger] ?? r.trigger}</span></td>
                      <td className="whitespace-nowrap py-3 pr-3"><RunStatus run={r} /></td>
                      <td className="t-num py-3 pr-3">{r.inserted} / {r.updated}<span className="block text-[13px] text-ink-muted">{r.quota_units} quota units</span></td>
                      <td className="py-3 text-[13px] text-ink-muted">{r.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {overview.ignored.length > 0 && (
            <>
              <h2 className="t-h3 mt-12 text-ink">Deleted videos — not imported again</h2>
              <ul className="mt-3 border-t border-rule text-[14px]">
                {overview.ignored.map((v) => (
                  <li key={v.youtube_id} className="flex items-center justify-between gap-4 border-b border-line py-3">
                    <span>{v.title ?? v.youtube_id}<span className="block text-[13px] text-ink-muted">{v.youtube_id}</span></span>
                    {canPublish && <form action={allowReimport}><input type="hidden" name="youtube_id" value={v.youtube_id} /><button className="link-rule text-[14px] text-tech">Allow import again</button></form>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
