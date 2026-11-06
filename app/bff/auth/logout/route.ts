import { NextResponse } from "next/server";

import { errorFields, logEvent } from "@/lib/api/log";
import { ACCESS_TOKEN_COOKIE, PASSWORD_CHANGE_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { clearAuthCookies } from "@/lib/auth/session";

/**
 * Signing out must always work: clear the cookies and answer success either
 * way. The auth service has no revoke endpoint yet, so the refresh token is
 * only forgotten here, not revoked upstream.
 */
export async function POST() {
  const response = NextResponse.json(
    { success: true, data: null, message: "Logged out" },
    { headers: { "Cache-Control": "no-store" } },
  );

  try {
    await clearAuthCookies();
  } catch (error) {
    // Could not clear the cookies through next/headers.
    logEvent("error", "logout_cookie_clear_failed", errorFields(error));
    // Fall back to expiring them on the response itself.
    for (const name of [ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, PASSWORD_CHANGE_COOKIE]) {
      response.cookies.delete(name);
    }
  }

  return response;
}
