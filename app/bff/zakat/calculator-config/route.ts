import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api/errors";
import { logUpstreamFailure, readUpstreamJson, upstreamFetch } from "@/lib/api/upstream";

/**
 * Public calculator config (prices, nisab, rates, livestock tables) from
 * zakat-engine. No login needed; cached here for 5 minutes like upstream.
 */
export async function GET() {
  try {
    const call = await upstreamFetch(
      "/api/zakat/v1/calculator/config",
      { next: { revalidate: 300 } },
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

    return NextResponse.json(body, {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
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
