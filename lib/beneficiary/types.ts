import type { RiskCategory } from "@/lib/api/backoffice-types";
import type { BeneficiaryDetail, BeneficiaryListItem } from "@/lib/api/types";

/** Consent to data processing, recorded by the officer at registration or assessment. */
export type HouseholdConsent = {
  dataProcessingConsent?: boolean | null;
  noticeVersion?: string | null;
  consentedAt?: string | null;
  recordedBy?: string | null;
  recordedByName?: string | null;
  /** REGISTRATION or ASSESSMENT. */
  context?: string | null;
  assessmentId?: string | null;
};

/**
 * The staff household record with the fields beneficiary-service added in
 * the 10 and 11 November releases. Fields without a value are left out.
 */
export type HouseholdDetail = BeneficiaryDetail & {
  /** Required on every PATCH; a stale one is 409 VERSION_CONFLICT. */
  version?: number | null;
  /** A change of the payout account waits for a second ADMIN. */
  pendingBankChange?: boolean | null;
  bankAccountChangedAt?: string | null;
  bankAccountChangedBy?: string | null;
  bankAccountChangedByName?: string | null;
  consent?: HouseholdConsent | null;
  score?: number | null;
  maxScore?: number | null;
  riskCategory?: RiskCategory | null;
  /**
   * Set by our BFF (not the backend) when a PATCH answered 202: the bank
   * change was stored as a request for a second ADMIN. The backend's message.
   */
  bankChangeRequestMessage?: string | null;
};

export type HouseholdListItem = BeneficiaryListItem & {
  scoringConfigVersion?: number | null;
};

/** `GET /payout-banks`: the banks a household can be paid into. */
export type PayoutBank = {
  code: string;
  name: string;
  available: boolean;
  /** A Java regex for the account number, e.g. ^\d{6,30}$. */
  accountNumberPattern?: string | null;
  ipsPayable?: boolean | null;
};

/** `GET /beneficiaries/{id}/lifecycle/moves`: one possible lifecycle change. */
export type LifecycleMove = {
  to: string;
  allowed: boolean;
  /** Why the move is not allowed now. */
  reason?: string | null;
  roles?: string[];
};

/** The one-time login of a household (create login, reset password). */
export type HouseholdCredentials = {
  username: string;
  initialPassword: string;
  passwordChangeRequired?: boolean;
};

export type BankChangeStatus = "PENDING" | "APPROVED" | "REJECTED";

export type BankChangeAccount = {
  bankCode?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  accountHolderName?: string | null;
};

/** `GET /admin/bank-change-requests`: a change of a locked payout account. */
export type BankChangeRequest = {
  id: string;
  beneficiaryId: string;
  beneficiaryName?: string | null;
  status: BankChangeStatus;
  current?: BankChangeAccount | null;
  requested?: BankChangeAccount | null;
  reason?: string | null;
  /** IN_POOL, ASSESSMENT_APPROVED or FAST_TRACK. */
  lockedBecause?: string | null;
  requestedBy?: string | null;
  requestedByName?: string | null;
  requestedAt?: string | null;
  decidedBy?: string | null;
  decidedByName?: string | null;
  decidedAt?: string | null;
  decisionReason?: string | null;
  version?: number | null;
};
