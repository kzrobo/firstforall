import Link from "next/link";
import { getTeamSession } from "@/lib/auth/session";
import { listAllLessonsForAdmin } from "@/lib/learn/repository";
import { formatDuration } from "@/lib/learn/youtube";
import { UNAVAILABLE_LABEL } from "@/lib/youtube/labels";
import { getSyncOverview } from "@/lib/youtube/overview";
import { YouTubeSyncPanel } from "./YouTubeSyncPanel";
import { DeleteLessonButton } from "./DeleteLessonButton";
import { deleteLesson, setLessonStatus } from "./actions";

export const metadata = { title: "Lessons · Admin" };

type Props = { searchParams: Promise<Record<string, string | undefined>> };

const MESSAGES: Record<string, string> = {
  forbidden: "That change was refused for your role.",
  invalid: "That request was incomplete. Nothing was changed.",
};

export default async function AdminLessonsPage({ searchParams }: Props) {
  const [sp, session, result, overview] = await Promise.all([searchParams, getTeamSession(), listAllLessonsForAdmin("en"), getSyncOverview(5)]);
  const syncNote = sp.sync ? `${sp.sync === "ok" ? "Sync finished" : sp.sync === "skipped" ? "Sync skipped" : "Sync failed"}: ${sp.syncmsg ?? ""}` : null;
  const notice = sp.saved ? `Saved “${sp.saved}”.` : sp.deleted ? "Lesson deleted. If it came from YouTube, it will not be imported again (see Settings & playlists to allow it)." : sp.status ? (sp.status === "published" ? "Lesson published." : "Lesson moved to drafts.") : sp.sync === "ok" || sp.sync === "skipped" ? syncNote : null;
  const error = sp.error ? MESSAGES[sp.error] ?? MESSAGES.invalid : sp.sync === "error" ? syncNote : null;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-4">
        <div>
          <h1 className="t-h2 text-ink">Lessons</h1>
          <p className="mt-2 text-[14px] text-ink-muted">YouTube lessons shown on /learn. New channel videos are imported automatically; add any other video by hand. Only published lessons are public.</p>
        </div>
        <Link href="/admin/lessons/new" className="btn-primary">Add lesson</Link>
      </div>

      <YouTubeSyncPanel overview={overview} canPublish={Boolean(session?.canPublish)} />

      {notice && <p role="status" className="mt-6 border-l-2 border-accent bg-accent-pale/50 px-4 py-3 text-[14px]">{notice}</p>}
      {error && <p role="alert" className="mt-6 border-l-2 border-red-700 bg-red-950/40 px-4 py-3 text-[14px] text-red-100">{error}</p>}

      {!result.ok ? (
        <p className="mt-8 text-ink-muted">Could not load lessons: {result.reason === "not_configured" ? "database not configured." : result.message}</p>
      ) : result.data.lessons.length === 0 ? (
        <p className="mt-8 text-ink-muted">No lessons yet. Add the first one with a YouTube link.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-[14px]">
            <thead className="border-b border-line text-[13px] text-ink-muted">
              <tr>
                <th className="py-2 pr-4 font-medium">Order</th><th className="pr-4 font-medium">Lesson</th><th className="pr-4 font-medium">Category</th>
                <th className="pr-4 font-medium">Source</th><th className="pr-4 font-medium">Language</th><th className="pr-4 font-medium">Status</th><th className="font-medium"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {result.data.lessons.map((l) => (
                <tr key={l.id} className="border-b border-line align-top">
                  <td className="t-num py-4 pr-4 text-ink-muted">{l.order}</td>
                  <td className="py-4 pr-4">
                    <Link href={`/admin/lessons/${l.id}`} className="font-medium text-ink hover:underline">{l.title}</Link>
                    <span className="mt-0.5 block text-[13px] text-ink-muted">/learn/{l.slug} · {l.youtubeId}{formatDuration(l.durationSeconds) ? ` · ${formatDuration(l.durationSeconds)}` : ""}</span>
                  </td>
                  <td className="py-4 pr-4">{l.category.name}</td>
                  <td className="py-4 pr-4">
                    {l.source === "youtube" ? <span className="font-medium text-ink">YouTube</span> : <span className="text-ink-muted">Added by hand</span>}
                    {l.lockedFields.length > 0 && l.source === "youtube" && <span className="block text-[13px] text-ink-muted">Edited: {l.lockedFields.map((f) => ({ title: "title", description: "description", category_id: "category", duration_seconds: "duration" })[f] ?? f).join(", ")}</span>}
                    {l.youtube.availability === "unavailable" && <span className="block text-[13px] font-medium text-red-700">Hidden: {UNAVAILABLE_LABEL[l.youtube.unavailableReason ?? ""] ?? "unavailable"}</span>}
                  </td>
                  <td className="py-4 pr-4 uppercase">{l.language}</td>
                  <td className="py-4 pr-4">
                    <span className={l.status === "published" ? "font-medium text-ink" : "text-ink-muted"}>{l.status === "published" ? "Published" : "Draft"}</span>
                    {l.isFeatured && <span className="ml-2 rounded bg-mist px-1.5 py-0.5 text-[13px] font-semibold text-navy">Featured</span>}
                  </td>
                  <td className="whitespace-nowrap py-3 text-right">
                    <Link href={`/admin/lessons/${l.id}`} className="link-rule mr-4 text-tech">Edit</Link>
                    {session?.canPublish && (
                      <form action={setLessonStatus} className="mr-4 inline">
                        <input type="hidden" name="id" value={l.id} />
                        <input type="hidden" name="status" value={l.status === "published" ? "draft" : "published"} />
                        <button className="link-rule text-tech">{l.status === "published" ? "Unpublish" : "Publish"}</button>
                      </form>
                    )}
                    {l.status === "published" && <Link href={`/learn/${l.slug}`} className="link-rule mr-4 text-ink-muted">View</Link>}
                    {session?.canPublish && <DeleteLessonButton id={l.id} title={l.title} action={deleteLesson} synced={l.source === "youtube" || l.youtube.availability !== null} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
