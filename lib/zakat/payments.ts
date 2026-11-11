import type { BadgeTone } from "@/components/ui/badge";
import { ApiError, errorData, errorMessage } from "@/lib/api/errors";
import type { RangeKey } from "@/lib/backoffice/date-range";
import { rangeDates } from "@/lib/backoffice/date-range";
import { formatDateTime } from "@/lib/beneficiary/format";

export type PaymentStatus =
  | "AWAITING_CONFIRMATION"
  | "OTP_SENT"
  | "AWAITING_PAYMENT"
  | "PROCESSING"
  /** Marked paid by hand; waits for a second ADMIN to approve or reject. */
  | "AWAITING_APPROVAL"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED"
  /** A paid payment withdrawn by an ADMIN: its certificate no longer verifies and it leaves every total. */
  | "VOIDED";

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
  /** Masked by payment-service, e.g. "+2519******44". */
  payerPhone?: string;
  /** Account numbers show their last 4 digits only. */
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
  /** QR payments: the order id the QR carries (equal to paymentId; absent on old QR payments). */
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
  resolvedByName?: string;
  /** True once a manual "Paid" was approved by a second ADMIN. */
  settledManually?: boolean;
  /** What the bank statement showed, entered with a manual "Paid". */
  amountReceived?: number;
  /** Who marked it paid by hand (step 1). */
  requestedBy?: string;
  requestedByName?: string;
  requestedAt?: string;
  /** Who approved the manual "Paid" (step 2). */
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  voidedBy?: string;
  voidedByName?: string;
  voidedAt?: string;
  voidReason?: string;
  /** Waiting for an ADMIN: needs checking, or a manual "Paid" to approve. */
  needsAction?: boolean;
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
  { value: "AWAITING_APPROVAL", label: "Waiting for approval", tone: "violet" },
  { value: "SUCCEEDED", label: "Paid", tone: "success" },
  { value: "FAILED", label: "Failed", tone: "danger" },
  { value: "CANCELLED", label: "Cancelled", tone: "neutral" },
  { value: "EXPIRED", label: "Expired", tone: "neutral" },
  { value: "VOIDED", label: "Voided", tone: "danger" },
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

/** Shown on 403 SAME_APPROVER: the admin who asked for a step can't also approve it. */
export const SAME_APPROVER_TEXT = "Another admin must do this step.";

/** A manual "Paid" waiting for a second ADMIN. */
export function awaitsApproval(payment: Pick<ZakatPayment, "status">) {
  return payment.status === "AWAITING_APPROVAL";
}

/** Only a paid payment can be voided. */
export function canVoid(payment: Pick<ZakatPayment, "status">) {
  return payment.status === "SUCCEEDED";
}

/**
 * True when the signed-in admin (`sub`, the id /me returns) marked this
 * payment paid: then another admin must approve or reject it.
 */
export function isOwnRequest(payment: Pick<ZakatPayment, "requestedBy">, sub: string | null | undefined) {
  return Boolean(sub && payment.requestedBy && payment.requestedBy === sub);
}

/**
 * Why the amount received can't be sent, or null when it can: a number above
 * 0 with at most 2 decimals, as on the bank statement.
 */
export function amountReceivedProblem(value: string): string | null {
  const text = value.trim();
  if (!text) return "Enter the amount on the bank statement.";
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return "Use a number with at most 2 decimals.";
  if (Number(text) <= 0) return "Must be more than 0.";
  return null;
}

/**
 * What to show when a manual "Paid" or "Not paid" fails. The two conflicts
 * payment-service explains with data get their own words; anything else is
 * the server's message.
 */
export function resolveErrorText(error: unknown): string {
  if (error instanceof ApiError && error.status === 409) {
    const data = errorData(error);
    if (error.code === "DUPLICATE_REQUEST" && typeof data.paymentId === "string") {
      return `That bank reference already confirmed payment ${data.paymentId}. One bank transaction confirms one payment.`;
    }
    if (error.code === "NOT_EXPIRED") {
      const until = typeof data.expiresAt === "string" ? formatDateTime(data.expiresAt) : null;
      return until
        ? `The QR can still be paid until ${until}. Close it as not paid only after that.`
        : "The QR can still be paid. Close it as not paid only after it expires.";
    }
  }
  return errorMessage(error, "Couldn't settle the payment");
}

export type PaymentListFilters = {
  range: RangeKey;
  status: string;
  /** "ethqr", "coopbank" or "" for both. */
  method: string;
  /** Payer name or phone, payment id, bank reference or certificate id. */
  q: string;
  /** Only payments waiting for an ADMIN, oldest first; dates and status are ignored. */
  needsAction: boolean;
  page: number;
  limit: number;
};

/** The query string for GET /admin/zakat-payments. */
export function paymentListQuery(filters: PaymentListFilters): string {
  const params = new URLSearchParams();
  if (filters.needsAction) {
    params.set("needsAction", "true");
  } else {
    const { from, to } = paymentDatesBounds(rangeDates(filters.range));
    params.set("from", from);
    params.set("to", to);
    if (filters.status) params.set("status", filters.status);
  }
  if (filters.method) params.set("methodCode", filters.method);
  const q = filters.q.trim();
  if (q) params.set("q", q);
  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));
  return params.toString();
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
  return paymentDatesQuery(rangeDates(key));
}

/** The same for explicit YYYY-MM-DD dates (e.g. the previous period). */
export function paymentDatesQuery(dates: { from: string; to: string }) {
  const { from, to } = paymentDatesBounds(dates);
  return `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
}

function paymentDatesBounds({ from, to }: { from: string; to: string }) {
  const end = new Date(`${to}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 1);
  const toNext = end.toISOString().slice(0, 10);
  return { from: `${from}T00:00:00+03:00`, to: `${toNext}T00:00:00+03:00` };
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
