import "server-only";

import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api/errors";
import { gatewayRequest } from "@/lib/api/gateway";
import { errorFields, logEvent } from "@/lib/api/log";
import type { MeProfile, SessionInfo } from "@/lib/api/types";
import {
  UPSTREAM_FILE_TIMEOUT_MS,
  UPSTREAM_MESSAGES,
  newRequestId,
  readUpstreamJson,
  upstreamError,
  upstreamFetch,
  type UpstreamCall,
} from "@/lib/api/upstream";
import { filterAppRoles } from "@/lib/auth/constants";
import {
  AuthUnavailableError,
  clearAuthCookies,
  getAccessToken,
  hasPortalAccess,
  sessionFlags,
  sessionFromAccessToken,
} from "@/lib/auth/session";

/**
 * Who may call a BFF route. The gateway still makes the real decision; this
 * second check mirrors what the UI shows each role, so a token without the
 * role never reaches the endpoint through us.
 * - "signed-in": any valid session, even an account without an EZAC role
 * - "portal": ADMIN, FIELD_OFFICER or BRANCH
 * - "staff": head-office staff, ADMIN or FIELD_OFFICER (the UI's "hq" audience)
 * - "admin": ADMIN only
 */
export type BffAccess = "signed-in" | "portal" | "staff" | "admin";

export const SESSION_ENDED_MESSAGE = "Your session has ended. Sign in again.";
export const NO_ACCESS_MESSAGE = "Your account doesn't have access to this.";

/** JSON for one signed-in user: never stored by a browser, proxy or CDN. */
export function bffJson(body: unknown, init?: ResponseInit): NextResponse {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

/** The error envelope: `{ success: false, message, errors, code?, data?, requestId? }`. */
export function bffError(error: ApiError): NextResponse {
  return bffJson(
    {
      success: false,
      message: error.message,
      errors: error.errors,
      ...(error.code ? { code: error.code } : {}),
      ...(error.data != null ? { data: error.data } : {}),
      ...(error.requestId ? { requestId: error.requestId } : {}),
    },
    { status: error.status },
  );
}

async function clearSession() {
  try {
    await clearAuthCookies();
  } catch {
    // Read-only cookie context.
  }
}

/** Token expired and the sign-in service is down: keep the session, ask to retry. */
function authUnavailable(error: AuthUnavailableError): NextResponse {
  logEvent("error", "auth_unavailable", {
    message: "the sign-in service is not responding; answered 503 and kept the session",
  });
  return bffJson({ success: false, message: error.message }, { status: 503 });
}

function allows(session: SessionInfo, access: BffAccess): boolean {
  switch (access) {
    case "signed-in":
      return true;
    case "portal":
      return hasPortalAccess(session);
    case "staff":
      return session.isStaff;
    case "admin":
      return session.isAdmin;
  }
}

export type Caller = { accessToken: string; session: SessionInfo };

type Authorization = { ok: true; caller: Caller } | { ok: false; response: NextResponse };

/** How long the roles /me reported for one access token are reused. */
const ME_ROLES_TTL_MS = 5 * 60_000;
const ME_ROLES_MAX_ENTRIES = 1_000;
const meRolesByToken = new Map<string, { roles: string[]; until: number }>();

type MeRoles =
  | { kind: "roles"; roles: string[] }
  /** /me said 401: the token is no longer accepted. */
  | { kind: "ended" }
  /** /me accepted the token but refused the account (403 blocked, other 4xx). */
  | { kind: "refused" }
  /** /me timed out, failed or answered 5xx: can't tell, try again later. */
  | { kind: "unavailable" };

/**
 * Roles from /me for this token. Keycloak does not put the roles on every
 * account's token yet, and login and /bff/auth/session accept roles from
 * either place, so the role check asks /me before refusing. The answer is
 * cached per token (tokens live ~5 minutes) so this costs one call per token,
 * and only for tokens that lack the role.
 */
async function rolesFromMe(accessToken: string): Promise<MeRoles> {
  const now = Date.now();
  const cached = meRolesByToken.get(accessToken);
  if (cached && cached.until > now) return { kind: "roles", roles: cached.roles };

  try {
    const profile = await gatewayRequest<MeProfile>("/api/auth/v1/me", {
      accessToken,
      label: "bff role check",
      timeoutMs: 10_000,
    });
    const roles = Array.isArray(profile?.roles) ? profile.roles.filter((role) => typeof role === "string") : [];
    if (meRolesByToken.size >= ME_ROLES_MAX_ENTRIES) {
      for (const [token, entry] of meRolesByToken) {
        if (entry.until <= now) meRolesByToken.delete(token);
      }
      if (meRolesByToken.size >= ME_ROLES_MAX_ENTRIES) meRolesByToken.clear();
    }
    meRolesByToken.set(accessToken, { roles, until: now + ME_ROLES_TTL_MS });
    return { kind: "roles", roles };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) return { kind: "ended" };
      // 403 (blocked account) and other 4xx: /me gives this token no roles.
      if (error.status >= 400 && error.status < 500 && error.status !== 408 && error.status !== 429) {
        return { kind: "refused" };
      }
    }
    return { kind: "unavailable" };
  }
}

