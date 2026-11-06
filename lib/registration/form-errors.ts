import { ApiError, errorMessage, fieldErrorMap } from "@/lib/api/errors";

/** Labels for the backend's field keys, so messages read as plain English. */
const FIELD_LABELS: Record<string, string> = {
  fullName: "Full name",
  phone: "Phone",
  email: "Email",
  dateOfBirth: "Date of birth",
  estimatedAge: "Estimated age",
  gender: "Sex",
  maritalStatus: "Marital status",
  religion: "Religion",
  primaryLanguage: "Primary language",
  primaryLanguageOther: "Other language",
  zone: "Zone",
  woreda: "Woreda",
  kebele: "Kebele",
  addressLine: "Address",
  bankCode: "Bank",
  bankNameOther: "Bank name",
  bankAccountNumber: "Account number",
  bankAccountHolderName: "Account holder name",
  category: "Asnaf category",
  registrationCode: "Registration code",
};

const CHECK_FIELDS = "Check the highlighted fields.";

function labelOf(field: string): string {
  return FIELD_LABELS[field.split(".").pop() ?? field] ?? "This field";
}

/** One field's message in plain words: no field keys, no format names. */
function plainFieldMessage(field: string, message: string): string {
  const text = message.trim();
  const key = field.split(".").pop() ?? field;
  if (key === "phone" && /e\.?164|phone number/i.test(text)) {
    return "Enter a valid phone number, for example 0911 234 567.";
  }
  if (key === "email" && /valid|well-formed/i.test(text)) return "Enter a valid email address.";
  // "bankAccountNumber must be 6-30 digits" → "Account number must be 6-30 digits"
  if (text.startsWith(`${key} `)) return `${labelOf(key)} ${text.slice(key.length + 1)}`;
  if (/^must /i.test(text)) return `${labelOf(key)} ${text}`;
  return text;
}

/** Known backend messages that need different words for staff. */
function plainMessage(message: string): string | null {
  if (/no available registration codes/i.test(message)) {
    return "This branch has no registration codes left. Ask an administrator to generate more, or enter a printed code from this branch.";
  }
  if (/already registered/i.test(message)) {
    return "A household with this phone number or email is already registered. Search for it on the Beneficiaries list.";
  }
  if (/^validation failed\.?$/i.test(message.trim())) {
    return "Some details aren't valid. Check the form and try again.";
  }
  return null;
}

export type FormErrors = {
  /** Banner text, or null when there is nothing to show above the form. */
  message: string | null;
  /** Plain messages by field key, for the fields themselves. */
  fields: Record<string, string>;
};

/**
 * Turn a failed save into a banner and per-field messages. Field errors come
 * from `errors[]`; when the backend names the field only inside its message
 * ("bankAccountNumber must be 6-30 digits"), that message goes on the field.
 * `fields` lists the keys the form can show.
 */
export function formErrors(error: unknown, fallback: string, fields: readonly string[]): FormErrors {
  if (!(error instanceof ApiError)) return { message: errorMessage(error, fallback), fields: {} };

  const byField: Record<string, string> = {};
  for (const [field, message] of Object.entries(fieldErrorMap(error.errors))) {
    byField[field] = plainFieldMessage(field, message);
  }
  if (Object.keys(byField).length === 0) {
    const named = fields.find((field) => error.message.startsWith(`${field} `));
    if (named) byField[named] = plainFieldMessage(named, error.message);
    else if (/e\.?164/i.test(error.message) && fields.includes("phone")) {
      byField.phone = plainFieldMessage("phone", error.message);
    }
  }

  const shown = Object.keys(byField).some((field) => fields.includes(field));
  if (shown) return { message: CHECK_FIELDS, fields: byField };
  return { message: plainMessage(error.message) ?? error.message, fields: byField };
}

/**
 * A date of birth and an estimated age that disagree by more than a year.
 * Returns the message for the estimated-age field, or null when they agree
 * or one of them is empty.
 */
export function ageMismatch(dateOfBirth: string, estimatedAge: string, today = new Date()): string | null {
  if (!dateOfBirth.trim() || !estimatedAge.trim()) return null;
  const [year, month, day] = dateOfBirth.split("-").map(Number);
  const age = Number(estimatedAge);
  if (!year || !month || !day || !Number.isFinite(age)) return null;
  let years = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) years -= 1;
  if (Math.abs(years - age) <= 1) return null;
  return `The date of birth gives an age of ${years}. Correct one of them, or clear the estimated age.`;
}
