import type { Manual, ManualTranslation } from "@/lib/manuals/types";
import { PdfThumbnail } from "./PdfThumbnail";

/** Uploaded cover if present, otherwise the real first page of the given edition (default: the source PDF). */
export function DocumentThumb({ manual, edition }: { manual: Manual; edition?: ManualTranslation | null }) {
  if (manual.coverUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- storage-hosted cover
    return <img src={manual.coverUrl} alt={`${manual.title}, cover`} loading="lazy" className="aspect-[8.5/11] w-full bg-paper object-cover ring-1 ring-line" />;
  }
  const doc = edition ?? manual.translations.find((t) => t.isSource) ?? manual.translations[0];
  if (!doc) return <div className="aspect-[8.5/11] w-full bg-paper ring-1 ring-line" />;
  return <PdfThumbnail url={doc.fileUrl} title={manual.title} />;
}
