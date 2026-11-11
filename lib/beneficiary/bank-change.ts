import { ApiError, isSameApprover } from "@/lib/api/errors";
import type { BankChangeAccount, PayoutBank } from "@/lib/beneficiary/types";

/** Most characters the backend keeps in `bankChangeReason`. */
export const BANK_CHANGE_REASON_MAX = 500;

export const SAME_APPROVER_MESSAGE = "Another admin must do this step.";

const LOCKED_BECAUSE: Record<string, string> = {
  IN_POOL: "The household is waiting for or in the disbursement pool",
  ASSESSMENT_APPROVED: "The household's assessment is approved",
  FAST_TRACK: "The household is on the fast-track whitelist",
};

/** Why a payout account was locked, in words. */
export function lockedBecauseLabel(code: string | null | undefined): string | null {
  if (!code) return null;
  return LOCKED_BECAUSE[code] ?? code.replaceAll("_", " ").toLowerCase();
}

type BankFields = {
  bankCode?: string | null;
  bankAccountNumber?: string | null;
  bankAccountHolderName?: string | null;
};

const BANK_KEYS = ["bankCode", "bankAccountNumber", "bankAccountHolderName"] as const;

/** Whether a PATCH body changes the bank, the number or the holder name (each needs a reason). */
export function changesBankAccount(changed: BankFields): boolean {
  return BANK_KEYS.some((key) => key in changed);
}

/** The account number as the backend checks it: spaces and dashes removed. */
export function normaliseAccountNumber(value: string): string {
  return value.replace(/[\s-]/g, "");
}

/**
 * Why `value` is not a valid account number for `bank`, or null when it is
 * (or when the bank sends no usable pattern: the backend still checks).
 */
export function accountNumberProblem(value: string, bank: Pick<PayoutBank, "accountNumberPattern"> | null | undefined) {
  const number = normaliseAccountNumber(value);
  if (!number) return null;
  if (!/^\d+$/.test(number)) return "Use digits only. Spaces and dashes are fine.";
  const pattern = bank?.accountNumberPattern;
  if (!pattern) return null;
  let regex: RegExp;
  try {
    regex = new RegExp(pattern);
  } catch {
    return null;
  }
  return regex.test(number) ? null : `This isn't a valid account number for this bank (${describePattern(pattern)}).`;
}

/** "6 to 30 digits" for the usual ^\d{6,30}$ pattern; otherwise a neutral hint. */
export function describePattern(pattern: string): string {
  const range = /^\^\\d\{(\d+),(\d+)\}\$$/.exec(pattern);
  if (range) return `${range[1]} to ${range[2]} digits`;
  const exact = /^\^\\d\{(\d+)\}\$$/.exec(pattern);
  if (exact) return `${exact[1]} digits`;
  return "check the number with the household";
}

export type BankChoice = { value: string; label: string; disabled?: boolean };

/**
 * Picker options: the banks available for payouts. The household's current
 * bank stays listed (marked) when it is no longer available, so the form
 * shows what is stored; it can't be picked again once changed.
 */
export function bankChoices(
  banks: PayoutBank[],
  current: { code?: string | null; name?: string | null } | null | undefined,
): BankChoice[] {
  const choices: BankChoice[] = banks
    .filter((bank) => bank.available)
    .map((bank) => ({ value: bank.code, label: bank.name }));
  const code = current?.code;
  if (code && !choices.some((choice) => choice.value === code)) {
    const known = banks.find((bank) => bank.code === code);
    choices.push({
      value: code,
      label: `${known?.name ?? current?.name ?? code} (not available for payouts)`,
      disabled: true,
    });
  }
  return choices;
}

/** Plain words for the bank-account refusals of PATCH /beneficiaries/{id}; null for other errors. */
export function bankChangeErrorMessage(error: unknown): string | null {
  if (!(error instanceof ApiError) || error.status !== 409) return null;
  if (error.code === "BANK_CHANGE_PENDING") {
    return "A change to this bank account is already waiting for another admin. It must be approved or rejected before the account can change again.";
  }
  if (error.code === "LOCKED") {
    return "The bank account is locked because the household is approved, fast-tracked or in the pool. Ask an administrator to change it.";
  }
  return null;
}

/** Plain words for the approve and reject refusals; null for other errors. */
export function bankDecisionErrorMessage(error: unknown): string | null {
  if (isSameApprover(error)) return SAME_APPROVER_MESSAGE;
  if (error instanceof ApiError && error.status === 409 && error.code === "BANK_CHANGE_NOT_PENDING") {
    return "This request was already decided. The list now shows the result.";
  }
  return null;
}

/** The fields of an account that differ between two versions, for highlighting. */
export function changedAccountFields(
  current: BankChangeAccount | null | undefined,
  requested: BankChangeAccount | null | undefined,
): Set<keyof BankChangeAccount> {
  const changed = new Set<keyof BankChangeAccount>();
  const same = (a: string | null | undefined, b: string | null | undefined) => (a ?? "").trim() === (b ?? "").trim();
  if (!same(current?.bankCode, requested?.bankCode)) changed.add("bankCode");
  if (!same(current?.accountNumber, requested?.accountNumber)) changed.add("accountNumber");
  if (!same(current?.accountHolderName, requested?.accountHolderName)) changed.add("accountHolderName");
  return changed;
}
