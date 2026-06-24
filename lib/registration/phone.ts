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
