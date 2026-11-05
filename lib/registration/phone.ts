import { PHONE_PREFIX } from "@/lib/registration/constants";

export function normalizePhoneToE164(input: string): string {
  const digits = input.replace(/\D/g, "");

  if (digits.startsWith("251") && digits.length === 12) {
    return `+${digits}`;
  }

  if (digits.startsWith("0") && digits.length === 10) {
    return `${PHONE_PREFIX}${digits.slice(1)}`;
  }

  if (digits.length === 9) {
    return `${PHONE_PREFIX}${digits}`;
  }

  if (input.startsWith(PHONE_PREFIX) && digits.length === 12) {
    return `+${digits}`;
  }

  return input.startsWith("+") ? input : `${PHONE_PREFIX}${digits}`;
}

export function isValidEthiopianPhone(input: string): boolean {
  const normalized = normalizePhoneToE164(input);
  return /^\+251[79]\d{8}$/.test(normalized);
}

/**
 * Search text as the backend stores it: a local mobile number (09… or 07…,
 * spaces and dashes allowed) becomes +2519…; anything else is unchanged.
 */
export function phoneSearchTerm(input: string): string {
  const compact = input.trim().replace(/[\s-]/g, "");
  return /^0[79]\d{8}$/.test(compact) ? `${PHONE_PREFIX}${compact.slice(1)}` : input.trim();
}

export function stripPhonePrefix(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("251")) {
    return digits.slice(3);
  }
  if (digits.startsWith("0")) {
    return digits.slice(1);
  }
  return digits;
}
