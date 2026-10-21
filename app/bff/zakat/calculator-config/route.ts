import { NextResponse } from "next/server";

import { getApiBaseUrl } from "@/lib/api/config";
import { logGatewayUnreachable } from "@/lib/api/network-error";

/**
 * Public calculator config (prices, nisab, rates, livestock tables) from
 * zakat-engine. No login needed; cached here for 5 minutes like upstream.
 */
export async function GET() {
  try {
    const upstream = await fetch(`${getApiBaseUrl()}/api/zakat/v1/calculator/config`, {
      next: { revalidate: 300 },
    });
    const body = (await upstream.json().catch(() => null)) as unknown;
    if (!upstream.ok || !body) {
      return NextResponse.json(
        {
          success: false,
          message:
            upstream.status === 503
              ? "Official prices aren't available yet."
              : "Couldn't load the official Zakat rates.",
        },
        { status: upstream.status || 502 },
      );
    }
    return NextResponse.json(body, {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    logGatewayUnreachable("zakat/calculator-config", error);
    return NextResponse.json(
      { success: false, message: "Couldn't reach the Zakat service." },
      { status: 502 },
    );
  }
}
