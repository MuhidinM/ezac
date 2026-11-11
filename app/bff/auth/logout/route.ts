import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { gatewayRequest } from "@/lib/api/gateway";
import { errorFields, logEvent } from "@/lib/api/log";
import { ACCESS_TOKEN_COOKIE, PASSWORD_CHANGE_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { AUTH_REQUEST_TIMEOUT_MS, clearAuthCookies } from "@/lib/auth/session";

/**
 * End the Keycloak session (POST /api/auth/v1/logout), which revokes the
 * refresh token at once, so a copied cookie can't be used after sign-out on a
 * shared PC. The auth service answers 502 LOGOUT_FAILED when Keycloak is
 * unreachable: try once more, then still clear the cookies. Signing out here
 * must always succeed for the user.
 */
async function endUpstreamSession(refreshToken: string): Promise<void> {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      await gatewayRequest<unknown>("/api/auth/v1/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
        label: "auth/logout",
        timeoutMs: AUTH_REQUEST_TIMEOUT_MS,
      });
      return;
    } catch (error) {
      if (attempt === 2) {
        logEvent("error", "logout_upstream_failed", {
          message: "the sign-in service did not end the session; cookies cleared anyway",
          ...errorFields(error),
        });
      }
    }
  }
}

export async function POST() {
  const response = NextResponse.json(
    { success: true, data: null, message: "Logged out" },
    { headers: { "Cache-Control": "no-store" } },
  );

  const refreshToken = (await cookies()).get(REFRESH_TOKEN_COOKIE)?.value;
  if (refreshToken) await endUpstreamSession(refreshToken);

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
