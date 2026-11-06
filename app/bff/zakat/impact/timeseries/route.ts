import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

import { PublicDataUnavailableError, fetchPublic } from "@/lib/zakat/impact";
import { ZAKAT_PUBLIC_TAG } from "@/lib/zakat/public-cache";

const PATH = "/impact/timeseries";

// Same cached answer as the public transparency pages (lib/zakat/impact.ts).
const cachedSeries = unstable_cache(fetchPublic, ["zakat-public-answer"], {
  revalidate: 300,
  tags: [ZAKAT_PUBLIC_TAG],
});

/**
 * Zakat collected and paid out per month over the last 12 months: the same
 * public figures the transparency dashboard shows, for the staff Overview.
 * No login needed; nothing personal.
 */
export async function GET() {
  let data: unknown;
  try {
    data = await cachedSeries(PATH, true);
  } catch (error) {
    if (error instanceof PublicDataUnavailableError) {
      return NextResponse.json({ success: false, message: "Couldn't load the monthly Zakat figures." }, { status: 502 });
    }
    throw error;
  }
  if (data === null) {
    return NextResponse.json({ success: false, message: "Monthly Zakat figures aren't published yet." }, { status: 503 });
  }
  return NextResponse.json({ success: true, data }, { headers: { "Cache-Control": "public, no-cache" } });
}
