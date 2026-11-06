import "server-only";

import { decodeJwtPayload } from "@/lib/auth/jwt";

/**
 * Tokens from the auth service's login and refresh endpoints. They may come
 * wrapped in the `{ success, data }` envelope or as the raw token object, with
 * camelCase or OAuth-style snake_case names; this reads all of them.
 */
export type IssuedTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  /**
   * Seconds until the refresh token expires, when the auth service says so
   * (refreshExpiresIn / refresh_expires_in) or the refresh token is a JWT with
   * an `exp`. Undefined when neither is known.
   */
  refreshExpiresIn?: number;
  passwordChangeRequired: boolean;
};

function pick(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function positiveSeconds(value: unknown): number | undefined {
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : undefined;
}

/**
 * The refresh token's remaining life. Keycloak issues refresh tokens as JWTs
 * whose `exp` follows the realm's SSO idle and max settings, so reading it
 * keeps the cookie from outliving the session the IdP will still honour.
 */
function refreshLifetime(record: Record<string, unknown>, refreshToken: string): number | undefined {
  const stated = positiveSeconds(pick(record, "refreshExpiresIn", "refresh_expires_in"));
  if (stated) return stated;
  const exp = decodeJwtPayload(refreshToken)?.exp;
  if (!exp) return undefined;
  return positiveSeconds(exp - Math.floor(Date.now() / 1000));
}

export function readTokens(body: unknown): IssuedTokens | null {
  if (!body || typeof body !== "object") return null;
  const outer = body as Record<string, unknown>;
  if (outer.success === false) return null;
  const record = (outer.data && typeof outer.data === "object" ? outer.data : outer) as Record<string, unknown>;

  const accessToken = pick(record, "accessToken", "access_token");
  const refreshToken = pick(record, "refreshToken", "refresh_token");
  if (typeof accessToken !== "string" || !accessToken || typeof refreshToken !== "string" || !refreshToken) return null;

  const expiresIn = Number(pick(record, "expiresIn", "expires_in") ?? 300);
  const passwordChangeRequired = pick(record, "passwordChangeRequired", "password_change_required", "mustChangePassword");
  return {
    accessToken,
    refreshToken,
    expiresIn: Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 300,
    refreshExpiresIn: refreshLifetime(record, refreshToken),
    passwordChangeRequired: passwordChangeRequired === true,
  };
}

/** A readable message from an error body: the envelope's `message`, or a framework error's `message` / `error`. */
export function errorText(body: unknown, fallback: string) {
  if (!body || typeof body !== "object") return fallback;
  const record = body as Record<string, unknown>;
  for (const key of ["message", "error_description", "error"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
}
