/** Image upload validation shared by admin actions (pure; unit-tested). */

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_IMAGES_PER_SAVE = 12;
export type ImageType = "image/jpeg" | "image/png" | "image/webp";
const EXT: Record<ImageType, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Identify an image by its first bytes — never trust the file name or the browser's MIME type. SVG is rejected. */
export function sniffImage(head: Uint8Array): ImageType | null {
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return "image/jpeg";
  if (head.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => head[i] === b)) return "image/png";
  if (head.length >= 12 && String.fromCharCode(...head.slice(0, 4)) === "RIFF" && String.fromCharCode(...head.slice(8, 12)) === "WEBP") return "image/webp";
  return null;
}

export function storagePathFor(folder: string, id: string, type: ImageType): string {
  const safe = folder.replace(/[^a-z0-9-]/g, "");
  return `hub/${safe}/${id}.${EXT[type]}`;
}

export type UploadCheck = { ok: true; type: ImageType } | { ok: false; error: string };

export function checkImage(name: string, size: number, head: Uint8Array): UploadCheck {
  if (size === 0) return { ok: false, error: `${name}: the file is empty.` };
  if (size > MAX_IMAGE_BYTES) return { ok: false, error: `${name}: larger than 8 MB.` };
  const type = sniffImage(head);
  return type ? { ok: true, type } : { ok: false, error: `${name}: only JPEG, PNG or WebP images are accepted.` };
}

/** "2026-03 | First call with the team" lines → milestones. Lines without a label are ignored. */
export function parseMilestones(text: string): { date: string; label: string }[] {
  return text.split("\n").map((l) => l.trim()).filter(Boolean).flatMap((l) => {
    const [date, ...rest] = l.split("|");
    const label = rest.join("|").trim();
    return label ? [{ date: date.trim().slice(0, 20), label: label.slice(0, 200) }] : [];
  }).slice(0, 40);
}

export function parseList(text: string): string[] {
  return [...new Set(text.split(/[\n,]/).map((s) => s.trim()).filter(Boolean))].slice(0, 30).map((s) => s.slice(0, 120));
}
