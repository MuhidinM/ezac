import type { BadgeTone } from "@/components/ui/badge";
import type { RangeKey } from "@/lib/backoffice/date-range";
import { rangeDates } from "@/lib/backoffice/date-range";
import type { PayloadField } from "@/lib/zakat/redact";

export type PaymentStatus =
  | "AWAITING_CONFIRMATION"
  | "OTP_SENT"
  | "AWAITING_PAYMENT"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";

/** Back-office payment item. Fields with no value are left out by the API. */
export type ZakatPayment = {
  paymentId: string;
  status: PaymentStatus;
  /** "ethqr" (QR) or "coopbank" (the old Coop account flow). */
  methodCode?: "ethqr" | "coopbank" | string;
  zakatType?: string;
  /** What was paid. */
  amountEtb: number;
  /** Only when the donor paid another amount than the QR asked for. */
  issuedAmountEtb?: number;
  causeId?: string;
  causeTitle?: string;
  payerType?: "guest" | "registered" | string;
  keycloakSub?: string;
  payerFullName?: string;
  payerPhone?: string;
  debitAccount?: string;
  accountHolderName?: string;
  creditAccount?: string;
  messageId?: string;
  providerReference?: string;
  failureReason?: string;
  resolvedBy?: string;
  resolutionNote?: string;
  certificateId?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt?: string;
  /** QR payments: the order id the QR carries (equal to paymentId; absent on old QR payments). The QR content itself is dropped by the BFF. */
  ethqrOrderId?: string;
  /** From the bank once paid. */
  paidByName?: string;
  paidFromBank?: string;
  bankPaidAt?: string;
  /** How often, and when last, the payment was checked with EthQR. */
  qrCheckCount?: number;
  qrLastCheckedAt?: string;
  /** Shown while the payment is open. */
  expiresAt?: string;
  /** Requested from the backend (§20); the id in resolvedBy is shown until it comes. */
  resolvedByName?: string;
  /**
   * Set by the BFF in place of the raw bank answer (lib/zakat/redact.ts): its
   * status, amounts and references, and whether EthQR said it was a sandbox payment.
   */
  bankAnswer?: PayloadField[];
  sandbox?: boolean;
};

export type PaymentSummary = {
  from: string | null;
  to: string | null;
  totalCount: number;
  succeededCount: number;
  succeededAmountEtb: number;
  needsChecking: number;
  byStatus: { status: PaymentStatus; count: number; amountEtb: number }[];
};

export const PAYMENT_STATUSES: { value: PaymentStatus; label: string; tone: BadgeTone }[] = [
  { value: "AWAITING_CONFIRMATION", label: "Started", tone: "neutral" },
  { value: "OTP_SENT", label: "Waiting for code", tone: "info" },
  { value: "AWAITING_PAYMENT", label: "Waiting for payment", tone: "info" },
  { value: "PROCESSING", label: "Needs checking", tone: "warning" },
  { value: "SUCCEEDED", label: "Paid", tone: "success" },
  { value: "FAILED", label: "Failed", tone: "danger" },
  { value: "CANCELLED", label: "Cancelled", tone: "neutral" },
  { value: "EXPIRED", label: "Expired", tone: "neutral" },
];

const STALE_MS = 15 * 60_000;

export function isQr(payment: Pick<ZakatPayment, "methodCode">) {
  return payment.methodCode === "ethqr";
}

/** QR payments still open or expired: EthQR can be asked again ("Check now") or they can be confirmed by hand. */
export function isOpenQr(payment: Pick<ZakatPayment, "status" | "methodCode">) {
  return isQr(payment) && (payment.status === "AWAITING_PAYMENT" || payment.status === "EXPIRED");
}

/** The server keeps asking EthQR about a QR payment until this long after the QR expires. */
export const QR_CHECK_WINDOW_MS = 24 * 60 * 60_000;

export type QrCloseBlock =
  /** The donor can still pay, or the server is still checking, until `until` (ms). */
  | { reason: "still-checking"; until: number }
  /** "Check now" hasn't been run in this sheet yet. */
  | { reason: "check-first" };

/**
 * Why an open QR payment can't be closed as "Not paid" yet, or null when it
 * can. Closing it while the QR can still be paid, or while the server is
 * still checking it (until 24 hours after expiry), could turn away a real
 * payment (go-live audit gap-r1-1-2), so it waits for that and for one
 * "Check now". Backend §6 asks payment-service to refuse it too.
 */
export function qrNotPaidBlock(
  payment: Pick<ZakatPayment, "status" | "methodCode" | "expiresAt">,
  now: number,
  checkedNow: boolean,
): QrCloseBlock | null {
  if (!isOpenQr(payment)) return null;
  const expires = payment.expiresAt ? Date.parse(payment.expiresAt) : Number.NaN;
  if (Number.isFinite(expires) && now < expires + QR_CHECK_WINDOW_MS) {
    return { reason: "still-checking", until: expires + QR_CHECK_WINDOW_MS };
  }
  if (!checkedNow) return { reason: "check-first" };
  return null;
}

/**
 * Whether a finished "Check now" counts for qrNotPaidBlock: EthQR answered
 * (`error` null), or it can't be asked about this payment at all (409, a QR
 * made before automatic confirmation). A call still running, or one that
 * failed (offline, timeout, server error), doesn't: EthQR wasn't asked.
 */
export function checkCountsForNotPaid(error: { status: number } | null): boolean {
  return error === null || error.status === 409;
}

/** Payments an admin can settle by hand: anything needing checking, and open or expired QR payments. */
export function canResolve(payment: Pick<ZakatPayment, "status" | "methodCode">) {
  return payment.status === "PROCESSING" || isOpenQr(payment);
}

/**
 * Old Coop-flow payments still open after 15 minutes can no longer finish, so
 * they show as expired. QR payments carry their own expiry and status.
 */
export function displayStatus(payment: Pick<ZakatPayment, "status" | "createdAt">, now: number) {
  const open = payment.status === "AWAITING_CONFIRMATION" || payment.status === "OTP_SENT";
  const status: PaymentStatus = open && now - new Date(payment.createdAt).getTime() > STALE_MS ? "EXPIRED" : payment.status;
  return PAYMENT_STATUSES.find((item) => item.value === status) ?? { value: status, label: status, tone: "neutral" as const };
}

/**
 * The payments API filters on creation time with ISO timestamps (Addis
 * Ababa, +03:00): `from` inclusive, `to` exclusive, so `to` is the day after.
 */
export function paymentRangeQuery(key: RangeKey) {
  const { from, to } = rangeDates(key);
  const end = new Date(`${to}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 1);
  const toNext = end.toISOString().slice(0, 10);
  return `from=${encodeURIComponent(`${from}T00:00:00+03:00`)}&to=${encodeURIComponent(`${toNext}T00:00:00+03:00`)}`;
}

/** The commission's receiving account with spaces and dashes removed, as it is saved. */
export function cleanReceivingAccount(value: string): string {
  return value.replace(/[\s-]/g, "");
}

/**
 * Why a receiving account number can't be saved, or null when it can. Blank is
 * allowed (payments stay off); otherwise 6–20 digits, the payment-service rule
 * (logic-backoffice-19).
 */
export function receivingAccountProblem(value: string): string | null {
  const digits = cleanReceivingAccount(value);
  if (!digits) return null;
  if (!/^\d+$/.test(digits)) return "Use digits only.";
  if (digits.length < 6 || digits.length > 20) return "Enter 6 to 20 digits.";
  return null;
}
