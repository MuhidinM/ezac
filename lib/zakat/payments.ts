import type { BadgeTone } from "@/components/ui/badge";
import type { RangeKey } from "@/lib/backoffice/date-range";
import { rangeDates } from "@/lib/backoffice/date-range";

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
  /** "ethqr" for QR payments; Coop account payments may leave it out. */
  methodCode?: string;
  zakatType?: string;
  amountEtb: number;
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
  providerResponse?: string;
  failureReason?: string;
  resolvedBy?: string;
  resolutionNote?: string;
  certificateId?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt?: string;
  /** QR payments: the EMV payload shown to the donor, and when it stops being payable. */
  qrPayload?: string;
  expiresAt?: string;
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
  { value: "AWAITING_PAYMENT", label: "QR: to confirm", tone: "warning" },
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

/**
 * Payments an admin can settle by hand: PROCESSING Coop payments, and QR payments
 * still waiting or expired (EthQR doesn't report which QR was paid yet).
 */
export function canResolve(payment: Pick<ZakatPayment, "status" | "methodCode">) {
  if (payment.status === "PROCESSING") return true;
  return isQr(payment) && (payment.status === "AWAITING_PAYMENT" || payment.status === "EXPIRED");
}

/** Open payments older than 15 minutes can no longer finish, so they show as expired. */
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
