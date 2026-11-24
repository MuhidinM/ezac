import "server-only";

import { NextResponse } from "next/server";

import { visitorIp } from "@/lib/api/visitor-ip";
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
 * The browser's address, for rate limiting (see visitorIp for how it is read).
 * Unknown means every visitor would look the same, so the per-IP limit is skipped.
 */
export function clientIp(request: Request): string {
  return visitorIp(request.headers) ?? UNKNOWN_IP;
}

/** True when the request body is declared as JSON (`application/json`, any charset). */
export function isJsonRequest(request: Request): boolean {
  const type = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  return type === "application/json";
}
