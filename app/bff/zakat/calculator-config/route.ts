import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

import { PublicDataUnavailableError, fetchPublic } from "@/lib/zakat/impact";
import { ZAKAT_PUBLIC_TAG } from "@/lib/zakat/public-cache";

const PATH = "/calculator/config";

/**
 * The answer is cached, not the HTTP response: Next's fetch cache never
 * stores a non-200, so "no prices yet" (503) used to go to zakat-engine on
 * every request (the pattern behind UAT #15). Here "not published" (null) is
 * cached like any other answer for 5 minutes, or until an admin changes prices
 * or rules through the zakat-admin BFF, which expires the tag. An outage
 * throws, and a throw is never cached. Same key as lib/zakat/impact.ts, so the
 * public pages and this route share one cached answer.
 */
const cachedConfig = unstable_cache(fetchPublic, ["zakat-public-answer"], {
  revalidate: 300,
  tags: [ZAKAT_PUBLIC_TAG],
});

/** Public calculator config (prices, nisab, rates, livestock tables) from zakat-engine. No login needed. */
export async function GET() {
  let data: unknown;
  try {
    // true: zakat-engine's 503 { success: false } means no prices stored yet, not an outage.
    data = await cachedConfig(PATH, true);
  } catch (error) {
    // Unreachable, too slow or failing; fetchPublic has already logged it.
    if (error instanceof PublicDataUnavailableError) {
      return NextResponse.json({ success: false, message: "Couldn't load the official Zakat rates." }, { status: 502 });
    }
    throw error;
  }

  if (data === null) {
    return NextResponse.json({ success: false, message: "Official prices aren't available yet." }, { status: 503 });
  }

  // Browsers ask again on every load (the server answers from its own
  // cache), so a price or rules change shows on the next page load.
  return NextResponse.json({ success: true, data }, { headers: { "Cache-Control": "public, no-cache" } });
}
