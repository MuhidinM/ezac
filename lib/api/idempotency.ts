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

/** The header to send with a create call: `apiClient(path, { headers: idempotencyHeader(key) })`. */
export function idempotencyHeader(key: string): Record<string, string> {
  return { "Idempotency-Key": key };
}
