import "server-only";

import { NextResponse } from "next/server";

import { UNKNOWN_IP } from "@/lib/auth/rate-limit";
import { AuthUnavailableError } from "@/lib/auth/session";

const NO_STORE = { "Cache-Control": "no-store" };

/** `{ success: false, message }` with a status; never cached. */
export function authError(status: number, message: string, headers?: Record<string, string>): NextResponse {
  return NextResponse.json({ success: false, message }, { status, headers: { ...NO_STORE, ...headers } });
}

/**
 * The access token expired and the auth service can't renew it right now. The
 * session is still good, so the cookies stay and the browser may retry.
 */
export function authUnavailableResponse(): NextResponse {
  return authError(503, new AuthUnavailableError().message);
}

/**
 * The browser's address, for rate limiting and for the gateway's audit log.
 *
 * X-Real-IP first, then the LAST X-Forwarded-For entry: the one the nearest
 * proxy added (or Next itself, from the socket, when nothing was sent). The
 * first entry is whatever the client chose to send, so it can't be trusted.
 * nginx must set both headers to $remote_addr (see README, "Reverse proxy").
 *
 * Loopback means the proxy didn't say who the browser is: every visitor would
 * look the same, so that is reported as UNKNOWN_IP and the per-IP limit is skipped.
 */
export function clientIp(request: Request): string {
  const real = request.headers.get("x-real-ip")?.trim();
  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const ip = (real || forwarded?.[forwarded.length - 1] || "").replace(/^::ffff:/i, "").slice(0, 64);
  if (!ip || ip === "::1" || ip.startsWith("127.")) return UNKNOWN_IP;
  return ip;
}

/** True when the request body is declared as JSON (`application/json`, any charset). */
export function isJsonRequest(request: Request): boolean {
  const type = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  return type === "application/json";
}
