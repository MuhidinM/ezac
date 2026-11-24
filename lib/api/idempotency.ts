import { ApiError } from "@/lib/api/errors";

/**
 * A fresh Idempotency-Key for one create action. Keep the key for the whole
 * attempt (including retries after a timeout) and make a new one only when the
 * user starts a new action, so a double click or a retry never creates twice.
 */
export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  // Old browsers: still unique enough for one user's retries.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Whether a retry after this error must reuse the same Idempotency-Key. The
 * backend keeps only successful answers, so after a clear refusal (4xx) the
 * user may fix the form and send it as a new attempt. When the answer was
 * lost (offline, timeout, 5xx) or the first request is still running, the
 * record may already exist: the same key makes the retry return it
 * instead of creating it twice.
 */
export function keepIdempotencyKey(error: unknown): boolean {
  if (!(error instanceof ApiError)) return true;
  if (error.code === "IDEMPOTENCY_IN_PROGRESS") return true;
  return error.status === 0 || error.status >= 500;
}

/** The header to send with a create call: `apiClient(path, { headers: idempotencyHeader(key) })`. */
export function idempotencyHeader(key: string): Record<string, string> {
  return { "Idempotency-Key": key };
}
