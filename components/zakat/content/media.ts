/**
 * Image and PDF links for the content editors.
 *
 * The public `/media/{id}` answers 404 for a file that no published content
 * uses yet (drafts, a new upload), so the editors show files through the
 * admin route instead: `/bff/zakat-admin/media/{id}` fetches
 * `/api/zakat/v1/admin/media/{id}` with the staff session and streams it back.
 * Public pages keep using `mediaSrc` (lib/zakat/content.ts).
 */

const MEDIA_URL = /\/api\/zakat\/v1\/(?:admin\/)?media\/(\d+)(?:\?([^#]*))?(?:#.*)?$/;
const SIZES = new Set(["thumbnail", "medium", "large"]);

/** The editors' link for a media id, or null for none. */
export function adminMediaById(id: string | number | null | undefined, size?: "thumbnail" | "medium" | "large"): string | null {
  if (id == null || !/^\d{1,18}$/.test(String(id))) return null;
  return `/bff/zakat-admin/media/${id}${size ? `?size=${size}` : ""}`;
}

/**
 * Rewrites a zakat media URL (public or admin, e.g. `adminImageUrl`) to the
 * editors' link, keeping a `size` choice. Other URLs pass through unchanged.
 */
export function adminMediaSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = MEDIA_URL.exec(url);
  if (!match) return url;
  const size = new URLSearchParams(match[2] ?? "").get("size");
  return adminMediaById(match[1], size && SIZES.has(size) ? (size as "thumbnail" | "medium" | "large") : undefined);
}
