import type { BadgeTone } from "@/components/ui/badge";
import { formatEtb } from "@/lib/backoffice/format";
import type { PayloadField } from "@/lib/zakat/redact";

/** Payouts from the Zakat or Awqaf fund account to pooled households (WEB-ADMIN-ZAKAT-GUIDE §11). */

export type DisbursementStatus = "AWAITING_CONFIRMATION" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELLED" | "EXPIRED";

export type NameCheck = "MATCH" | "PARTIAL" | "MISMATCH" | "NOT_CHECKED";

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

/**
 * Households are paid from the Zakat fund only for now (400 FUND_NOT_ALLOWED
 * on WAQF), until finance and the Shari'ah board send the written rule.
 */
export const PAYOUT_FUND: Fund = "ZAKAT";

/** Per-payout limits and the day's cap (Addis Ababa day), sent with AMOUNT_OUT_OF_RANGE and DAILY_CAP_REACHED. */
export const PAYOUT_MIN_ETB = 0.01;
export const PAYOUT_MAX_ETB = 1_000_000;

export type FundAccount = {
  fund: Fund;
  label: string;
  /** Masked to the last 4 digits; left out when no account is set. */
  accountNumber?: string | null;
  accountName?: string | null;
  /** The holder name Coop Bank returned for the account. */
  bankHolderName?: string | null;
  /** When Coop Bank confirmed the account. */
  verifiedAt?: string | null;
  /** True only after Coop Bank returned the holder name: payouts can be paid from it. */
  ready: boolean;
};

export type FundAccounts = {
  zakat: FundAccount;
  waqf: FundAccount;
  updatedBy?: string | null;
  updatedByName?: string | null;
  updatedAt?: string | null;
  /** The fund accounts' own version (not the payment settings'); a stale one gives 409 VERSION_CONFLICT. */
  version?: number | null;
};

export type FundKey = "zakat" | "waqf";

/** The editable part of one fund account. */
export type FundAccountInput = { accountNumber: string; accountName: string };

export type FundAccountChange = {
  field: "accountNumber" | "accountName";
  from: string;
  to: string;
  /** An account number left blank: that fund can't pay out any more. */
  cleared: boolean;
};

/**
 * What saving one fund account would change, field by field (blank values
 * compare as empty). Shown before saving, since payouts are paid from these
 * accounts and a blank number takes the fund out of use.
 */
export function fundAccountChanges(before: FundAccount, after: FundAccountInput): FundAccountChange[] {
  const changes: FundAccountChange[] = [];
  for (const field of ["accountNumber", "accountName"] as const) {
    const from = (before[field] ?? "").trim();
    const to = after[field].trim();
    if (from === to) continue;
    changes.push({ field, from, to, cleared: field === "accountNumber" && from !== "" && to === "" });
  }
  return changes;
}

/**
 * The PUT /funds body for one fund: only that fund is sent (a fund left out
 * is kept). An unchanged account number is left out, so the account and its
 * bank check stay and only the name changes; "" clears it; a new number is
 * looked up with Coop Bank. `version` guards against someone else's save.
 */
export function fundAccountBody(key: FundKey, before: FundAccount, after: FundAccountInput, version: number | null | undefined) {
  const number = after.accountNumber.trim();
  const keepNumber = number === (before.accountNumber ?? "").trim() && number !== "";
  return {
    [key]: {
      ...(keepNumber ? {} : { accountNumber: number }),
      accountName: after.accountName.trim(),
    },
    ...(version != null ? { version } : {}),
  };
}

/** How a fund account stands: verified with Coop Bank, set but not verified, or not set. */
export function fundAccountState(account: Pick<FundAccount, "ready" | "accountNumber">): {
  label: string;
  tone: BadgeTone;
  hint: string | null;
} {
  if (account.ready) return { label: "Verified", tone: "success", hint: null };
  if (account.accountNumber) {
    return {
      label: "Not verified",
      tone: "warning",
      hint: "Coop Bank hasn't confirmed this account, so payouts can't be paid from it. Save it again to retry the check.",
    };
  }
  return { label: "Not set", tone: "warning", hint: "No account, so payouts can't be paid from this fund." };
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
  /** The household's registered name: the bank's name is compared with this one. */
  registeredName?: string | null;
  branchName?: string | null;
  region?: string | null;
  rail: Rail;
  bankCode?: string | null;
  bankName?: string | null;
  destinationBankCode?: string | null;
  creditAccount: string;
  accountHolderName?: string | null;
  /** The account holder's name as the bank gave it. */
  verifiedName?: string | null;
  nameCheck: NameCheck;
  /** The confirming admin ticked that they compared the names, with this reason. */
  nameCheckAcknowledged?: boolean | null;
  nameCheckReason?: string | null;
  /** When the household's bank account last changed, and by whom. */
  bankAccountChangedAt?: string | null;
  bankAccountChangedByName?: string | null;
  /** Another household has the same account. */
  sharedAccount?: boolean | null;
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
  createdByName?: string | null;
  confirmedByName?: string | null;
  resolvedByName?: string | null;
  confirmedAt?: string | null;
  paidAt?: string | null;
  /** false on a paid payout until the pool record catches up (retried every minute). */
  poolUpdated?: boolean;
  /** 24 hours after prepare: a prepared payout can't be confirmed after this. */
  expiresAt?: string | null;
  /** AWAITING_CONFIRMATION or PROCESSING: an admin has to act on it. */
  needsAction?: boolean | null;
  /** The server's clock when it answered, to count the time left without trusting the browser's clock. */
  serverTime?: string | null;
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
  MATCH: { label: "Names match", tone: "success", hint: "The bank's name matches the household's registered name." },
  PARTIAL: {
    label: "Names partly match",
    tone: "warning",
    hint: "Some words are the same, but not all (or one of the names is a single word). Compare them before confirming.",
  },
  MISMATCH: { label: "Names differ", tone: "danger", hint: "The bank's name doesn't match the registered name. Compare them before confirming." },
  NOT_CHECKED: { label: "Name not checked", tone: "warning", hint: "The bank didn't give a name for this account." },
};

