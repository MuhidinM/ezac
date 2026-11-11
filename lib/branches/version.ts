/**
 * Branch and field-officer edits must send the record's `version` (from the
 * last GET); a stale one answers 409 VERSION_CONFLICT. The list and detail
 * types don't declare it yet, so read it here.
 */
export type Versioned = { version?: number | null };

/** The record's version, or undefined when the backend sent none. */
export function versionOf(record: unknown): number | undefined {
  if (!record || typeof record !== "object") return undefined;
  const value = (record as Versioned).version;
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : undefined;
}

/** The PATCH body with the record's version added (left out only when the record has none). */
export function withVersion<T extends object>(body: T, record: unknown): T & Versioned {
  const version = versionOf(record);
  return version === undefined ? body : { ...body, version };
}
