/**
 * The causes rules the backend checks since 10 November, checked first in the
 * form so the admin sees why before saving.
 */

/** Today's calendar day in Addis Ababa, e.g. "2026-11-05". */
export function todayInAddis(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Addis_Ababa",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export const END_DATE_PASSED = "The end date must be today or later.";

/**
 * Why the end date can't be saved, or null. A new cause needs today or later;
 * on an edit only a changed date is checked (an old date can be kept while
 * other fields change).
 */
export function endsOnError(endsOn: string, savedEndsOn: string | null, today: string): string | null {
  if (!endsOn) return null;
  if (savedEndsOn != null && endsOn === savedEndsOn) return null;
  return endsOn < today ? END_DATE_PASSED : null;
}

/** Publishing or re-opening a cause past its end date is refused (409). */
export function endDatePassed(endsOn: string | null | undefined, today: string): boolean {
  return Boolean(endsOn) && (endsOn as string) < today;
}

/**
 * The alt text to send to `PATCH /admin/media/{id}` for the cover, or
 * undefined when nothing needs sending. Alt text belongs to the image, so a
 * new cover gets the text typed in the form, and a cleared text is sent as null.
 */
export function coverAltTextChange(
  cover: { id: string; altText: string },
  saved: { id: string | null; altText: string | null },
): { mediaId: string; altText: string | null } | undefined {
  if (!cover.id) return undefined;
  const next = cover.altText.trim();
  const before = (saved.altText ?? "").trim();
  if (cover.id === saved.id) {
    return next === before ? undefined : { mediaId: cover.id, altText: next || null };
  }
  return next ? { mediaId: cover.id, altText: next } : undefined;
}