export type AuthorizeOptions = {
  /**
   * Confirm the token with the gateway (/me) even when its own roles already
   * allow the call. The BFF only decodes tokens, it can't check their
   * signature: that is the gateway's job, and it does it on every call that
   * carries the token. A route that calls a public gateway endpoint without
   * the token (registration) gets no such check, so a hand-made token with an
   * ADMIN claim would pass. /me answers are cached per token, so this costs
   * one gateway call per token.
   */
  verify?: boolean;
};

/**
 * The caller's access token and session (roles from the token, as the
 * gateway reads them), or the response to send instead: 401 not signed in,
 * 403 role not allowed, 503 sign-in service down.
 */
export async function authorizeCaller(access: BffAccess, options: AuthorizeOptions = {}): Promise<Authorization> {
  let accessToken: string | null;
  try {
    accessToken = await getAccessToken();
  } catch (error) {
    if (error instanceof AuthUnavailableError) return { ok: false, response: authUnavailable(error) };
    throw error;
  }

  // No usable token (or an unreadable cookie) is no session. Clearing what is
  // left stops the login page from sending the user straight back here.
  const session = accessToken ? sessionFromAccessToken(accessToken) : null;
  if (!accessToken || !session) {
    await clearSession();
    return { ok: false, response: bffJson({ success: false, message: SESSION_ENDED_MESSAGE }, { status: 401 }) };
  }

  const noAccess = (): Authorization => ({
    ok: false,
    response: bffJson({ success: false, message: NO_ACCESS_MESSAGE }, { status: 403 }),
  });

  let effective = session;
  if (options.verify || !allows(session, access)) {
    const me = await rolesFromMe(accessToken);
    if (me.kind === "ended") {
      await clearSession();
      return { ok: false, response: bffJson({ success: false, message: SESSION_ENDED_MESSAGE }, { status: 401 }) };
    }
    if (me.kind === "unavailable") {
      // Can't confirm the role right now: "no access" would be wrong and alarming.
      return { ok: false, response: authUnavailable(new AuthUnavailableError()) };
    }
    // A blocked account: its token's roles no longer count.
    if (me.kind === "refused") return noAccess();
    if (me.roles.length > 0) {
      const names = Array.from(new Set([...session.allRoles, ...me.roles]));
      effective = { ...session, roles: filterAppRoles(names), allRoles: names, ...sessionFlags(names) };
    }
  }
  if (!allows(effective, access)) return noAccess();

  return { ok: true, caller: { accessToken, session: effective } };
}

/** The response for anything a handler throws. Unexpected errors are logged with a request id. */
async function failureResponse(error: unknown, label: string, clearSessionOn401: boolean): Promise<NextResponse> {
  if (error instanceof AuthUnavailableError) return authUnavailable(error);
  if (error instanceof ApiError) {
    if (clearSessionOn401 && error.status === 401) await clearSession();
    return bffError(error);
  }
  const requestId = newRequestId();
  logEvent("error", "bff_unexpected_error", { label, requestId, ...errorFields(error, { stack: true }) });
  return bffJson({ success: false, message: UPSTREAM_MESSAGES.serverError, requestId }, { status: 500 });
}

export type AccessOptions = {
  /** Who may call the route; defaults to "portal". */
  access?: BffAccess;
  /** Tag for server logs. */
  label?: string;
};

