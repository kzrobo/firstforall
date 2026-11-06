import type { Dictionary } from "@/i18n/dictionary";
import type { GalleryItem } from "@/lib/hub/gallery";
import { ProjectGallery } from "./ProjectGallery";

/** Heading + full-bleed center-focused project carousel. Renders nothing when no entry has a real image. */
export function ProjectGallerySection({ items, t, title, intro, id = "projects" }: {
  items: GalleryItem[]; t: Dictionary; title?: string; intro?: string | null; id?: string;
}) {
  if (!items.length) return null;
  const H = t.hub;
  return (
    <section aria-labelledby={`${id}-title`} className="pb-20 pt-6 lg:pb-28">
      <div className="mx-auto grid max-w-content gap-x-6 gap-y-3 px-5 lg:grid-cols-12 lg:px-10">
        <h2 id={`${id}-title`} className="t-h2 text-ink lg:col-span-6">{title ?? H.projectsTitle}</h2>
        {intro !== null && <p className="max-w-xl text-[17px] text-ink-muted lg:col-span-5 lg:col-start-8 lg:pt-2">{intro ?? H.projectsIntro}</p>}
      </div>
      <div className="mt-8 lg:mt-10">
        <ProjectGallery items={items} label={title ?? H.projectsTitle}
          labels={{ previous: H.galleryPrev, next: H.galleryNext, open: H.galleryOpen, hint: H.galleryHint, hintTouch: H.galleryHintTouch, of: H.imageOf }} />
      </div>
    </section>
  );
}
