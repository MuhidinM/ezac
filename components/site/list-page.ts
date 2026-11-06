/**
 * The ?page= of a paginated public list (causes, impact stories, reports).
 * Plain module, so it is unit-tested (tests/public/list-page.test.ts).
 */

/** The page asked for: a whole number from 1; anything else (missing, "abc", "0", "2.5") is page 1. */
export function pageFromParam(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !/^\d{1,6}$/.test(value)) return 1;
  const page = Number(value);
  return page >= 1 ? page : 1;
}

/** True when `page` is past the end of the list, so the page should answer 404. */
export function isPastLastPage(page: number, totalPages: number) {
  return page > Math.max(1, totalPages);
}

/**
 * The path of one page of a list, keeping its other query parameters in
 * order: listPath("/causes", 2, { status: "closed" }) -> "/causes?status=closed&page=2".
 * Page 1 has no page parameter, so it keeps the list's one canonical URL.
 */
export function listPath(path: string, page: number, params: Record<string, string | undefined> = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
  if (page > 1) query.set("page", String(page));
  const search = query.toString();
  return search ? `${path}?${search}` : path;
}