/**
 * Run `handler` with the caller's access token and answer with
 * `{ success: true, data }`. Read request bodies inside the handler, so
 * nothing is buffered for a caller who isn't allowed in. Throw ApiError for
 * a specific status; an upstream 401 also ends the session.
 */
export async function withStaffAccess<T>(
  handler: (accessToken: string) => Promise<T>,
  options: AccessOptions = {},
): Promise<NextResponse> {
  const label = options.label ?? "bff";
  try {
    const auth = await authorizeCaller(options.access ?? "portal");
    if (!auth.ok) return auth.response;
    const data = await handler(auth.caller.accessToken);
    return bffJson({ success: true, data });
  } catch (error) {
    return failureResponse(error, label, true);
  }
}

/**
 * Like withStaffAccess, for public gateway endpoints that a signed-in staff
 * flow calls without the user's token (registration). The gateway never sees
 * the token there, so the role is confirmed with /me first (see
 * AuthorizeOptions.verify). An upstream 401 here is about the registration
 * token, not our session, so cookies are kept.
 */
export async function withStaffAccessPublic<T>(
  handler: () => Promise<T>,
  options: AccessOptions = {},
): Promise<NextResponse> {
  const label = options.label ?? "bff";
  try {
    const auth = await authorizeCaller(options.access ?? "portal", { verify: true });
    if (!auth.ok) return auth.response;
    const data = await handler();
    return bffJson({ success: true, data });
  } catch (error) {
    return failureResponse(error, label, false);
  }
}

// Uploaded documents are served from our own origin, so only render types that
// cannot execute script inline. Everything else is forced to download.
const INLINE_SAFE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
  "application/pdf",
]);

/** The lower-case media type without parameters, e.g. "image/png". */
export function baseContentType(contentType: string | null): string {
  return contentType?.split(";")[0]?.trim().toLowerCase() ?? "";
}

export function isInlineSafeType(contentType: string | null): boolean {
  return INLINE_SAFE_TYPES.has(baseContentType(contentType));
}

/** Proxy a binary upstream response (KYC files, profile pictures) for staff. */
export async function proxyStaffFile(
  path: string,
  request: Request,
  options: AccessOptions = {},
): Promise<Response> {
  const label = options.label ?? "staff-file";
  try {
    const auth = await authorizeCaller(options.access ?? "portal");
    if (!auth.ok) return auth.response;

    const upstreamUrl = new URL(path, "http://upstream.invalid");
    const download = new URL(request.url).searchParams.get("download");
    if (download) {
      upstreamUrl.searchParams.set("download", download);
    }

    const call: UpstreamCall = await upstreamFetch(
      `${upstreamUrl.pathname}${upstreamUrl.search}`,
      { headers: { Authorization: `Bearer ${auth.caller.accessToken}` } },
      { label, timeoutMs: UPSTREAM_FILE_TIMEOUT_MS },
    );

    if (!call.response.ok) {
      if (call.response.status === 401) await clearSession();
      const body = await readUpstreamJson(call).catch(() => null);
      return bffError(upstreamError(call, body?.kind === "json" ? body.value : null));
    }

    // The timeout covered the wait for an answer; the download itself may be slow.
    call.settle();
    return safeFileResponse(call.response);
  } catch (error) {
    return failureResponse(error, label, true);
  }
}

/** Stream a binary upstream response with headers that cannot run script. */
export function safeFileResponse(upstream: Response): Response {
  const headers = new Headers();
  const contentType = upstream.headers.get("Content-Type");
  const contentDisposition = upstream.headers.get("Content-Disposition");
  const contentLength = upstream.headers.get("Content-Length");

  if (contentType) headers.set("Content-Type", contentType);
  if (contentLength) headers.set("Content-Length", contentLength);
  // CSV exports say when they were cut at 10,000 rows.
  for (const name of ["X-Total-Count", "X-Export-Truncated"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("Cache-Control", "private, no-store");
  headers.set("X-Content-Type-Options", "nosniff");

  if (isInlineSafeType(contentType)) {
    if (contentDisposition) headers.set("Content-Disposition", contentDisposition);
  } else {
    headers.set(
      "Content-Disposition",
      contentDisposition?.replace(/^\s*inline/i, "attachment") ??
        "attachment",
    );
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}
