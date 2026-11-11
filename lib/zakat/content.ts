/** Shared vocabulary for admin-managed zakat content (causes, stories). */

export const CONTENT_CATEGORIES = [
  { value: "education", label: "Education" },
  { value: "water", label: "Water" },
  { value: "health", label: "Health" },
  { value: "food", label: "Food" },
  { value: "shelter", label: "Shelter" },
  { value: "livelihood", label: "Livelihood" },
  { value: "emergency", label: "Emergency" },
  { value: "general", label: "General" },
] as const;

export const CAUSE_BADGES = [
  { value: "urgent", label: "Urgent" },
  { value: "essential", label: "Essential" },
] as const;

/** The copies zakat-engine makes of a JPEG or PNG upload, by width in pixels. */
const IMAGE_WIDTHS = { thumbnail: 400, medium: 800, large: 1600 } as const;
type ImageSize = keyof typeof IMAGE_WIDTHS;
const IMAGE_SIZES = Object.keys(IMAGE_WIDTHS) as ImageSize[];

/**
 * Rewrites a zakat media URL (`…/api/zakat/v1/media/{id}`, optionally with
 * `?size=thumbnail|medium|large`) to the site's own /bff/media proxy, keeping
 * the size; other URLs pass through unchanged.
 */
export function mediaSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = /\/api\/zakat\/v1\/media\/(\d+)(?:\?([^#]*))?(?:#.*)?$/.exec(url);
  if (!match) return url;
  const size = new URLSearchParams(match[2] ?? "").get("size");
  return size && IMAGE_SIZES.includes(size as ImageSize) ? `/bff/media/${match[1]}?size=${size}` : `/bff/media/${match[1]}`;
}

/** `imageVariants` on public causes and stories; `variants` on a gallery image. */
export type ImageVariants = Partial<Record<ImageSize, string | null>> | null;

/**
 * `src` and `srcSet` for a public image: the original as `src`, and the
 * smaller copies as a srcset so a card loads the 400 or 800 px copy instead
 * of the full photo. No srcset when there are no copies (WebP uploads, older
 * images).
 */
export function imageSources(
  url: string | null | undefined,
  variants: ImageVariants | undefined,
): { src: string; srcSet?: string } | null {
  const src = mediaSrc(url);
  if (!src) return null;
  const entries = IMAGE_SIZES.flatMap((size) => {
    const variant = mediaSrc(variants?.[size]);
    return variant ? [`${variant} ${IMAGE_WIDTHS[size]}w`] : [];
  });
  return entries.length > 0 ? { src, srcSet: entries.join(", ") } : { src };
}

/**
 * The `lang` attribute for admin-entered text shown on a page in `locale`:
 * undefined when the text is in the page's language, else the text's
 * language. Public causes, stories and regions say which language they came
 * back in (`lang`: "am" when Amharic was entered, else "en"); without it the
 * text is English.
 */
export function foreignLang(textLang: string | null | undefined, locale: string): string | undefined {
  const lang = textLang || "en";
  return lang === locale ? undefined : lang;
}

export function categoryLabel(value: string | null | undefined) {
  return CONTENT_CATEGORIES.find((item) => item.value === value)?.label ?? value ?? "—";
}

export type CauseStatus = "DRAFT" | "ACTIVE" | "CLOSED";

export type AdminCause = {
  id: string;
  title: string;
  description: string;
  body: string | null;
  category: string;
  badge: "urgent" | "essential" | null;
  imageMediaId: string | number | null;
  imageUrl: string | null;
  galleryMediaIds: (string | number)[] | null;
  images: string[] | null;
  goalEtb: number | null;
  raisedOfflineEtb: number | null;
  raisedEtb: number | null;
  progress: number | null;
  region: string | null;
  endsOn: string | null;
  acceptsZakat: boolean;
  status: CauseStatus;
  ended: boolean;
  publishedAt: string | null;
  closedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string | null;
};

/** A gallery image of a public cause. */
export type PublicGalleryImage = { url: string; altText: string | null; variants: ImageVariants };

/** Public cause card (`GET /api/zakat/v1/causes`); the detail adds `body`, `images` and `gallery`. */
export type PublicCause = {
  id: string;
  title: string;
  description: string;
  category: string;
  badge: "urgent" | "essential" | null;
  imageUrl: string | null;
  imageAltText?: string | null;
  imageVariants?: ImageVariants;
  goalEtb: number | null;
  /** offlineRaisedEtb + liveRaisedEtb: the figure to show and the one progress uses. */
  raisedEtb: number | null;
  /** Entered by ADMIN. */
  offlineRaisedEtb?: number | null;
  /** Succeeded payments for the cause; null when payment-service could not be read (cached up to a minute). */
  liveRaisedEtb?: number | null;
  progress: number | null;
  /** Always in English, also on an Amharic page. null when not entered. */
  region: string | null;
  regionCode?: string | null;
  endsOn: string | null;
  acceptsZakat: boolean;
  status?: "active" | "closed";
  closedAt?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  /** The language of title, description and body: "am" or "en" (English is the fallback). */
  lang?: string;
  body?: string | null;
  images?: string[] | null;
  gallery?: PublicGalleryImage[] | null;
};

export type StoryStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type AdminStory = {
  id: string;
  title: string;
  summary: string;
  body: string;
  category: string;
  regionCode: string | null;
  region: string | null;
  imageMediaId: string | null;
  imageUrl: string | null;
  consentConfirmed: boolean;
  consentNote: string | null;
  status: StoryStatus;
  publishedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string | null;
};

/** Public story (`GET /api/zakat/v1/impact/stories`); detail adds `body`. */
export type PublicStory = {
  id: string;
  title: string;
  summary: string;
  category: string;
  /** Always in English, also on an Amharic page. null when not entered. */
  region: string | null;
  regionCode?: string | null;
  imageUrl: string | null;
  imageAltText?: string | null;
  imageVariants?: ImageVariants;
  /** A calendar date ("2026-10-15"). */
  publishedAt: string | null;
  /** A timestamp. */
  updatedAt?: string | null;
  /** The language of title, summary and body: "am" or "en" (English is the fallback). */
  lang?: string;
  body?: string;
};

export type UploadedMedia = { id: string; url: string; contentType?: string; sizeBytes?: number };

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Progress towards the goal in whole percent (may pass 100), or null when it
 * can't be told. Worked out from raisedEtb (offline plus live) and the goal,
 * so it always matches the amount shown; the service's `progress` is the
 * fallback when either is missing.
 */
export function causeProgressPercent(cause: Pick<PublicCause, "raisedEtb" | "goalEtb" | "progress">): number | null {
  const { raisedEtb, goalEtb, progress } = cause;
  if (raisedEtb != null && goalEtb != null && Number.isFinite(raisedEtb) && Number.isFinite(goalEtb) && goalEtb > 0) {
    return Math.max(0, Math.floor((raisedEtb / goalEtb) * 100));
  }
  return progress != null && Number.isFinite(progress) ? Math.max(0, Math.round(progress * 100)) : null;
}
