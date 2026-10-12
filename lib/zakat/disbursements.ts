import type { BadgeTone } from "@/components/ui/badge";

/** Payouts from the commission account to pooled households (WEB-ADMIN-ZAKAT-GUIDE §11). */

export type DisbursementStatus = "AWAITING_CONFIRMATION" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELLED" | "EXPIRED";

export type NameCheck = "MATCH" | "MISMATCH" | "NOT_CHECKED";

export type Rail = "COOP" | "IPS";

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
  debitAccount?: string | null;
  debitAccountName?: string | null;
  amountEtb: number;
  note?: string | null;
  messageId?: string | null;
  providerReference?: string | null;
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
  AMOUNT_OUT_OF_RANGE: "The amount is above the maximum payout.",
  NAME_MISMATCH_NOT_ACKNOWLEDGED: "Tick the box to confirm you checked the names.",
  PAYOUT_EXPIRED: "This payout wasn't confirmed within 15 minutes. Prepare it again.",
  PAYMENTS_UNAVAILABLE: "The commission account isn't set up. Check Zakat settings.",
  BANK_UNAVAILABLE: "The bank can't be reached right now. Try again shortly.",
};

/** Matches a known code in the error's code or message; falls back to the message. */
export function payoutErrorMessage(code: string | null, message: string) {
  const key = code && ERROR_MESSAGES[code] ? code : Object.keys(ERROR_MESSAGES).find((item) => message.includes(item));
  return key ? ERROR_MESSAGES[key] : message;
}
