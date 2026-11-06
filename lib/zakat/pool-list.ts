/**
 * The disbursement pool list's state (kept in the URL by useListState) and
 * the query it sends. Pure, so it is unit-tested on its own.
 */

/** The filter fields, in the order the Filters panel shows them. */
export const POOL_FILTERS = [
  "branchId",
  "region",
  "riskCategory",
  "asnaf",
  "scoreMin",
  "scoreMax",
  "approvedFrom",
  "approvedTo",
] as const;

/**
 * Each sort option is one value: the field and its direction together. Before,
 * they were two values and switching tabs reset only the field, so "oldest
 * first" stayed on while the box showed "Priority (default)" (logic-backoffice-13).
 */
export const POOL_SORTS = [
  { value: "priority:desc", label: "Priority (default)" },
  { value: "score:desc", label: "Highest score" },
  { value: "approvedAt:asc", label: "Approved longest ago" },
  { value: "approvedAt:desc", label: "Approved most recently" },
  { value: "poolStatusAt:desc", label: "Last pool change" },
] as const;

export const POOL_LIST_DEFAULTS = {
  view: "awaiting",
  sort: "priority:desc",
  branchId: "",
  region: "",
  riskCategory: "",
  asnaf: "",
  scoreMin: "",
  scoreMax: "",
  approvedFrom: "",
  approvedTo: "",
  page: 1,
};

export type PoolListState = typeof POOL_LIST_DEFAULTS;

export type PoolFilterErrors = { score?: string; approved?: string };

/** Checked here so a bad range never reaches the server, which answers with a raw validation message. */
export function poolFilterErrors(state: Pick<PoolListState, "scoreMin" | "scoreMax" | "approvedFrom" | "approvedTo">, scoreMax: number) {
  const errors: PoolFilterErrors = {};
  const scores = [state.scoreMin, state.scoreMax].map((value) => (value.trim() === "" ? null : Number(value)));
  const [min, max] = scores;
  if (scores.some((value) => value !== null && (!Number.isFinite(value) || value < 0 || value > scoreMax))) {
    errors.score = `Enter scores from 0 to ${scoreMax}. The score filter isn't applied until then.`;
  } else if (min !== null && max !== null && min > max) {
    errors.score = "The lowest score can't be above the highest. The score filter isn't applied until you fix it.";
  }
  if (state.approvedFrom && state.approvedTo && state.approvedFrom > state.approvedTo) {
    errors.approved = "The start date can't be after the end date. The date filter isn't applied until you fix it.";
  }
  return errors;
}

/**
 * The query for one page of the pool: page and limit, every filter that is
 * set and valid, and sort/order unless they are the default. An invalid score
 * or date range is left out (and reported in `errors`).
 */
export function poolQuery(state: PoolListState, scoreMax: number, pageSize: number) {
  const errors = poolFilterErrors(state, scoreMax);
  const params = new URLSearchParams({ page: String(state.page), limit: String(pageSize) });
  for (const key of POOL_FILTERS) {
    const value = state[key].trim();
    if (!value) continue;
    if (errors.score && (key === "scoreMin" || key === "scoreMax")) continue;
    if (errors.approved && (key === "approvedFrom" || key === "approvedTo")) continue;
    params.set(key, value);
  }
  const known = POOL_SORTS.some((item) => item.value === state.sort);
  const [sort, order] = (known ? state.sort : POOL_LIST_DEFAULTS.sort).split(":");
  if (sort !== "priority") params.set("sort", sort);
  if (order !== "desc") params.set("order", order);
  return { params, errors };
}

/**
 * The page to go back to when the current page came back empty but isn't the
 * first (a row action emptied the last page), or null to stay. With no pages
 * left at all, the first page.
 */
export function poolStepBack(
  data: { items: unknown[]; pagination: { totalPages: number } } | null | undefined,
  page: number,
): number | null {
  if (!data || data.items.length > 0 || page <= 1) return null;
  const last = Math.max(1, data.pagination.totalPages || 1);
  return Math.min(page - 1, last);
}
