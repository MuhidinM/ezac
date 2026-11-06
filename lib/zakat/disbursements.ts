import type { BadgeTone } from "@/components/ui/badge";
import { formatEtb } from "@/lib/backoffice/format";
import type { PayloadField } from "@/lib/zakat/redact";

/** Payouts from the Zakat or Awqaf fund account to pooled households (WEB-ADMIN-ZAKAT-GUIDE §11). */

export type DisbursementStatus = "AWAITING_CONFIRMATION" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELLED" | "EXPIRED";

export type NameCheck = "MATCH" | "MISMATCH" | "NOT_CHECKED";

export type Rail = "COOP" | "IPS";

/** The fund a payout is paid from, chosen on each payout. */
export type Fund = "ZAKAT" | "WAQF";

export const FUNDS: { value: Fund; label: string }[] = [
  { value: "ZAKAT", label: "Zakat" },
  { value: "WAQF", label: "Awqaf" },
];

export function fundLabel(fund: Fund | null | undefined) {
  return FUNDS.find((item) => item.value === fund)?.label ?? fund ?? "—";
}

export type FundAccount = {
  fund: Fund;
  label: string;
  accountNumber: string | null;
  accountName: string | null;
  /** The name Coop Bank gives for the account; used when accountName is blank. */
  bankHolderName: string | null;
  ready: boolean;
};

export type FundAccounts = {
  zakat: FundAccount;
  waqf: FundAccount;
  updatedBy?: string | null;
  /** Requested from the backend (§20); the id is shown until it comes. */
  updatedByName?: string | null;
  updatedAt?: string | null;
};

/** The editable part of one fund account. */
export type FundAccountInput = { accountNumber: string; accountName: string };

export type FundAccountChange = {
  fund: Fund;
  field: "accountNumber" | "accountName";
  from: string;
  to: string;
  /** An account number left blank: that fund can't pay out any more. */
  cleared: boolean;
};

/**
 * What saving the fund accounts would change, field by field (blank values
 * compare as empty). Shown before saving, since payouts are paid from these
 * accounts and a blank number takes the fund out of use (logic-backoffice-6).
 */
export function fundAccountChanges(
  before: Pick<FundAccounts, "zakat" | "waqf">,
  after: { zakat: FundAccountInput; waqf: FundAccountInput },
): FundAccountChange[] {
  const changes: FundAccountChange[] = [];
  for (const [key, fund] of [
    ["zakat", "ZAKAT"],
    ["waqf", "WAQF"],
  ] as const) {
    for (const field of ["accountNumber", "accountName"] as const) {
      const from = (before[key][field] ?? "").trim();
      const to = after[key][field].trim();
      if (from === to) continue;
      changes.push({ fund, field, from, to, cleared: field === "accountNumber" && from !== "" && to === "" });
    }
  }
  return changes;
}

export type BankCallOperation ="VERIFY_ACCOUNT" | "TRANSFER" | "PUSH_PAYMENT";
export type BankCallOutcome = "SUCCESS" | "DECLINED" | "UNKNOWN" | "ERROR";

/**
 * One call made to the bank for a payout, as the BFF passes it on: the raw
 * URL and request and response bodies are replaced by the few fields staff
 * need (lib/zakat/redact.ts), with long digit runs masked.
 */
export type BankCall = {
  callId: string;
  operation: BankCallOperation;
  messageId?: string | null;
  httpStatus?: number | null;
  outcome: BankCallOutcome;
  durationMs?: number | null;
  /** Status, codes, messages and references picked from what was sent and what came back. */
  requestFields?: PayloadField[];
  responseFields?: PayloadField[];
  error?: string | null;
  correlationId?: string | null;
  at: string;
};

export const BANK_CALL_OUTCOME: Record<BankCallOutcome, BadgeTone> = {
  SUCCESS: "success",
  DECLINED: "danger",
  UNKNOWN: "warning",
  ERROR: "danger",
};

export const BANK_CALL_OPERATION: Record<BankCallOperation, string> = {
  VERIFY_ACCOUNT: "Account lookup",
  TRANSFER: "Coop transfer",
  PUSH_PAYMENT: "IPS payment",
};

