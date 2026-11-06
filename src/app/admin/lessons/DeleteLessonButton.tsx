"use client";
import { useRef } from "react";

/** Delete with an explicit confirmation dialog; the server also requires confirm=delete. */
export function DeleteLessonButton({ id, title, action, synced = false }: { id: string; title: string; action: (form: FormData) => Promise<void>; synced?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} className="link-rule text-red-700">Delete</button>
      <dialog ref={dialog} aria-labelledby={`del-${id}`} className="m-auto w-[min(92vw,440px)] rounded-md bg-canvas p-0 text-left shadow-xl backdrop:bg-black/40">
        <form action={action} className="p-6">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="confirm" value="delete" />
          <h2 id={`del-${id}`} className="t-h3 text-ink">Delete this lesson?</h2>
          <p className="mt-3 whitespace-normal text-[14px] text-ink-muted">“{title}” will be removed from the website. The video stays on YouTube. This cannot be undone.{synced ? " The automatic import will not add it again (you can allow that under Settings & playlists). To hide it for now, unpublish instead." : ""}</p>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => dialog.current?.close()} className="h-10 px-4 text-[14px] font-medium text-ink hover:bg-soft">Cancel</button>
            <button className="h-10 bg-red-800 px-4 text-[14px] font-semibold text-white hover:bg-red-900">Delete lesson</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
