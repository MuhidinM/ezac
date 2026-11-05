import type { NextRequest } from "next/server";

import { getApiBaseUrl } from "@/lib/api/config";
import { logGatewayUnreachable } from "@/lib/api/network-error";

/**
 * Health check for uptime monitors and the deploy script. No login, no
 * personal data.
 *
 * - GET /bff/health: the app is up. 200 `{ status: "ok", release, uptimeSeconds }`.
 * - GET /bff/health?deep=1: also checks the gateway answers (any HTTP status
 *   counts, even 404). 503 `{ status: "degraded" }` when it doesn't.
 *
 * `release` is GIT_SHA, set at deploy time.
 */
const GATEWAY_CHECK_TIMEOUT_MS = 3_000;
/** Monitors and people may hit ?deep=1 often; one gateway probe serves them all for a few seconds. */
const GATEWAY_CHECK_REUSE_MS = 5_000;

let lastCheck: { at: number; reachable: Promise<boolean> } | null = null;

async function probeGateway(): Promise<boolean> {
  try {
    await fetch(getApiBaseUrl(), {
      method: "HEAD",
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(GATEWAY_CHECK_TIMEOUT_MS),
    });
    return true;
  } catch (error) {
    logGatewayUnreachable("health", error);
    return false;
  }
}

function gatewayReachable(): Promise<boolean> {
  const now = Date.now();
  if (!lastCheck || now - lastCheck.at > GATEWAY_CHECK_REUSE_MS) {
    lastCheck = { at: now, reachable: probeGateway() };
  }
  return lastCheck.reachable;
}

export async function GET(request: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  const body = {
    status: "ok",
    release: process.env.GIT_SHA ?? null,
    uptimeSeconds: Math.round(process.uptime()),
  };

  if (request.nextUrl.searchParams.get("deep") !== "1") {
    return Response.json(body, { headers });
  }

  const reachable = await gatewayReachable();
  return Response.json(
    { ...body, status: reachable ? "ok" : "degraded", gateway: reachable ? "reachable" : "unreachable" },
    { status: reachable ? 200 : 503, headers },
  );
}
