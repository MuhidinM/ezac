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
 * Whether a failed create may be retried with the same key: no answer came
 * (offline, gateway timeout) or the first try is still running. Any other
 * answer is final for that key, and a retry after the user changes the form
 * would be refused as IDEMPOTENCY_KEY_REUSED, so a new key is needed.
 */
export function keepKeyAfter(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("status" in error)) return true;
  const { status, code } = error as { status: unknown; code?: unknown };
  return status === 0 || status === 502 || status === 503 || status === 504 || code === "IDEMPOTENCY_IN_PROGRESS";
}

/** The header to send with a create call: `apiClient(path, { headers: idempotencyHeader(key) })`. */
export function idempotencyHeader(key: string): Record<string, string> {
  return { "Idempotency-Key": key };
}
