/**
 * The success notices a new household's profile shows after registration
 * (see lib/backoffice/notice.ts). Named, with the BIN, so the officer knows
 * which household it was, and pointing at the next step.
 */

function who(fullName: string | null | undefined, bin: string | null | undefined): string {
  const name = fullName?.trim() || "The household";
  return bin?.trim() ? `${name} (BIN ${bin.trim()})` : name;
}

/** After registering a household that has no login password step. */
export function registeredNotice(fullName: string | null | undefined, bin: string | null | undefined): string {
  return `${who(fullName, bin)} is registered. The next step is the household assessment.`;
}

/** After the password step that ends a walk-in registration. */
export function passwordSetNotice(fullName: string | null | undefined, bin: string | null | undefined): string {
  return `${who(fullName, bin)} is registered and the login password is set. The next step is the household assessment.`;
}
