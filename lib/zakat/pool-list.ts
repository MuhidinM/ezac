import type { DuplicateStatus, PoolEntry, PoolStatus } from "@/lib/api/backoffice-types";
import type { VerificationStatus } from "@/lib/api/types";

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

/**
 * The list's filters without paging or order, for GET /admin/pool/counts
 * (one call for every tab's count) and GET /admin/pool/export (the whole
 * filtered list as CSV).
 */
export function poolFilterParams(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params);
  for (const key of ["page", "limit", "sort", "order"]) next.delete(key);
  return next;
}

/** GET /admin/pool/counts: rows per pool status under the current filters. */
export type PoolCounts = Partial<Record<PoolStatus, number>>;

/**
 * A pool row with the fields beneficiary-service added on 10 and 11 November.
 * `openPayout` is left out when payment-service didn't answer in time: that
 * means "unknown", never "no payout".
 */
export type PoolRow = PoolEntry & {
  verificationStatus?: VerificationStatus | null;
  duplicateStatus?: DuplicateStatus | null;
  hasBankAccount?: boolean | null;
  pendingBankChange?: boolean | null;
  openPayout?: boolean | null;
  scoringConfigVersion?: number | null;
  sharedBankAccountCount?: number | null;
  bankAccountChangedAt?: string | null;
  bankAccountChangedByName?: string | null;
  poolStatusByName?: string | null;
};

/** Whether a payout is open for a pooled row; "unknown" when the pool couldn't ask payment-service. */
export function openPayoutState(row: Pick<PoolRow, "openPayout">): "open" | "none" | "unknown" {
  if (row.openPayout === true) return "open";
  if (row.openPayout === false) return "none";
  return "unknown";
}

/** The household has a bank account on file (the row's flag, or the account itself on older rows). */
export function hasBankAccount(row: Pick<PoolRow, "hasBankAccount" | "bankAccount">) {
  return row.hasBankAccount ?? Boolean(row.bankAccount?.accountNumber);
}

/** The reasons POST /admin/pool gives for a household it won't pool (409 NOT_ELIGIBLE). */
export const NOT_ELIGIBLE_REASONS: Record<string, string> = {
  NOT_VERIFIED: "Not verified yet. Verify the household first.",
  DUPLICATE_UNRESOLVED: "Possible duplicate. Review it first.",
  CONFIRMED_DUPLICATE: "Confirmed duplicate.",
  NO_BANK_ACCOUNT: "No bank account on file.",
  LIFECYCLE_INACTIVE: "The household is inactive.",
  LIFECYCLE_GRADUATED: "The household has graduated.",
  LIFECYCLE_EXITED: "The household has exited.",
};

export function notEligibleText(reason: string) {
  return NOT_ELIGIBLE_REASONS[reason] ?? reason;
}

/**
 * Why a row on the "Awaiting pool" tab can't be pooled, or null when it can,
 * from the row's own fields. The server checks again and refuses the whole
 * request (409 NOT_ELIGIBLE) when one household isn't eligible.
 */
export function poolBlock(row: Pick<PoolRow, "verificationStatus" | "duplicateStatus" | "hasBankAccount" | "bankAccount">): string | null {
  const reasons: string[] = [];
  if (row.verificationStatus && row.verificationStatus !== "verified") reasons.push(NOT_ELIGIBLE_REASONS.NOT_VERIFIED);
  if (row.duplicateStatus === "POTENTIAL") reasons.push(NOT_ELIGIBLE_REASONS.DUPLICATE_UNRESOLVED);
  if (row.duplicateStatus === "CONFIRMED_DUPLICATE") reasons.push(NOT_ELIGIBLE_REASONS.CONFIRMED_DUPLICATE);
  if (!hasBankAccount(row)) reasons.push(NOT_ELIGIBLE_REASONS.NO_BANK_ACCOUNT);
  return reasons.length ? reasons.join(" ") : null;
}

function text(value: unknown) {
  return typeof value === "string" ? value : typeof value === "number" ? String(value) : null;
}

/**
 * The per-household reasons of a 409 NOT_ELIGIBLE, by beneficiary id. The
 * backend sends them as `errors: [{beneficiaryId, reason}]`; the BFF may pass
 * them in `data` (as the list, or as `data.errors`) or as field errors keyed
 * by the beneficiary id, so every shape is read.
 */
export function notEligibleByHousehold(data: unknown, fieldErrors: { field: string; message: string }[] = []) {
  const record = data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : null;
  const list = Array.isArray(data) ? data : Array.isArray(record?.errors) ? record.errors : Array.isArray(record?.households) ? record.households : [];
  const result: Record<string, string[]> = {};
  const add = (id: string | null, reason: string | null) => {
    if (!id || !reason) return;
    (result[id] ??= []).push(notEligibleText(reason));
  };
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const entry = item as Record<string, unknown>;
    add(text(entry.beneficiaryId), text(entry.reason) ?? text(entry.code) ?? text(entry.message));
  }
  for (const error of fieldErrors) {
    const id = error.field.replace(/^beneficiaryId[.:\[]?|\]$/g, "");
    if (/^\d+$/.test(id)) add(id, error.message);
  }
  return result;
}
