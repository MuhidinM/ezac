import { ApiError, errorData } from "@/lib/api/errors";
import { CONSENT_NOTICE_VERSION } from "@/lib/registration/constants";

/** What `POST /staff/beneficiaries` answers (10 Nov release, C5). */
export type CreateBeneficiaryResponse = {
  id: string;
  /** The registration code used (assigned automatically for staff walk-ins). */
  bin?: string | null;
  username?: string | null;
  /**
   * The household's temporary password, shown once. Null when the answer is
   * a replay of an earlier attempt (same Idempotency-Key): it is never sent twice.
   */
  initialPassword?: string | null;
  passwordChangeRequired?: boolean;
};

/** The consent part of the registration body. */
export function registrationConsent() {
  return { dataProcessingConsent: true, noticeVersion: CONSENT_NOTICE_VERSION } as const;
}

/**
 * 409 ACCOUNT_EXISTS: the phone or email already belongs to a household.
 * Returns the field and that household's id, or null for any other error.
 */
export function accountExists(error: unknown): { field: string; beneficiaryId: string | null } | null {
  if (!(error instanceof ApiError) || error.status !== 409 || error.code !== "ACCOUNT_EXISTS") return null;
  const data = errorData(error);
  const field = typeof data.field === "string" && data.field ? data.field : (error.errors[0]?.field ?? "phone");
  const id = data.beneficiaryId;
  const beneficiaryId = typeof id === "string" || typeof id === "number" ? String(id) : null;
  return { field, beneficiaryId: beneficiaryId || null };
}

/**
 * Whether a retry after this error must reuse the same Idempotency-Key. The
 * backend keeps only successful answers, so after a clear refusal (4xx) the
 * officer may fix the form and send it as a new attempt. When the answer was
 * lost (offline, timeout, 5xx) or the first request is still running, the
 * household may already exist: the same key makes the retry return it
 * instead of registering it twice.
 */
export function keepIdempotencyKey(error: unknown): boolean {
  if (!(error instanceof ApiError)) return true;
  if (error.code === "IDEMPOTENCY_IN_PROGRESS") return true;
  return error.status === 0 || error.status >= 500;
}