/** A missing name check, or a value this screen doesn't know yet, counts as "Not checked". */
export function nameCheckOf(payout: Pick<Disbursement, "nameCheck">) {
  return NAME_CHECK[payout.nameCheck] ?? NAME_CHECK.NOT_CHECKED;
}

/** Anything but MATCH needs the confirming admin to tick the box and give a reason. */
export function needsNameAcknowledgement(payout: Pick<Disbursement, "nameCheck">) {
  return payout.nameCheck !== "MATCH";
}

/**
 * The confirm body: none for MATCH, otherwise `{acknowledged: true, reason}`
 * (400 NAME_MISMATCH_NOT_ACKNOWLEDGED without both).
 */
export function confirmBody(payout: Pick<Disbursement, "nameCheck">, reason: string) {
  return needsNameAcknowledgement(payout) ? { acknowledged: true, reason: reason.trim() } : {};
}

/** True when the same staff account did both steps (no second person checked it). */
export function sameStaff(a: string | null | undefined, b: string | null | undefined) {
  return Boolean(a && b && a === b);
}

/**
 * The admin who prepared a payout can't confirm or settle it (403
 * SAME_APPROVER): another admin must. True when `myId` prepared it.
 */
export function preparedByMe(payout: Pick<Disbursement, "createdBy">, myId: string | null | undefined) {
  return sameStaff(payout.createdBy, myId);
}

/** A bank account changed within this many days is pointed out before paying. */
export const RECENT_BANK_CHANGE_DAYS = 30;

/** Whether the household's bank account changed within RECENT_BANK_CHANGE_DAYS of `now`. */
export function bankChangedRecently(changedAt: string | null | undefined, now: number) {
  if (!changedAt) return false;
  const at = Date.parse(changedAt);
  return Number.isFinite(at) && now - at < RECENT_BANK_CHANGE_DAYS * 24 * 60 * 60_000;
}

/** "5 h 12 min left", "40 min left", "Less than a minute left"; null when the time is up. */
export function timeLeftText(ms: number) {
  if (ms <= 0) return null;
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "Less than a minute left";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours > 0 ? `${hours} h ${rest} min left` : `${minutes} min left`;
}

/** Milliseconds left to confirm a prepared payout; null when not prepared or not known. */
export function payoutTimeLeft(payout: Pick<Disbursement, "status" | "expiresAt">, now: number | null) {
  if (payout.status !== "AWAITING_CONFIRMATION" || !payout.expiresAt || now === null) return null;
  const at = Date.parse(payout.expiresAt);
  return Number.isFinite(at) ? at - now : null;
}

/** Lines for the payout record that a reviewer should notice: one person doing two steps, a name check overridden. */
export function payoutAuditNotes(
  payout: Pick<Disbursement, "createdBy" | "confirmedBy" | "resolvedBy" | "confirmedAt" | "nameCheck" | "nameCheckReason">,
): string[] {
  const notes: string[] = [];
  if (sameStaff(payout.createdBy, payout.confirmedBy)) notes.push("Prepared and paid by the same person.");
  if (sameStaff(payout.createdBy, payout.resolvedBy) || sameStaff(payout.confirmedBy, payout.resolvedBy)) {
    notes.push("Settled by the person who prepared or paid it.");
  }
  if (payout.confirmedAt && payout.nameCheck !== "MATCH") {
    const what =
      payout.nameCheck === "NOT_CHECKED"
        ? "Paid without a name from the bank."
        : payout.nameCheck === "PARTIAL"
          ? "Paid although the names only partly matched."
          : "Paid although the names differed.";
    notes.push(payout.nameCheckReason ? `${what} Reason given: ${payout.nameCheckReason}` : what);
  }
  return notes;
}

export const RAIL_LABEL: Record<Rail, string> = {
  COOP: "Coop Bank transfer",
  IPS: "Transfer to another bank",
};

