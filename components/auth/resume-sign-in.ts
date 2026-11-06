"use client";

/**
 * Signing in again in a second tab while a form keeps its unsaved work.
 *
 * A save that meets an ended session (401) offers "Sign in again". That opens
 * /login?reason=resume in a new tab; after signing in there, the tab tells
 * the others through localStorage and closes itself, and the user is back on
 * the form, signed in, to save again. Without a new tab (blocked pop-up) it
 * falls back to the normal sign-in that returns to the page.
 */

/** Written on every successful staff sign-in, so tabs waiting on one can carry on. */
export const SIGNED_IN_KEY = "ezac_signed_in";

/** ?reason= value for a sign-in tab opened to resume work elsewhere. */
export const RESUME_REASON = "resume";

export function announceSignedIn(): void {
  try {
    window.localStorage.setItem(SIGNED_IN_KEY, String(Date.now()));
  } catch {
    // Storage blocked: the waiting tab still works once the user retries.
  }
}

/** Calls `listener` when any other tab signs in; returns the unsubscribe. */
export function onSignedInElsewhere(listener: () => void): () => void {
  const handle = (event: StorageEvent) => {
    if (event.key === SIGNED_IN_KEY && event.newValue) listener();
  };
  window.addEventListener("storage", handle);
  return () => window.removeEventListener("storage", handle);
}

/** The page to come back to: this one, path and query. */
export function currentPortalPath(): string {
  return `${window.location.pathname}${window.location.search}`;
}

/**
 * Open the sign-in page in a new tab for resuming. Returns false when the
 * browser refused (pop-up blocking), so the caller can fall back.
 */
export function openResumeSignIn(path: string = currentPortalPath()): boolean {
  const query = new URLSearchParams({ reason: RESUME_REASON });
  if (path.startsWith("/dashboard")) query.set("redirect", path);
  const opened = window.open(`/login?${query.toString()}`, "ezac-sign-in");
  if (!opened) return false;
  opened.focus();
  return true;
}

/**
 * After a successful sign-in on a resume tab: close it and leave the user on
 * the tab they came from. Returns false when this isn't such a tab or the
 * browser keeps it open; the caller then navigates as usual.
 */
export function closeResumeTab(reason: string | null): boolean {
  if (reason !== RESUME_REASON) return false;
  let opener: Window | null = null;
  try {
    opener = window.opener as Window | null;
  } catch {
    opener = null;
  }
  if (!opener || opener.closed) return false;
  try {
    opener.focus();
  } catch {
    // Focus is a courtesy; closing still returns the user there.
  }
  window.close();
  return window.closed;
}
