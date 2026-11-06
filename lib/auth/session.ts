import "server-only";

import { cookies, headers } from "next/headers";

import { getApiBaseUrl } from "@/lib/api/config";

import type { MeProfile, SessionInfo } from "@/lib/api/types";
import {
  ACCESS_TOKEN_COOKIE,
  PASSWORD_CHANGE_COOKIE,
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
  /** Seconds the refresh token stays valid, when the auth service tells us. */
  refreshExpiresIn?: number;
};

/** The refresh cookie never lives longer than this, whatever the IdP allows. */
const MAX_REFRESH_COOKIE_SECONDS = 60 * 60 * 24 * 7;

/**
 * The refresh cookie follows the refresh token's own lifetime (capped at 7
 * days), so the browser forgets it once the IdP would refuse it anyway.
 */
function refreshCookieMaxAge(tokens: AuthTokens): number {
  const lifetime = tokens.refreshExpiresIn;
  if (!lifetime || !Number.isFinite(lifetime) || lifetime <= 0) return MAX_REFRESH_COOKIE_SECONDS;
  return Math.min(Math.floor(lifetime), MAX_REFRESH_COOKIE_SECONDS);
}

/**
 * Thrown by getAccessToken when the access token has expired and the sign-in
 * service can't be reached to renew it (network error, timeout, 5xx). The
 * session itself is still good, so callers answer 503 and keep the cookies
 * instead of signing the user out.
 */
export class AuthUnavailableError extends Error {
  constructor(message = "The sign-in service is not responding. Try again in a moment.") {
    super(message);
    this.name = "AuthUnavailableError";
  }
}

/** Calls to the auth service give up after this long. */
export const AUTH_REQUEST_TIMEOUT_MS = 10_000;

/**
 * An HTTP-only test host (no TLS in front of the app) can opt out of Secure
 * cookies with ALLOW_INSECURE_AUTH_COOKIES=true. Never set it in production.
 */
function insecureCookiesAllowed(): boolean {
  return process.env.ALLOW_INSECURE_AUTH_COOKIES === "true";
}

function isHttpsRequest(forwardedProto: string | null, url?: string): boolean {
  if (forwardedProto) {
    return forwardedProto.split(",")[0]?.trim() === "https";
  }
  if (!url) return false;
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

function secureCookies(forwardedProto: string | null, url?: string): boolean {
  if (process.env.NODE_ENV === "production" && !insecureCookiesAllowed()) return true;
  return isHttpsRequest(forwardedProto, url);
}

/**
 * Auth cookies are always Secure in production. Outside production (and on an
 * HTTP test host that set ALLOW_INSECURE_AUTH_COOKIES=true) the request's
 * protocol decides, so `next dev` on http://localhost keeps a session.
 */
export function shouldUseSecureCookies(request: Request): boolean {
  return secureCookies(request.headers.get("x-forwarded-proto"), request.url);
}

export async function setAuthCookies(
  tokens: AuthTokens,
  options?: { secure?: boolean; passwordChangeRequired?: boolean },
): Promise<void> {
  const cookieStore = await cookies();
  const secure = options?.secure ?? false;
  const cookieOptions = { ...BASE_COOKIE_OPTIONS, secure };
  const refreshMaxAge = refreshCookieMaxAge(tokens);

  if (options?.passwordChangeRequired) {
    cookieStore.set(PASSWORD_CHANGE_COOKIE, "1", { ...cookieOptions, maxAge: refreshMaxAge });
  } else if (options?.passwordChangeRequired === false) {
    cookieStore.delete(PASSWORD_CHANGE_COOKIE);
  }

  cookieStore.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...cookieOptions,
    maxAge: tokens.expiresIn,
  });

  cookieStore.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...cookieOptions,
    maxAge: refreshMaxAge,
  });
}

export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
  cookieStore.delete(PASSWORD_CHANGE_COOKIE);
}

/** Refresh this long before expiry so a request never starts with a dying token. */
const REFRESH_LEEWAY_SECONDS = 30;

type RefreshResult =
  | { kind: "ok"; tokens: AuthTokens; passwordChangeRequired: boolean }
  /** The auth service refused the refresh token: the session is over. */
  | { kind: "rejected" }
  /** Network error, timeout, 5xx, 408/429 or an unreadable answer: try again later. */
  | { kind: "unavailable" };

// Parallel requests (an overview page fires several) share one refresh, so a
// rotating refresh token is never redeemed twice.
const refreshes = new Map<string, Promise<RefreshResult>>();

