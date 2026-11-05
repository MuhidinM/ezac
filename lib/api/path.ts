/**
 * Next decodes route params, so "%2F" in a URL arrives as "/" inside one
 * segment. Anything that goes into a gateway path must be checked here and
 * then passed through encodeURIComponent.
 */

/** A single, harmless path segment: no slashes, "%", control characters or dot segments. */
export function isSafePathSegment(segment: string): boolean {
  if (!segment || segment.length > 200 || segment === "." || segment === "..") return false;
  for (const char of segment) {
    const code = char.charCodeAt(0);
    if (code < 0x20 || code === 0x7f || char === "/" || char === "\\" || char === "%") return false;
  }
  return true;
}

const NUMERIC_ID = /^\d{1,19}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Backend record ids are numeric ("42") or UUIDs. */
export function isBackendId(id: string): boolean {
  return NUMERIC_ID.test(id) || UUID.test(id);
}
