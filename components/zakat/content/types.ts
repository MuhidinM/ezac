import type { AdminCause, AdminStory } from "@/lib/zakat/content";

/**
 * What the admin content endpoints return since the 10 and 11 November
 * releases, on top of the shared types in lib/zakat/content.ts.
 * `version` goes back on every PUT (a stale one is 409 VERSION_CONFLICT).
 * `createdByName` / `updatedByName` are null on records from before 11 November.
 */
export type CauseAdmin = AdminCause & {
  version: number;
  /** Draft-safe links (need the staff session). */
  adminImageUrl: string | null;
  adminGalleryUrls: string[] | null;
  imageAltText: string | null;
  /** The impact region's code; null on causes saved with a free-text region only. */
  regionCode: string | null;
  /** Succeeded app payments for the cause; null when payment-service couldn't be read. Cached up to a minute. */
  liveRaisedEtb: number | null;
  createdByName: string | null;
  titleAm: string | null;
  descriptionAm: string | null;
  bodyAm: string | null;
};

export type StoryAdmin = AdminStory & {
  version: number;
  adminImageUrl: string | null;
  createdByName: string | null;
  titleAm: string | null;
  summaryAm: string | null;
  bodyAm: string | null;
};

export type ReportStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type ReportAdmin = {
  id: string;
  title: string;
  period: string | null;
  summary: string | null;
  status: ReportStatus;
  publishedAt: string | null;
  fileMediaId: string | null;
  fileUrl: string | null;
  adminFileUrl: string | null;
  sizeBytes: number | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  version: number;
};

export type RegionAdmin = {
  code: string;
  name: string;
  nameAm: string | null;
  latitude: number;
  longitude: number;
  /** Null: not entered. */
  distributedFundsEtb: number | null;
  /** Entered by ADMIN; null means the public figure is the live count. */
  livesTouched: number | null;
  /** The figure the public map shows, and where it comes from. */
  livesTouchedEffective: number | null;
  livesTouchedSource: "ENTERED" | "LIVE" | null;
  /** Live count of households in the region. */
  beneficiaries: number | null;
  sortOrder: number | null;
  active: boolean;
  updatedBy: string | null;
  updatedByName: string | null;
  updatedAt: string | null;
  version: number;
};
