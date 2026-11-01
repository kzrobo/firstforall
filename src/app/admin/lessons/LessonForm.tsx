"use client";
import Link from "next/link";
import { useActionState, useMemo, useState, useTransition } from "react";
import { YouTubeThumb } from "@/components/learn/YouTubeThumb";
import { formatDuration, parseYouTubeUrl, slugify, youTubeWatchUrl } from "@/lib/learn/youtube";
import type { Lesson, LessonCategory } from "@/lib/learn/types";
import { fetchYouTubeTitle, saveLesson, type LessonFormState } from "./actions";

const LANGS = [
  { code: "en", label: "English" }, { code: "kk", label: "Kazakh" }, { code: "ru", label: "Russian" }, { code: "es", label: "Spanish" },
];

export function LessonForm({ lesson, categories, canPublish }: { lesson?: Lesson; categories: LessonCategory[]; canPublish: boolean }) {
  const [state, action, pending] = useActionState<LessonFormState, FormData>(saveLesson, {});
  const [url, setUrl] = useState(lesson ? youTubeWatchUrl(lesson.youtubeId) : "");
  const [title, setTitle] = useState(lesson?.title ?? "");
  const [slug, setSlug] = useState(lesson?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(lesson));
  const [fetchMsg, setFetchMsg] = useState<string | null>(null);
  const [fetching, startFetch] = useTransition();
  const [, startSubmit] = useTransition();
  const videoId = useMemo(() => parseYouTubeUrl(url), [url]);
  const fe = state.fieldErrors ?? {};

  const input = "mt-1.5 block h-11 w-full border border-line-strong bg-paper px-3 text-[15px] focus:border-navy focus:outline-none aria-[invalid=true]:border-red-700";
  const label = "block text-[14px] font-medium text-ink";
  const err = (k: string) => fe[k] && <p id={`${k}-err`} className="mt-1.5 text-[13px] text-red-800">{fe[k]}</p>;
  const aria = (k: string) => ({ "aria-invalid": Boolean(fe[k]), "aria-describedby": fe[k] ? `${k}-err` : undefined });

  return (
    <form
      // Dispatch manually instead of <form action>: React 19 resets uncontrolled fields after an
      // action submit, which would wipe the editor's input whenever validation fails.
      onSubmit={(e) => { e.preventDefault(); const data = new FormData(e.currentTarget); startSubmit(() => action(data)); }}
      className="grid gap-x-12 gap-y-8 lg:grid-cols-12"
      noValidate
    >
      {lesson && <input type="hidden" name="id" value={lesson.id} />}
      {state.error && <p role="alert" className="border-l-2 border-red-700 bg-red-50 px-4 py-3 text-[14px] text-red-900 lg:col-span-12">{state.error}</p>}

      <div className="space-y-6 lg:col-span-7">
        <div>
          <label htmlFor="youtube_url" className={label}>YouTube link</label>
          <input id="youtube_url" name="youtube_url" type="url" inputMode="url" required value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=… or https://youtu.be/…" className={input} {...aria("youtube_url")} />
          {err("youtube_url")}
          <p className="mt-1.5 text-[13px] text-ink-muted">
            {url && !videoId ? "Not recognised as a YouTube video link." : videoId ? <>Video id <code className="text-ink">{videoId}</code></> : "Watch, youtu.be and Shorts links are accepted. Embed code is not."}
          </p>
        </div>

        <div>
          <div className="flex items-end justify-between gap-4">
            <label htmlFor="title" className={label}>Title</label>
            <button type="button" disabled={!videoId || fetching}
              onClick={() => startFetch(async () => {
                setFetchMsg(null);
                const r = await fetchYouTubeTitle(url);
                if (r.title) { setTitle(r.title); if (!slugTouched) setSlug(slugify(r.title)); setFetchMsg("Title filled in from YouTube."); }
                else setFetchMsg(r.error ?? "Could not fetch the title.");
              })}
              className="link-rule text-[13px] text-tech disabled:opacity-40">
              {fetching ? "Fetching…" : "Fetch title from YouTube"}
            </button>
          </div>
          <input id="title" name="title" required maxLength={160} value={title}
            onChange={(e) => { setTitle(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }} className={input} {...aria("title")} />
          {err("title")}
          {fetchMsg && <p role="status" className="mt-1.5 text-[13px] text-ink-muted">{fetchMsg}</p>}
        </div>

        <div>
          <label htmlFor="slug" className={label}>Page address</label>
          <div className="mt-1.5 flex items-center border border-line-strong bg-paper focus-within:border-navy">
            <span className="pl-3 text-[14px] text-ink-faint">/learn/</span>
            <input id="slug" name="slug" value={slug} maxLength={80} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
              className="h-11 flex-1 bg-transparent pr-3 text-[15px] focus:outline-none" {...aria("slug")} />
          </div>
          {err("slug")}
          <p className="mt-1.5 text-[13px] text-ink-muted">Lowercase letters, numbers and dashes. Left empty, it is made from the title or the video id.</p>
        </div>

        <div>
          <label htmlFor="description" className={label}>Description <span className="font-normal text-ink-muted">(optional)</span></label>
          <textarea id="description" name="description" rows={6} maxLength={4000} defaultValue={lesson?.description ?? ""}
            className="mt-1.5 block w-full border border-line-strong bg-paper px-3 py-2.5 text-[15px] leading-relaxed focus:border-navy focus:outline-none" />
          <p className="mt-1.5 text-[13px] text-ink-muted">Write it in the language of the video. Plain text; line breaks are kept.</p>
        </div>
      </div>

      <div className="space-y-6 lg:col-span-5">
        <div>
          <p className={label}>Preview</p>
          <div className="mt-1.5 border border-line">
            {videoId ? <YouTubeThumb id={videoId} title={title || "Lesson"} /> : <div className="flex aspect-video items-center justify-center bg-soft text-[13px] text-ink-faint">Paste a link to preview</div>}
          </div>
          {videoId && <a href={youTubeWatchUrl(videoId)} target="_blank" rel="noopener noreferrer" className="link-rule mt-2 inline-block text-[13px] text-tech">Open on YouTube ↗</a>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="category_id" className={label}>Category</label>
            <select id="category_id" name="category_id" required defaultValue={lesson?.category.id ?? ""} className={input} {...aria("category_id")}>
              <option value="" disabled>Choose…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {err("category_id")}
          </div>
          <div>
            <label htmlFor="language_code" className={label}>Spoken language</label>
            <select id="language_code" name="language_code" defaultValue={lesson?.language ?? "en"} className={input} {...aria("language_code")}>
              {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              {lesson && !LANGS.some((l) => l.code === lesson.language) && <option value={lesson.language}>{lesson.language}</option>}
            </select>
            {err("language_code")}
          </div>
          <div>
            <label htmlFor="duration" className={label}>Duration <span className="font-normal text-ink-muted">(optional)</span></label>
            <input id="duration" name="duration" placeholder="12:05" defaultValue={formatDuration(lesson?.durationSeconds ?? null) ?? ""} className={input} {...aria("duration")} />
            {err("duration")}
          </div>
          <div>
            <label htmlFor="display_order" className={label}>Display order</label>
            <input id="display_order" name="display_order" type="number" min={-9999} max={9999} defaultValue={lesson?.order ?? 0} className={input} {...aria("display_order")} />
            <p className="mt-1.5 text-[12px] text-ink-muted">Lower numbers come first.</p>
          </div>
        </div>

        <fieldset className="border-t border-line pt-5">
          <legend className={`${label} pb-2`}>Visibility</legend>
          <label className="flex items-start gap-3 py-1.5 text-[15px]">
            <input type="radio" name="status" value="draft" defaultChecked={lesson?.status !== "published"} className="mt-1 accent-navy" />
            <span>Draft <span className="block text-[13px] text-ink-muted">Visible only in this workspace.</span></span>
          </label>
          <label className={`flex items-start gap-3 py-1.5 text-[15px] ${canPublish ? "" : "opacity-50"}`}>
            <input type="radio" name="status" value="published" disabled={!canPublish} defaultChecked={lesson?.status === "published"} className="mt-1 accent-navy" />
            <span>Published <span className="block text-[13px] text-ink-muted">{canPublish ? "Public on /learn." : "Your role cannot publish."}</span></span>
          </label>
          <label className="mt-3 flex items-start gap-3 border-t border-line pt-4 text-[15px]">
            <input type="checkbox" name="is_featured" defaultChecked={lesson?.isFeatured} className="mt-1 accent-navy" />
            <span>Featured lesson <span className="block text-[13px] text-ink-muted">Shown first on /learn and the homepage. Replaces the current featured lesson.</span></span>
          </label>
        </fieldset>

        <div className="flex items-center gap-5 border-t border-line pt-6">
          <button disabled={pending} className="btn-primary disabled:opacity-60">{pending ? "Saving…" : lesson ? "Save changes" : "Add lesson"}</button>
          <Link href="/admin/lessons" className="text-[14px] text-ink-muted hover:text-navy">Cancel</Link>
        </div>
      </div>
    </form>
  );
}
