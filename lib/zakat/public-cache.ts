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
