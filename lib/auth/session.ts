import { cookies } from "next/headers";

import type { SessionInfo } from "@/lib/api/types";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth/constants";
import {
  decodeJwtPayload,
  getRolesFromPayload,
  getUsernameFromPayload,
  isTokenExpired,
} from "@/lib/auth/jwt";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export async function setAuthCookies(tokens: AuthTokens): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: tokens.expiresIn,
  });

  cookieStore.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...COOKIE_OPTIONS,
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

export async function getSession(): Promise<SessionInfo | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  const payload = decodeJwtPayload(accessToken);
  if (!payload || isTokenExpired(payload)) return null;

  const roles = getRolesFromPayload(payload);
  if (roles.length === 0) return null;

  return {
    username: getUsernameFromPayload(payload),
    roles,
    isAdmin: roles.includes("ADMIN"),
  };
}
