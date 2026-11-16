import { revalidateTag } from "next/cache";

/**
 * Next data-cache tag on every public zakat-engine read: the public pages
 * (lib/zakat/impact.ts) and /bff/zakat/calculator-config. Server only.
 */
export const ZAKAT_PUBLIC_TAG = "zakat-public";

/**
 * Called by the zakat-admin BFF after a successful change. `expire: 0` drops
 * the cached copies at once, so the next visit reads zakat-engine again
 * instead of being served the old copy while it refreshes. That matters for a
 * story or cause taken down: zakat-engine then answers 404, Next never caches
 * a 404, and a merely stale copy would be served again on every visit.
 */
export function expirePublicZakatData() {
  revalidateTag(ZAKAT_PUBLIC_TAG, { expire: 0 });
}

/**
 * Blue/green: the other copy of the app (3000 <-> 3001) keeps its own cache and
 * serves as nginx's backup and the rollback target, so expire it there too.
 * Best effort: when no other copy runs, nothing answers and nothing is lost.
 */
export function expirePublicZakatDataOnStandby() {
  const port = process.env.PORT;
  const other = port === "3000" ? "3001" : port === "3001" ? "3000" : null;
  if (!other) return;
  void fetch(`http://127.0.0.1:${other}/bff/internal/expire-public`, {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.timeout(2_000),
  }).catch(() => undefined);
}
