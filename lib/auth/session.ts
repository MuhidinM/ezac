import { cookies, headers } from "next/headers";

import { getApiBaseUrl } from "@/lib/api/config";

import type { MeProfile, SessionInfo } from "@/lib/api/types";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  filterAppRoles,
  hasStaffRole,
  isAdminRole,
  isBranchRole,
} from "@/lib/auth/constants";
import {
  decodeJwtPayload,
  getAppRolesFromPayload,
  getUsernameFromPayload,
  isTokenExpired,
} from "@/lib/auth/jwt";
import { readTokens } from "@/lib/auth/tokens";

const BASE_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

/** Use Secure cookies only on HTTPS so HTTP IP deploys can keep a session. */
export function shouldUseSecureCookies(request: Request): boolean {
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() === "https";
  }

  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}

export async function setAuthCookies(
  tokens: AuthTokens,
  options?: { secure?: boolean },
): Promise<void> {
  const cookieStore = await cookies();
  const secure = options?.secure ?? false;
  const cookieOptions = { ...BASE_COOKIE_OPTIONS, secure };

  cookieStore.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...cookieOptions,
    maxAge: tokens.expiresIn,
  });

  cookieStore.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...cookieOptions,
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}

/** Refresh this long before expiry so a request never starts with a dying token. */
const REFRESH_LEEWAY_SECONDS = 30;

// Parallel requests (an overview page fires several) share one refresh, so a
// rotating refresh token is never redeemed twice.
const refreshes = new Map<string, Promise<AuthTokens | null>>();

async function redeemRefreshToken(refreshToken: string): Promise<AuthTokens | null> {
  const pending = refreshes.get(refreshToken);
  if (pending) return pending;

  const request = fetch(`${getApiBaseUrl()}/api/auth/v1/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  })
    .then(async (response) => {
      if (!response.ok) return null;
      const tokens = readTokens(await response.json().catch(() => null));
      return tokens ? { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, expiresIn: tokens.expiresIn } : null;
    })
    .catch(() => null);

  refreshes.set(refreshToken, request);
  // Keep the result briefly for requests that arrive right after.
  void request.finally(() => setTimeout(() => refreshes.delete(refreshToken), 10_000));
  return request;
}

function expiresSoon(token: string) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 - Date.now() < REFRESH_LEEWAY_SECONDS * 1000;
}

/**
 * The access token for upstream calls. Access tokens live ~5 minutes, so when
 * it is missing or about to expire the refresh token is redeemed and both
 * cookies are rotated (route handlers can write cookies; elsewhere the new
 * token is still used for this request).
 */
export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const access = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
  if (access && !expiresSoon(access)) return access;

  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) return access;

  const tokens = await redeemRefreshToken(refreshToken);
  if (!tokens) {
    // A dead refresh token would otherwise keep the route guard treating the
    // user as signed in and bounce between /login and /dashboard.
    try {
      await clearAuthCookies();
    } catch {
      // Read-only cookie context.
    }
    return access;
  }

  try {
    const forwarded = (await headers()).get("x-forwarded-proto");
    await setAuthCookies(
      { ...tokens, refreshToken: tokens.refreshToken ?? refreshToken },
      { secure: forwarded?.split(",")[0]?.trim() === "https" },
    );
  } catch {
    // Read-only cookie context (server component render); still use the token.
  }
  return tokens.accessToken;
}

export function sessionFromMeProfile(profile: MeProfile): SessionInfo {
  const roles = filterAppRoles(profile.roles);
  const staff = hasStaffRole(profile.roles);
  const branch = isBranchRole(profile.roles);

  return {
    username:
      profile.displayName?.trim() ||
      profile.phone?.trim() ||
      profile.email?.trim() ||
      profile.sub,
    roles,
    allRoles: profile.roles,
    isAdmin: isAdminRole(profile.roles),
    isBranch: branch && !staff,
    // Realm role mappers are not configured for every account yet, so a token
    // without recognized roles is treated as HQ staff; the gateway still
    // enforces authorization per endpoint.
    isStaff: staff || !branch,
    email: profile.email,
    phone: profile.phone,
    displayName: profile.displayName,
  };
}

export async function getSessionFromJwt(): Promise<SessionInfo | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  const payload = decodeJwtPayload(accessToken);
  if (!payload || isTokenExpired(payload)) return null;

  const roles = getAppRolesFromPayload(payload);
  const staff = hasStaffRole(roles);
  const branch = isBranchRole(roles);

  return {
    username: getUsernameFromPayload(payload),
    roles,
    allRoles: roles,
    isAdmin: isAdminRole(roles),
    isBranch: branch && !staff,
    isStaff: staff || !branch,
  };
}

export async function getSession(): Promise<SessionInfo | null> {
  return getSessionFromJwt();
}
