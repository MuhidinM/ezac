import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api/errors";
import { gatewayRequest } from "@/lib/api/gateway";
import type { MeProfile, SessionInfo } from "@/lib/api/types";
import { filterAppRoles } from "@/lib/auth/constants";
import { authError, authUnavailableResponse } from "@/lib/auth/http";
import {
  AUTH_REQUEST_TIMEOUT_MS,
  AuthUnavailableError,
  clearAuthCookies,
  getAccessToken,
  sessionFlags,
  sessionFromAccessToken,
  sessionFromMeProfile,
} from "@/lib/auth/session";

/**
 * Prefer /me for display fields, but union roles with the access token so the
 * Branches menu still appears when Keycloak puts ADMIN on the JWT and /me
 * returns an empty roles array. The access flags come from sessionFlags, so an
 * account with no EZAC role gets no access here either.
 */
function mergeSessionWithJwt(
  fromMe: SessionInfo,
  fromJwt: SessionInfo | null,
): SessionInfo {
  if (!fromJwt) return fromMe;

  const allRoles = Array.from(new Set([...fromMe.allRoles, ...fromJwt.allRoles]));

  return {
    ...fromMe,
    roles: filterAppRoles(allRoles),
    allRoles,
    ...sessionFlags(allRoles),
  };
}

async function signedOut(): Promise<NextResponse> {
  // Without this, a stale cookie keeps proxy.ts treating the browser as signed
  // in and /login would bounce straight back to the dashboard.
  try {
    await clearAuthCookies();
  } catch {
    // Nothing more to do; the 401 still tells the page to sign in.
  }
  return authError(401, "Not authenticated");
}

export async function GET() {
  let accessToken: string | null;
  try {
    accessToken = await getAccessToken();
  } catch (error) {
    if (error instanceof AuthUnavailableError) return authUnavailableResponse();
    throw error;
  }
  if (!accessToken) return signedOut();

  const fromJwt = sessionFromAccessToken(accessToken);

  try {
    const profile = await gatewayRequest<MeProfile>("/api/auth/v1/me", {
      accessToken,
      label: "auth/session",
      timeoutMs: AUTH_REQUEST_TIMEOUT_MS,
    });
    return NextResponse.json(
      { success: true, data: mergeSessionWithJwt(sessionFromMeProfile(profile), fromJwt) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return signedOut();
    }

    // A disabled or blocked account: don't fall back to the roles in its token.
    if (error instanceof ApiError && error.status === 403) {
      return authError(403, "Your account can't use the staff portal right now. Ask an administrator.");
    }

    // /me is down or slow (already logged): the token's own roles are still a fair answer.
    if (fromJwt) {
      return NextResponse.json({ success: true, data: fromJwt }, { headers: { "Cache-Control": "no-store" } });
    }
    return authUnavailableResponse();
  }
}
