"use client";

import { useEffect } from "react";

/**
 * The digest Next attaches to an error thrown on the server. It matches the
 * server log entry, so it is safe to show as a reference. The message is not:
 * errors thrown in the browser keep their original text, which can be
 * technical or carry internal details.
 */
export function errorDigest(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("digest" in error)) return null;
  const { digest } = error as { digest?: unknown };
  return typeof digest === "string" && digest.length > 0 ? digest : null;
}

/**
 * For error boundaries: logs the caught error to the browser console once, and
 * returns the reference to show. Server-side errors are logged on the server
 * too, under the same digest.
 */
export function useLoggedError(scope: string, error: unknown): string | null {
  useEffect(() => {
    console.error(`[${scope}]`, error);
  }, [scope, error]);
  return errorDigest(error);
}
