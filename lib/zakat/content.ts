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

/**
 * Rewrites a zakat media URL (`…/api/zakat/v1/media/{id}`) to the site's
 * own /api/media proxy; other URLs pass through unchanged.
 */
export function mediaSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = /\/api\/zakat\/v1\/media\/(\d+)(?:[?#].*)?$/.exec(url);
  return match ? `/api/media/${match[1]}` : url;
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

/** Public cause card (`GET /api/zakat/v1/causes`). */
export type PublicCause = {
  id: string;
  title: string;
  description: string;
  category: string;
  badge: "urgent" | "essential" | null;
  imageUrl: string | null;
  goalEtb: number | null;
  raisedEtb: number | null;
  progress: number | null;
  region: string | null;
  endsOn: string | null;
  acceptsZakat: boolean;
  body?: string | null;
  images?: string[] | null;
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
  region: string | null;
  imageUrl: string | null;
  publishedAt: string | null;
  body?: string;
};

export type UploadedMedia = { id: string; url: string; contentType?: string; sizeBytes?: number };

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
