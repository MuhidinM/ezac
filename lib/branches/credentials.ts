/**
 * One-time credentials from creating a branch or field officer, or from a
 * password reset. Every answer carries `passwordChangeRequired: true`. A
 * create replayed under the same Idempotency-Key answers again, but with
 * `initialPassword: null`: the password is never sent twice.
 */
export type OneTimeCredentials = {
  login: string;
  /** null when the answer was a replay; the reset action makes a new one. */
  initialPassword: string | null;
  passwordChangeRequired: boolean;
};

type CredentialFields = {
  username?: string | null;
  initialPassword?: string | null;
  passwordChangeRequired?: boolean | null;
};

/** The login and password to show once, from any of those answers. */
export function oneTimeCredentials(answer: CredentialFields, fallbackLogin: string | null | undefined): OneTimeCredentials {
  const password = typeof answer.initialPassword === "string" ? answer.initialPassword : "";
  return {
    login: answer.username?.trim() || fallbackLogin?.trim() || "",
    initialPassword: password || null,
    // The backend always asks for a change; assume so when it says nothing.
    passwordChangeRequired: answer.passwordChangeRequired !== false,
  };
}
