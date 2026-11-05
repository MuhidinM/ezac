import type { BadgeTone } from "@/components/ui/badge";
import { formatEtb } from "@/lib/backoffice/format";

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
  updatedAt?: string | null;
};

export type BankCallOperation = "VERIFY_ACCOUNT" | "TRANSFER" | "PUSH_PAYMENT";
export type BankCallOutcome = "SUCCESS" | "DECLINED" | "UNKNOWN" | "ERROR";

/** One call made to the bank for a payout (account numbers masked). */
export type BankCall = {
  callId: string;
  operation: BankCallOperation;
  url?: string | null;
  messageId?: string | null;
  httpStatus?: number | null;
  outcome: BankCallOutcome;
  durationMs?: number | null;
  request?: unknown;
  response?: unknown;
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
  MATCH: { label: "Names match", tone: "success", hint: "Every word of the shorter name is in the longer one." },
  MISMATCH: { label: "Names differ", tone: "danger", hint: "Compare both names before paying." },
  NOT_CHECKED: { label: "Not checked", tone: "warning", hint: "The other bank's account couldn't be looked up." },
};

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
