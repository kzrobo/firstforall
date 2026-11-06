"use client";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { CATEGORY_FIELDS, CATEGORY_SECTIONS, HUB_CATEGORIES, PROJECT_STAGES, categoryTitle, type HubCategory } from "@/lib/hub/categories";
import type { HubEntry } from "@/lib/hub/types";
import { slugify, youTubeWatchUrl } from "@/lib/learn/youtube";
import { saveHubEntry, type HubFormState } from "./actions";

const SECTION_LABEL: Record<string, string> = {
  problem: "Problem", solution: "Proposed solution", approach: "Engineering approach", results: "Documented results", impact: "Impact evidence",
  overview: "Overview / description", topics: "Topics discussed", outcomes: "Outcomes and follow-up", challenge: "Challenge", design: "Design",
  iterations: "Iterations", format: "Format", materials: "Materials", audience: "Audience", activities: "Activities", result: "Verified result or award", evidence: "Evidence",
};
const STAGE_LABEL: Record<string, string> = { concept: "Concept", in_development: "In development", prototype: "Prototype", pilot: "Pilot", active: "Active", completed: "Completed", paused: "Paused" };

export function HubEntryForm({ entry, initialCategory, countries, others, canPublish }: {
  entry?: HubEntry; initialCategory: HubCategory; countries: [string, string][]; others: { id: string; title: string; category: HubCategory }[]; canPublish: boolean;
}) {
  const [state, action, pending] = useActionState<HubFormState, FormData>(saveHubEntry, {});
  const [, start] = useTransition();
  const [category, setCategory] = useState<HubCategory>(entry?.category ?? initialCategory);
  const [title, setTitle] = useState(entry?.title ?? "");
  const [slug, setSlug] = useState(entry?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(entry));
  const f = CATEGORY_FIELDS[category];
  const fe = state.fieldErrors ?? {};
  const input = "mt-1.5 block h-11 w-full rounded-md border border-line-strong bg-canvas px-3 text-[15px] focus:border-ink focus:outline-none aria-[invalid=true]:border-red-700";
  const area = "mt-1.5 block w-full rounded-md border border-line-strong bg-canvas px-3 py-2.5 text-[15px] leading-relaxed focus:border-ink focus:outline-none";
  const label = "block text-[14px] font-medium text-ink";
  const hint = "mt-1.5 text-[13px] text-ink-faint";
  const err = (k: string) => fe[k] && <p id={`${k}-err`} role="alert" className="mt-1.5 text-[13px] text-red-700">{fe[k]}</p>;
  const aria = (k: string) => ({ "aria-invalid": Boolean(fe[k]), "aria-describedby": fe[k] ? `${k}-err` : undefined });

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); const d = new FormData(e.currentTarget); start(() => action(d)); }}
      encType="multipart/form-data"
      className="grid gap-x-12 gap-y-8 lg:grid-cols-12"
      noValidate
    >
      {entry && <input type="hidden" name="id" value={entry.id} />}
      {state.error && <p role="alert" className="border-l-2 border-red-700 bg-red-950/40 px-4 py-3 text-[14px] text-red-100 lg:col-span-12">{state.error}</p>}

      <div className="space-y-6 lg:col-span-7">
        <div>
          <label htmlFor="category" className={label}>Category</label>
          <select id="category" name="category" value={category} onChange={(e) => setCategory(e.target.value as HubCategory)} disabled={Boolean(entry)} className={input}>
            {HUB_CATEGORIES.map((c) => <option key={c} value={c}>{categoryTitle(c)}</option>)}
          </select>
          {entry && <input type="hidden" name="category" value={category} />}
        </div>
        <div>
          <label htmlFor="title" className={label}>{f.team ? "Collaboration title" : "Title"}</label>
          <input id="title" name="title" required maxLength={160} value={title} onChange={(e) => { setTitle(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }} className={input} {...aria("title")} />
          {err("title")}
        </div>
        <div>
          <label htmlFor="slug" className={label}>Page address</label>
          <div className="mt-1.5 flex items-center rounded-md border border-line-strong bg-canvas focus-within:border-ink">
            <span className="pl-3 text-[14px] text-ink-faint">/mavericks/{category}/</span>
            <input id="slug" name="slug" value={slug} maxLength={80} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} className="h-11 flex-1 bg-transparent pr-3 text-[15px] focus:outline-none" {...aria("slug")} />
          </div>
          {err("slug")}
        </div>
        <div>
          <label htmlFor="subtitle" className={label}>Subtitle <span className="font-normal text-ink-faint">(optional)</span></label>
          <input id="subtitle" name="subtitle" maxLength={240} defaultValue={entry?.subtitle ?? ""} className={input} />
        </div>
        <div>
          <label htmlFor="summary" className={label}>Summary <span className="font-normal text-ink-faint">(optional, ≤ 800 characters)</span></label>
          <textarea id="summary" name="summary" rows={3} maxLength={800} defaultValue={entry?.summary ?? ""} className={area} />
        </div>
        <fieldset className="space-y-5 border-t border-line pt-6">
          <legend className="t-index pb-3">Story — only verified facts; leave a section empty if it is not documented yet</legend>
          {CATEGORY_SECTIONS[category].map((k) => (
            <div key={k}>
              <label htmlFor={`section_${k}`} className={label}>{SECTION_LABEL[k]}</label>
              <textarea id={`section_${k}`} name={`section_${k}`} rows={4} maxLength={4000} defaultValue={entry?.sections[k] ?? ""} className={area} />
            </div>
          ))}
        </fieldset>
        <div>
          <label htmlFor="milestones" className={label}>Milestones <span className="font-normal text-ink-faint">(optional)</span></label>
          <textarea id="milestones" name="milestones" rows={3} defaultValue={entry?.milestones.map((m) => `${m.date} | ${m.label}`).join("\n") ?? ""} placeholder="2026-03 | First prototype tested" className={area} />
          <p className={hint}>One per line: date | what happened.</p>
        </div>
        <div>
          <label htmlFor="collaborators" className={label}>Collaborators <span className="font-normal text-ink-faint">(optional)</span></label>
          <input id="collaborators" name="collaborators" defaultValue={entry?.collaborators.join(", ") ?? ""} className={input} />
          <p className={hint}>Comma-separated. Only people or organisations who agreed to be named.</p>
        </div>
      </div>

      <div className="space-y-6 lg:col-span-5">
        {f.stage && (
          <div>
            <label htmlFor="stage" className={label}>Development status</label>
            <select id="stage" name="stage" defaultValue={entry?.stage ?? ""} className={input}>
              <option value="">Not shown</option>
              {PROJECT_STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
            </select>
            <p className={hint}>Be honest: a prototype is not “Completed”.</p>
          </div>
        )}
        {(f.date || f.season) && (
          <div className="grid grid-cols-2 gap-4">
            {f.date && <div><label htmlFor="event_date" className={label}>Date</label><input id="event_date" name="event_date" type="date" defaultValue={entry?.eventDate ?? ""} className={input} {...aria("event_date")} />{err("event_date")}</div>}
            {f.season && <div><label htmlFor="season" className={label}>Season</label><input id="season" name="season" placeholder="2025–2026" defaultValue={entry?.season ?? ""} className={input} /></div>}
          </div>
        )}
        {f.team && (
          <fieldset className="space-y-4 border-t border-line pt-6">
            <legend className="t-index pb-3">Partner team</legend>
            <div><label htmlFor="team_name" className={label}>Team name</label><input id="team_name" name="team_name" maxLength={120} defaultValue={entry?.teamName ?? ""} className={input} /></div>
            <div><label htmlFor="team_number" className={label}>FTC team number <span className="font-normal text-ink-faint">(only if verified)</span></label><input id="team_number" name="team_number" inputMode="numeric" defaultValue={entry?.teamNumber ?? ""} className={input} {...aria("team_number")} />{err("team_number")}</div>
            <ImageField name="logo" label="Team logo" current={entry?.logoUrl ?? null} currentPath={entry?.logoPath ?? null} removeName="remove_logo" pathName="logo_path" />
          </fieldset>
        )}
        {f.location && (
          <fieldset className="space-y-4 border-t border-line pt-6">
            <legend className="t-index pb-3">Location</legend>
            <div>
              <label htmlFor="country_code" className={label}>Country</label>
              <select id="country_code" name="country_code" defaultValue={entry?.countryCode ?? ""} className={input} {...aria("country_code")}>
                <option value="">—</option>
                {countries.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
              </select>
              {err("country_code")}
            </div>
            <div><label htmlFor="city" className={label}>City <span className="font-normal text-ink-faint">(only if verified)</span></label><input id="city" name="city" maxLength={80} defaultValue={entry?.city ?? ""} className={input} {...aria("city")} />{err("city")}</div>
            <div className="grid grid-cols-2 gap-4">
              <div><label htmlFor="latitude" className={label}>Latitude</label><input id="latitude" name="latitude" inputMode="decimal" defaultValue={entry?.latitude ?? ""} className={input} {...aria("latitude")} /></div>
              <div><label htmlFor="longitude" className={label}>Longitude</label><input id="longitude" name="longitude" inputMode="decimal" defaultValue={entry?.longitude ?? ""} className={input} /></div>
            </div>
            {err("latitude")}
            <p className={hint}>Coordinates only for a verified city. Leave empty and the globe places the team at its country, labelled as such.</p>
          </fieldset>
        )}
        <fieldset className="space-y-4 border-t border-line pt-6">
          <legend className="t-index pb-3">Images</legend>
          <ImageField name="cover" label="Cover image" current={entry?.coverUrl ?? null} currentPath={entry?.coverPath ?? null} removeName="remove_cover" pathName="cover_path" />
          <input type="hidden" name="media_count" value={entry?.media.length ?? 0} />
          {entry?.media.map((m, i) => (
            <div key={m.path} className="grid grid-cols-[72px_1fr] gap-3 border-t border-line pt-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of an uploaded image */}
              <img src={m.url} alt="" className="aspect-square w-[72px] bg-soft object-cover" />
              <div className="space-y-2">
                <input type="hidden" name={`media_${i}_path`} value={m.path} />
                <input name={`media_${i}_alt`} defaultValue={m.alt} aria-label="Alt text" placeholder="Alt text (required)" className="h-9 w-full rounded-md border border-line-strong bg-canvas px-2 text-[14px]" />
                <input name={`media_${i}_caption`} defaultValue={m.caption ?? ""} aria-label="Caption" placeholder="Caption (optional)" className="h-9 w-full rounded-md border border-line-strong bg-canvas px-2 text-[14px]" />
                <div className="flex items-center gap-4 text-[13px]">
                  <select name={`media_${i}_kind`} defaultValue={m.kind} aria-label="Image type" className="h-8 rounded-md border border-line-strong bg-canvas px-2"><option value="photo">Photo</option><option value="screenshot">Call screenshot</option><option value="graphic">Graphic / slide</option></select>
                  <label className="flex items-center gap-2 text-red-700"><input type="checkbox" name={`media_${i}_remove`} className="accent-tech" />Remove</label>
                </div>
              </div>
            </div>
          ))}
          <div className="border-t border-line pt-4">
            <label htmlFor="new_media" className={label}>Add photographs or screenshots</label>
            <input id="new_media" name="new_media" type="file" multiple accept="image/jpeg,image/png,image/webp" className="mt-2 block w-full text-[14px] file:mr-4 file:h-10 file:border-0 file:bg-ink file:px-4 file:font-medium file:text-canvas" />
            <div className="mt-3 grid grid-cols-[1fr_auto] gap-3">
              <input name="new_media_alt" placeholder="Describe these images (alt text)" aria-label="Alt text for new images" className="h-10 rounded-md border border-line-strong bg-canvas px-3 text-[14px]" />
              <select name="new_media_kind" aria-label="Type of new images" className="h-10 rounded-md border border-line-strong bg-canvas px-2 text-[14px]"><option value="photo">Photos</option><option value="screenshot">Call screenshots</option><option value="graphic">Graphics / slides</option></select>
            </div>
            <p className={hint}>JPEG, PNG or WebP · up to 8 MB each · only genuine team media.</p>
            {err("media")}
          </div>
        </fieldset>
        <div>
          <label htmlFor="video_url" className={label}>YouTube video <span className="font-normal text-ink-faint">(optional)</span></label>
          <input id="video_url" name="video_url" type="url" defaultValue={entry?.videoId ? youTubeWatchUrl(entry.videoId) : ""} className={input} {...aria("video_url")} />
          {err("video_url")}
        </div>
        {others.length > 0 && (
          <fieldset className="border-t border-line pt-6">
            <legend className="t-index pb-3">Related entries</legend>
            <div className="max-h-48 space-y-1.5 overflow-y-auto text-[14px]">
              {others.map((o) => (
                <label key={o.id} className="flex items-center gap-2"><input type="checkbox" name="related_ids" value={o.id} defaultChecked={entry?.relatedIds.includes(o.id)} className="accent-tech" />{o.title} <span className="text-ink-faint">· {categoryTitle(o.category)}</span></label>
              ))}
            </div>
          </fieldset>
        )}
        <fieldset className="border-t border-line pt-6">
          <legend className="t-index pb-3">Visibility</legend>
          {(["draft", "published", "archived"] as const).map((s) => (
            <label key={s} className={`flex items-center gap-3 py-1.5 text-[15px] ${s !== "draft" && !canPublish ? "opacity-50" : ""}`}>
              <input type="radio" name="status" value={s} disabled={s !== "draft" && !canPublish} defaultChecked={(entry?.status ?? "draft") === s} className="accent-tech" />
              {s === "draft" ? "Draft — only in this workspace" : s === "published" ? "Published — public" : "Archived — kept, not public"}
            </label>
          ))}
          <label className="mt-3 flex items-center gap-3 border-t border-line pt-3 text-[15px]"><input type="checkbox" name="is_featured" defaultChecked={entry?.isFeatured} className="accent-tech" />Featured in this category</label>
          <div className="mt-4"><label htmlFor="display_order" className={label}>Display order</label><input id="display_order" name="display_order" type="number" defaultValue={entry?.order ?? 0} className={`${input} w-32`} /></div>
        </fieldset>
        <div className="flex items-center gap-5 border-t border-line pt-6">
          <button disabled={pending} className="btn-primary disabled:opacity-60">{pending ? "Saving…" : entry ? "Save changes" : "Create entry"}</button>
          <Link href={`/admin/hub?category=${category}`} className="text-[14px] text-ink-muted hover:text-ink">Cancel</Link>
        </div>
      </div>
    </form>
  );
}

function ImageField({ name, label, current, currentPath, removeName, pathName }: { name: string; label: string; current: string | null; currentPath: string | null; removeName: string; pathName: string }) {
  return (
    <div>
      <label htmlFor={name} className="block text-[14px] font-medium text-ink">{label}</label>
      {current && currentPath && (
        <div className="mt-2 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
          <img src={current} alt="" className="size-14 bg-soft object-cover" />
          <input type="hidden" name={pathName} value={currentPath} />
          <label className="flex items-center gap-2 text-[13px] text-red-700"><input type="checkbox" name={removeName} className="accent-tech" />Remove</label>
        </div>
      )}
      <input id={name} name={name} type="file" accept="image/jpeg,image/png,image/webp" className="mt-2 block w-full text-[14px] file:mr-4 file:h-10 file:border-0 file:bg-ink file:px-4 file:font-medium file:text-canvas" />
    </div>
  );
}
