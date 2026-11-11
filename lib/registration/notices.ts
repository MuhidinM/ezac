/**
 * The success notices a new household's profile shows after registration
 * (see lib/backoffice/notice.ts). Named, with the BIN, so the officer knows
 * which household it was, and pointing at the next step.
 */

function who(fullName: string | null | undefined, bin: string | null | undefined): string {
  const name = fullName?.trim() || "The household";
  return bin?.trim() ? `${name} (BIN ${bin.trim()})` : name;
}

/** After registering a household. */
export function registeredNotice(fullName: string | null | undefined, bin: string | null | undefined): string {
  return `${who(fullName, bin)} is registered. The next step is the household assessment.`;
}

/**
 * After a registration whose answer was a replay of an earlier attempt: the
 * temporary password was in the first answer only and is never sent again.
 */
export function passwordNotShownNotice(fullName: string | null | undefined, bin: string | null | undefined): string {
  return `${who(fullName, bin)} was already registered, so its temporary password can't be shown again. If the household doesn't have it, the branch or an admin can reset it. The next step is the household assessment.`;
}
