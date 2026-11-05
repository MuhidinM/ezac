import { validatePassword } from "@/lib/registration/password";

/** Shown under the new-password field on every staff form. */
export const STAFF_PASSWORD_HINT =
  "At least 10 characters, with upper and lower case letters, a number and a symbol.";

/**
 * Problems with a staff password change, or an empty list when it is fine.
 * Staff accounts approve payouts and edit scoring, so they get the same rule
 * as beneficiary accounts (lib/registration/password.ts), and the new
 * password must differ from the current one. Used by the forms and the BFF
 * route so both say the same thing.
 */
export function staffPasswordProblems(
  currentPassword: string,
  newPassword: string,
  confirmNewPassword: string,
): string[] {
  const { errors } = validatePassword(newPassword, confirmNewPassword);
  if (newPassword && newPassword === currentPassword) {
    errors.push("Choose a new password that is different from your current one");
  }
  return errors;
}