async function redeemRefreshToken(refreshToken: string): Promise<RefreshResult> {
  const pending = refreshes.get(refreshToken);
  if (pending) return pending;

  const request: Promise<RefreshResult> = fetch(`${getApiBaseUrl()}/api/auth/v1/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
    signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT_MS),
  })
    .then(async (response): Promise<RefreshResult> => {
      if (response.status >= 500 || response.status === 408 || response.status === 429) {
        return { kind: "unavailable" };
      }
      if (!response.ok) return { kind: "rejected" };
      const tokens = readTokens(await response.json().catch(() => null));
      return tokens
        ? {
            kind: "ok",
            tokens: {
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              expiresIn: tokens.expiresIn,
              refreshExpiresIn: tokens.refreshExpiresIn,
            },
            passwordChangeRequired: tokens.passwordChangeRequired,
          }
        : { kind: "unavailable" };
    })
    .catch((): RefreshResult => ({ kind: "unavailable" }));

  refreshes.set(refreshToken, request);
  // Keep a settled answer briefly for requests that arrive right after; let the
  // next request retry at once after an outage.
  void request.then((result) => {
    if (result.kind === "unavailable") refreshes.delete(refreshToken);
    else setTimeout(() => refreshes.delete(refreshToken), 10_000);
  });
  return request;
}

function expiresSoon(token: string) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 - Date.now() < REFRESH_LEEWAY_SECONDS * 1000;
}

function stillValid(token: string | null): token is string {
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  return !!payload && !isTokenExpired(payload);
}

/**
 * The access token for upstream calls, or null when the user is not signed in.
 * Access tokens live ~5 minutes, so when it is missing or about to expire the
 * refresh token is redeemed and both cookies are rotated (route handlers can
 * write cookies; elsewhere the new token is still used for this request).
 *
 * - Refresh refused by the auth service: cookies are cleared, returns null.
 * - Auth service unreachable: returns the current token while it is still
 *   valid; once it has expired, throws AuthUnavailableError so the caller can
 *   answer 503 without signing the user out.
 */
export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const access = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
  if (access && !expiresSoon(access)) return access;

  const usable = stillValid(access) ? access : null;
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) return usable;

  const result = await redeemRefreshToken(refreshToken);
  if (result.kind === "rejected") {
    // A dead refresh token would otherwise keep the route guard treating the
    // user as signed in and bounce between /login and /dashboard.
    try {
      await clearAuthCookies();
    } catch {
      // Read-only cookie context.
    }
    return null;
  }

  if (result.kind === "unavailable") {
    if (usable) return usable;
    throw new AuthUnavailableError();
  }

  const { tokens } = result;
  // The password-change gate must live exactly as long as the session: the
  // refresh cookie's lifetime is renewed here, so renew the gate with it. Never
  // clear it from here (a refresh answer without the flag reads as false);
  // only a successful password change or sign-out clears it.
  const gated = !!cookieStore.get(PASSWORD_CHANGE_COOKIE)?.value || result.passwordChangeRequired;
  try {
    const forwarded = (await headers()).get("x-forwarded-proto");
    await setAuthCookies(
      { ...tokens, refreshToken: tokens.refreshToken ?? refreshToken },
      { secure: secureCookies(forwarded), passwordChangeRequired: gated ? true : undefined },
    );
  } catch {
    // Read-only cookie context (server component render); still use the token.
  }
  return tokens.accessToken;
}

/**
 * Accounts without an EZAC role (ADMIN, FIELD_OFFICER, BRANCH) get no access.
 * TRUST_ROLELESS_ACCOUNTS=true restores the old behaviour of treating them as
 * HQ staff, for a test realm whose role mappers are not set up yet. Never set
 * it in production.
 */
export function trustsRolelessAccounts(): boolean {
  return process.env.TRUST_ROLELESS_ACCOUNTS === "true";
}

/** The access flags for a set of role names (from the token, /me, or both). */
export function sessionFlags(roleNames: string[]): Pick<SessionInfo, "isAdmin" | "isBranch" | "isStaff"> {
  const staff = hasStaffRole(roleNames);
  const branch = isBranchRole(roleNames);
  const roleless = filterAppRoles(roleNames).length === 0;
  return {
    isAdmin: isAdminRole(roleNames),
    isBranch: branch && !staff,
    isStaff: staff || (roleless && trustsRolelessAccounts()),
  };
}

/** True when the session may use the staff portal at all. */
export function hasPortalAccess(session: SessionInfo | null): session is SessionInfo {
  return !!session && (session.isAdmin || session.isStaff || session.isBranch);
}

export function sessionFromMeProfile(profile: MeProfile): SessionInfo {
  const roles = filterAppRoles(profile.roles);

  return {
    username:
      profile.displayName?.trim() ||
      profile.phone?.trim() ||
      profile.email?.trim() ||
      profile.sub,
    roles,
    allRoles: profile.roles,
    ...sessionFlags(profile.roles),
    email: profile.email,
    phone: profile.phone,
    displayName: profile.displayName,
  };
}

/**
 * The session described by an access token (roles from the JWT), or null when
 * the token is unreadable or expired. Pure: no cookies, no network. The BFF
 * uses it for its role checks, which mirror what the gateway reads.
 */
export function sessionFromAccessToken(accessToken: string): SessionInfo | null {
  const payload = decodeJwtPayload(accessToken);
  if (!payload || isTokenExpired(payload)) return null;

  const roles = getAppRolesFromPayload(payload);

  return {
    username: getUsernameFromPayload(payload),
    roles,
    allRoles: roles,
    ...sessionFlags(roles),
  };
}

/**
 * The signed-in user's session from the access token, for a server component
 * (e.g. the dashboard layout, to render before /bff/auth/session answers).
 * Roles come from the token only: an account whose roles are only on /me
 * reads as role-less here, so treat it as a first guess, not a decision.
 */
export async function getSessionFromJwt(): Promise<SessionInfo | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;
  return sessionFromAccessToken(accessToken);
}