export type Disbursement = {
  disbursementId: string;
  status: DisbursementStatus;
  source: "ASSESSMENT" | "WHITELIST";
  assessmentId?: string | null;
  whitelistEntryId?: string | null;
  assessmentNumber?: string | null;
  beneficiaryId: string;
  beneficiaryName?: string | null;
  branchName?: string | null;
  region?: string | null;
  rail: Rail;
  bankCode?: string | null;
  bankName?: string | null;
  destinationBankCode?: string | null;
  creditAccount: string;
  accountHolderName?: string | null;
  verifiedName?: string | null;
  nameCheck: NameCheck;
  fund?: Fund | null;
  debitAccount?: string | null;
  debitAccountName?: string | null;
  amountEtb: number;
  note?: string | null;
  messageId?: string | null;
  /** The bank's FT number. */
  providerReference?: string | null;
  /** IPS payouts only: extra references returned by the bank. */
  providerTransactionId?: string | null;
  providerMessageId?: string | null;
  creditedAccount?: string | null;
  bankSettledAt?: string | null;
  failureReason?: string | null;
  resolvedBy?: string | null;
  resolutionNote?: string | null;
  createdBy?: string | null;
  confirmedBy?: string | null;
  /** The names of the people above: requested from the backend (§20); the ids are shown until they come. */
  createdByName?: string | null;
  confirmedByName?: string | null;
  resolvedByName?: string | null;
  confirmedAt?: string | null;
  paidAt?: string | null;
  /** false on a paid payout until the pool record catches up (retried every minute). */
  poolUpdated?: boolean;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type DisbursementSummary = {
  from: string | null;
  to: string | null;
  totalCount: number;
  succeededCount: number;
  succeededAmountEtb: number;
  needsChecking: number;
  byStatus: { status: DisbursementStatus; count: number; amountEtb: number }[];
  paidByFund?: { fund: Fund; count: number; amountEtb: number }[];
};

export const DISBURSEMENT_STATUSES: { value: DisbursementStatus; label: string; tone: BadgeTone }[] = [
  { value: "AWAITING_CONFIRMATION", label: "Prepared", tone: "info" },
  { value: "PROCESSING", label: "Needs checking", tone: "warning" },
  { value: "SUCCEEDED", label: "Paid", tone: "success" },
  { value: "FAILED", label: "Failed", tone: "danger" },
  { value: "CANCELLED", label: "Cancelled", tone: "neutral" },
  { value: "EXPIRED", label: "Expired", tone: "neutral" },
];

export function disbursementStatus(status: DisbursementStatus) {
  return DISBURSEMENT_STATUSES.find((item) => item.value === status) ?? { value: status, label: status, tone: "neutral" as const };
}

export const NAME_CHECK: Record<NameCheck, { label: string; tone: BadgeTone; hint: string }> = {
  MATCH: {
    label: "Names match",
    tone: "success",
    hint: "The bank's name and the name on file share words: every word of the shorter one is in the longer one.",
  },
  MISMATCH: { label: "Names differ", tone: "danger", hint: "Compare both names before paying." },
  NOT_CHECKED: { label: "Not checked", tone: "warning", hint: "The other bank's account couldn't be looked up." },
};

/** A name's words, lower-cased, without punctuation. */
function nameWords(name: string | null | undefined) {
  return (name ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * The server's MATCH rule: every word of the shorter name is in the longer
 * one. Null when either name is blank (nothing to compare).
 */
export function namesAgree(a: string | null | undefined, b: string | null | undefined): boolean | null {
  const left = nameWords(a);
  const right = nameWords(b);
  if (left.length === 0 || right.length === 0) return null;
  const [shorter, longer] = left.length <= right.length ? [left, right] : [right, left];
  const pool = new Set(longer);
  return shorter.every((word) => pool.has(word));
}

/**
 * Why a "Names match" result still needs a second look, or null. The server
 * compares the bank's name with the free-text account holder name on file,
 * not the registered name, so a match proves little when that name has under
 * two words, or when the bank's name doesn't agree with the household's
 * registered name (go-live audit gap-r2-3-2). The real fix, a comparison with
 * the registered name and a "partial" state, is asked of payment-service (§3).
 */
export function weakMatchReason(
  payout: Pick<Disbursement, "nameCheck" | "accountHolderName" | "verifiedName">,
  registeredName: string | null | undefined,
): string | null {
  if (payout.nameCheck !== "MATCH") return null;
  if (nameWords(payout.accountHolderName).length < 2) {
    return "The name on file has fewer than two words, so “Names match” proves little.";
  }
  if (namesAgree(registeredName, payout.verifiedName) === false) {
    return "The name at the bank doesn't match the household's registered name.";
  }
  return null;
}

/**
 * Anything short of a clear match needs a tick before paying: "Names differ",
 * "Not checked" (no name came back at all) and a weak "Names match". The API
 * only enforces the tick for "Names differ" (§3, §32).
 */
export function needsNameAcknowledgement(
  payout: Pick<Disbursement, "nameCheck" | "accountHolderName" | "verifiedName">,
  registeredName: string | null | undefined,
) {
  return payout.nameCheck !== "MATCH" || weakMatchReason(payout, registeredName) !== null;
}

/** True when the same staff account did both steps (no second person checked it). */
export function sameStaff(a: string | null | undefined, b: string | null | undefined) {
  return Boolean(a && b && a === b);
}

/** Lines for the payout record that a reviewer should notice: one person doing two steps, a name check overridden. */
export function payoutAuditNotes(
  payout: Pick<Disbursement, "createdBy" | "confirmedBy" | "resolvedBy" | "confirmedAt" | "nameCheck">,
): string[] {
  const notes: string[] = [];
  if (sameStaff(payout.createdBy, payout.confirmedBy)) notes.push("Prepared and paid by the same person.");
  if (sameStaff(payout.createdBy, payout.resolvedBy) || sameStaff(payout.confirmedBy, payout.resolvedBy)) {
    notes.push("Settled by the person who prepared or paid it.");
  }
  if (payout.confirmedAt && payout.nameCheck === "MISMATCH") notes.push("Paid although the names differed: the person who paid ticked that they compared them.");
  if (payout.confirmedAt && payout.nameCheck === "NOT_CHECKED") notes.push("Paid without a name check from the bank.");
  return notes;
}

export const RAIL_LABEL: Record<Rail, string> = {
  COOP: "Coop internal transfer",
  IPS: "IPS interbank transfer",
};

/** Plain-language messages for the payout error codes. */
const ERROR_MESSAGES: Record<string, string> = {
  NOT_POOLED: "This household isn't in the pool any more.",
  DISBURSEMENT_EXISTS: "This household already has a payout waiting, in progress or paid.",
  NO_BANK_ACCOUNT: "There's no bank account on file for this household.",
  BANK_NOT_SUPPORTED: "This bank can't be paid yet (no IPS code configured).",
  ACCOUNT_NOT_FOUND: "The bank doesn't know this account number.",
  AMOUNT_OUT_OF_RANGE: "The amount is outside the allowed payout range.",
  NAME_MISMATCH_NOT_ACKNOWLEDGED: "Tick the box to confirm you checked the names.",
  PAYOUT_EXPIRED: "This payout wasn't confirmed within 15 minutes. Prepare it again.",
  IDEMPOTENCY_KEY_REUSED: "This payout request was already used for a different payout. Close the dialog and start again.",
  FUND_ACCOUNT_NOT_SET: "The chosen fund has no account set, or it changed. Set the fund accounts on the Payouts page and prepare again.",
  PAYMENTS_UNAVAILABLE: "The fund account isn't set up. Set the fund accounts on the Payouts page.",
  BANK_UNAVAILABLE: "The bank can't be reached right now. Try again shortly.",
};

/** The known payout error code in the error's code or message, if any. */
export function payoutErrorCode(code: string | null, message: string): string | null {
  if (code && ERROR_MESSAGES[code]) return code;
  return Object.keys(ERROR_MESSAGES).find((item) => message.includes(item)) ?? null;
}

function limit(data: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = data[key];
    const number = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
    if (Number.isFinite(number)) return number;
  }
  return null;
}

/**
 * "Enter between X and Y." from the limits sent with AMOUNT_OUT_OF_RANGE, or
 * null when the backend sent none (it doesn't yet; the field names are a guess at
 * the requested contract).
 */
export function amountRangeHint(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  const min = limit(record, ["minAmountEtb", "minAmount", "min"]);
  const max = limit(record, ["maxAmountEtb", "maxAmount", "max"]);
  if (min !== null && max !== null) return `Enter between ${formatEtb(min)} and ${formatEtb(max)}.`;
  if (max !== null) return `Enter at most ${formatEtb(max)}.`;
  if (min !== null) return `Enter at least ${formatEtb(min)}.`;
  return null;
}

/** Matches a known code in the error's code or message; falls back to the message. */
export function payoutErrorMessage(code: string | null, message: string, data?: unknown) {
  const key = payoutErrorCode(code, message);
  if (!key) return message;
  if (key === "AMOUNT_OUT_OF_RANGE") {
    const range = amountRangeHint(data);
    return range ? `${ERROR_MESSAGES[key]} ${range}` : ERROR_MESSAGES[key];
  }
  return ERROR_MESSAGES[key];
}
