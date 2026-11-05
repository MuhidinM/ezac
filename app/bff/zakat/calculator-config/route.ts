import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api/errors";
import { logUpstreamFailure, readUpstreamJson, upstreamFetch } from "@/lib/api/upstream";
import { ZAKAT_PUBLIC_TAG } from "@/lib/zakat/public-cache";

/**
 * Public calculator config (prices, nisab, rates, livestock tables) from
 * zakat-engine. No login needed. Cached here for 5 minutes, or until an admin
 * changes prices or rules through the zakat-admin BFF, which expires the tag.
 */
export async function GET() {
  try {
    const call = await upstreamFetch(
      "/api/zakat/v1/calculator/config",
      { next: { revalidate: 300, tags: [ZAKAT_PUBLIC_TAG] } },
      { label: "zakat/calculator-config" },
    );
    const parsed = await readUpstreamJson(call);
    const body = parsed.kind === "json" ? parsed.value : null;
    const upstream = call.response;

    if (!upstream.ok || !body) {
      // 503 means prices aren't published yet: expected, not an incident.
      if (upstream.status >= 500 && upstream.status !== 503) logUpstreamFailure(call, body);
      return NextResponse.json(
        {
          success: false,
          message:
            upstream.status === 503
              ? "Official prices aren't available yet."
              : "Couldn't load the official Zakat rates.",
          requestId: call.requestId,
        },
        { status: upstream.ok ? 502 : upstream.status },
      );
    }

    // Browsers ask again on every load (the server answers from its own
    // cache), so a price or rules change shows on the next page load.
    return NextResponse.json(body, {
      headers: { "Cache-Control": "public, no-cache" },
    });
  } catch (error) {
    // Gateway unreachable (502) or too slow (504); already logged.
    if (error instanceof ApiError) {
      return NextResponse.json(
        { success: false, message: error.message, requestId: error.requestId },
        { status: error.status },
      );
    }
    throw error;
  }
}