/** Plain-language messages for the payout error codes. */
const ERROR_MESSAGES: Record<string, string> = {
  NOT_POOLED: "This household isn't in the pool any more, or its account changed. The payout was not sent.",
  DISBURSEMENT_EXISTS: "This household already has a payout waiting, in progress or paid.",
  NO_BANK_ACCOUNT: "There's no bank account on file for this household.",
  BANK_NOT_SUPPORTED: "This bank can't be paid yet (no IPS code configured).",
  ACCOUNT_NOT_FOUND: "The bank doesn't know this account number.",
  AMOUNT_OUT_OF_RANGE: "The amount is outside the allowed payout range.",
  DAILY_CAP_REACHED: "This payout would go over today's payout limit.",
  FUND_NOT_ALLOWED: "Households are paid from the Zakat fund only.",
  NAME_MISMATCH_NOT_ACKNOWLEDGED: "Tick the box and give a reason to confirm you compared the names.",
  PAYOUT_EXPIRED: "This payout wasn't confirmed within 24 hours, so it expired. Prepare a new one from the pool.",
  SAME_APPROVER: "Another admin must do this step.",
  IDEMPOTENCY_KEY_REUSED: "This payout request was already used for a different payout. Close the dialog and start again.",
  FUND_ACCOUNT_NOT_SET: "The Zakat fund has no account set, or it changed. Set the fund account on the Payouts page and prepare again.",
  FUND_ACCOUNT_NOT_VERIFIED: "Coop Bank hasn't confirmed the Zakat fund account yet. Save it again on the Payouts page, then prepare again.",
  BANK_CHANGE_PENDING: "A change to this household's bank account is waiting for another admin. Approve or reject it first.",
  PAYMENTS_UNAVAILABLE: "The fund account isn't set up. Set the fund accounts on the Payouts page.",
  BANK_UNAVAILABLE: "The bank can't be reached right now. Try again shortly.",
};

/** The known payout error code in the error's code or message, if any. */
export function payoutErrorCode(code: string | null, message: string): string | null {
  if (code && ERROR_MESSAGES[code]) return code;
  return Object.keys(ERROR_MESSAGES).find((item) => message.includes(item)) ?? null;
}

function limit(data: Record<string, unknown>, key: string) {
  const value = data[key];
  const number = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
  return Number.isFinite(number) ? number : null;
}

/**
 * The limits sent with AMOUNT_OUT_OF_RANGE and DAILY_CAP_REACHED
 * (`data: {min, max, dailyCap, usedToday}`) in words, or null when none came.
 */
export function payoutLimitsText(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  const min = limit(record, "min");
  const max = limit(record, "max");
  const cap = limit(record, "dailyCap");
  const used = limit(record, "usedToday");
  const parts: string[] = [];
  if (min !== null && max !== null) parts.push(`Each payout must be between ${formatEtb(min)} and ${formatEtb(max)}.`);
  if (cap !== null && used !== null) {
    parts.push(`Today's limit is ${formatEtb(cap)}; ${formatEtb(used)} is already used, so ${formatEtb(Math.max(0, cap - used))} is left.`);
  } else if (cap !== null) {
    parts.push(`Today's limit is ${formatEtb(cap)}.`);
  }
  return parts.length ? parts.join(" ") : null;
}

/** Ends a sentence with a full stop so another can follow it. */
export function withStop(text: string) {
  return /[.!?]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`;
}

/** Matches a known code in the error's code or message; falls back to the message. */
export function payoutErrorMessage(code: string | null, message: string, data?: unknown) {
  const key = payoutErrorCode(code, message);
  if (!key) return message;
  if (key === "AMOUNT_OUT_OF_RANGE" || key === "DAILY_CAP_REACHED") {
    const limits = payoutLimitsText(data);
    // The backend's own sentence says which bound was crossed ("amountEtb must be at least 0.01").
    const lead =
      key === "AMOUNT_OUT_OF_RANGE" && message && !message.includes(key) ? message.replace(/^amountEtb\b/, "The amount") : ERROR_MESSAGES[key];
    return limits ? `${withStop(lead)} ${limits}` : lead;
  }
  return ERROR_MESSAGES[key];
}

export type PayoutListFilters = {
  status: string;
  rail: string;
  fund: string;
  /** Household name, assessment number, payout id or bank reference. */
  q: string;
  beneficiaryId: string;
  /** "true": every payout waiting for an admin, oldest first, whatever the other filters and dates. */
  needsAction: string;
  page: number;
};

/**
 * The payouts list query. With needsAction the backend ignores the other
 * filters and the dates, so they are left out and the screen says so.
 */
export function payoutListQuery(filters: PayoutListFilters, rangeParams: string, pageSize: number) {
  const params = new URLSearchParams(filters.needsAction === "true" ? "" : rangeParams);
  if (filters.needsAction === "true") {
    params.set("needsAction", "true");
  } else {
    for (const key of ["status", "rail", "fund", "beneficiaryId"] as const) {
      if (filters[key]) params.set(key, filters[key]);
    }
    if (filters.q.trim()) params.set("q", filters.q.trim());
  }
  params.set("page", String(filters.page));
  params.set("limit", String(pageSize));
  return params.toString();
}
