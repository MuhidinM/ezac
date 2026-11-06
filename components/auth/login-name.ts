"use client";

/**
 * The username typed on the sign-in page, kept for this tab only while a
 * temporary password is being replaced, so the change-password form can sign
 * the user in with the new password instead of asking them to sign in again.
 * The session's display name can't stand in for it: /me gives a name, not
 * the login.
 */
const KEY = "ezac_login_name";

export function rememberLoginName(username: string): void {
  try {
    window.sessionStorage.setItem(KEY, username);
  } catch {
    // Storage blocked: the user signs in again by hand after the change.
  }
}

export function readLoginName(): string | null {
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function forgetLoginName(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // Nothing stored.
  }
}
