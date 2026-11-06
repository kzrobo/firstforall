import Link from "next/link";
import type { SyncOverview, SyncRun } from "@/lib/youtube/overview";
import { syncYouTubeNow } from "./actions";

export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (s < 90) return "just now";
  const m = Math.round(s / 60);
  if (m < 90) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 36 ? `${h} h ago` : `${Math.round(h / 24)} days ago`;
}

export function RunStatus({ run }: { run: SyncRun }) {
  const tone = run.status === "ok" ? "bg-navy" : run.status === "error" ? "bg-red-700" : "border border-ink-muted";
  const label = { ok: "Succeeded", error: "Failed", skipped: "Skipped", running: "Running" }[run.status] ?? run.status;
  return <span className="inline-flex items-center gap-2"><span aria-hidden className={`size-2 rounded-full ${tone}`} />{label}</span>;
}

/** Channel status on /admin/lessons: configuration, last run, sync now. */
export function YouTubeSyncPanel({ overview, canPublish }: { overview: SyncOverview; canPublish: boolean }) {
  const { config, settings, runs } = overview;
  const last = runs[0];
  const lastOk = runs.find((r) => r.status === "ok");
  const ready = config.apiKey && config.serviceKey;
  return (
    <section aria-labelledby="yt-panel" className="mt-6 grid gap-x-8 gap-y-4 rounded-md border border-line p-5 lg:grid-cols-12 lg:items-center">
      <div className="lg:col-span-5">
        <h2 id="yt-panel" className="t-label text-ink">Automatic import from YouTube</h2>
        <p className="mt-1 text-[14px] text-ink-muted">
          FTC Builder Academy channel{settings ? <> · <code className="text-[13px]">{settings.channel_id}</code></> : null}
          {settings && !settings.enabled ? " · switched off" : settings ? (settings.auto_publish ? " · new videos publish automatically" : " · new videos arrive as drafts") : null}
        </p>
      </div>
      <div className="text-[14px] lg:col-span-4">
        {!overview.migrated ? (
          <p className="text-red-700">Database migration 20261107000000_youtube_sync has not been applied.</p>
        ) : !ready ? (
          <p className="text-ink">
            Not active yet: {[!config.apiKey && "YOUTUBE_API_KEY", !config.serviceKey && "SUPABASE_SERVICE_ROLE_KEY"].filter(Boolean).join(" and ")} missing on the server.
          </p>
        ) : last ? (
          <p>
            <RunStatus run={last} /> <span className="text-ink-muted">· {timeAgo(last.started_at)}</span>
            <span className="mt-0.5 block text-[13px] text-ink-muted">
              {last.status === "ok" ? `${last.found} videos checked · ${last.inserted} new · ${last.updated} updated` : last.message}
              {last.status !== "ok" && lastOk ? ` Last success ${timeAgo(lastOk.started_at)}.` : ""}
            </span>
          </p>
        ) : (
          <p className="text-ink-muted">No sync has run yet.</p>
        )}
        {overview.migrated && !config.cronSecret && <p className="mt-1 text-[13px] text-ink-muted">Schedule inactive: CRON_SECRET is not set.</p>}
      </div>
      <div className="flex flex-wrap items-center gap-4 lg:col-span-3 lg:justify-end">
        <Link href="/admin/lessons/youtube" className="link-rule text-[14px] text-tech">Settings &amp; playlists</Link>
        {canPublish && overview.migrated && (
          <form action={syncYouTubeNow}>
            <button className="btn-secondary min-h-10 px-4 text-[14px]">Sync now</button>
          </form>
        )}
      </div>
    </section>
  );
}
