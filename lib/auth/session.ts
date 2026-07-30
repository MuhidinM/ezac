import { cookies } from "next/headers";

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

export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
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
