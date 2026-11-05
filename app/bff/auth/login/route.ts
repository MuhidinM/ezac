import { NextResponse } from "next/server";

import { getApiBaseUrl } from "@/lib/api/config";
import { logGatewayUnreachable } from "@/lib/api/network-error";
import type { MeProfile } from "@/lib/api/types";
import { authError, clientIp, isJsonRequest, isTimeout } from "@/lib/auth/http";
import { type AttemptOutcome, UNKNOWN_IP, loginLimiter, tooManyAttemptsMessage } from "@/lib/auth/rate-limit";
import {
  AUTH_REQUEST_TIMEOUT_MS,
  hasPortalAccess,
  sessionFlags,
  sessionFromAccessToken,
  setAuthCookies,
  shouldUseSecureCookies,
} from "@/lib/auth/session";
import { errorText, readTokens } from "@/lib/auth/tokens";
import { isValidEthiopianPhone, normalizePhoneToE164 } from "@/lib/registration/phone";

type LoginBody = {
  username?: unknown;
  password?: unknown;
};

const INVALID_CREDENTIALS = "Invalid username or password";
const SERVICE_DOWN = "The sign-in service is not responding. Try again in a moment.";
const TIMED_OUT = "The sign-in service did not answer in time. Try again.";
const NO_STAFF_ROLE = "This account has no EZAC staff role. Ask an administrator to assign one.";

/**
 * The gateway accepts `09…` and `+251…` for the same phone login, so count
 * failures against one key per account, not per spelling.
 */
function accountKey(username: string): string {
  const trimmed = username.trim();
  return isValidEthiopianPhone(trimmed) ? normalizePhoneToE164(trimmed) : trimmed.toLowerCase();
}

function forwardedHeaders(ip: string): Record<string, string> {
  return ip === UNKNOWN_IP ? {} : { "X-Forwarded-For": ip };
}

type RoleCheck = { kind: "allowed" } | { kind: "no-role" } | { kind: "unavailable" };

/**
 * Only ADMIN, FIELD_OFFICER and BRANCH accounts may use the staff portal.
 * Roles can be on the access token, on /me, or split between them (see
 * app/bff/auth/session/route.ts), so /me is asked only when the token alone
 * doesn't grant access.
 */
async function checkPortalRole(accessToken: string, ip: string): Promise<RoleCheck> {
  const fromToken = sessionFromAccessToken(accessToken);
  const tokenRoles = fromToken?.allRoles ?? [];
  if (hasPortalAccess(fromToken)) return { kind: "allowed" };

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}/api/auth/v1/me`, {
      headers: { Authorization: `Bearer ${accessToken}`, ...forwardedHeaders(ip) },
      cache: "no-store",
      signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    logGatewayUnreachable("auth/login me", error);
    return { kind: "unavailable" };
  }

  if (response.status >= 500 || response.status === 408 || response.status === 429) {
    return { kind: "unavailable" };
  }

  const body = (await response.json().catch(() => null)) as { data?: MeProfile } | null;
  const meRoles = response.ok && Array.isArray(body?.data?.roles) ? body.data.roles : [];
  const roles = [...tokenRoles, ...meRoles];
  const flags = sessionFlags(roles);
  return flags.isAdmin || flags.isStaff || flags.isBranch ? { kind: "allowed" } : { kind: "no-role" };
}

/** POST /api/auth/v1/login `{ username, password }`; tokens go into httpOnly cookies. */
export async function POST(request: Request) {
  // A JSON-only body stops a cross-site <form enctype="text/plain"> from
  // signing the browser into someone else's account.
  if (!isJsonRequest(request)) {
    return authError(415, "Send the sign-in details as JSON.");
  }

  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return authError(400, "Invalid request body");
  }

  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!username || !password) {
    return authError(400, "Username and password are required");
  }
  if (username.length > 256 || password.length > 1024) {
    return authError(400, INVALID_CREDENTIALS);
  }

  const ip = clientIp(request);
  const account = accountKey(username);
  const attempt = loginLimiter.begin(ip, account);
  if (attempt.retryAfter > 0) {
    return authError(429, tooManyAttemptsMessage(attempt.retryAfter), { "Retry-After": String(attempt.retryAfter) });
  }

  // The attempt holds a place in the limiter until it finishes, whatever the
  // outcome, so parallel guesses count before the gateway has answered.
  const outcome: { value: AttemptOutcome } = { value: "neutral" };
  try {
    return await signIn(request, username, password, ip, account, outcome);
  } finally {
    attempt.finish(outcome.value);
  }
}

async function signIn(
  request: Request,
  username: string,
  password: string,
  ip: string,
  account: string,
  outcome: { value: AttemptOutcome },
): Promise<NextResponse> {
  let upstream: Response;
  try {
    upstream = await fetch(`${getApiBaseUrl()}/api/auth/v1/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...forwardedHeaders(ip) },
      body: JSON.stringify({ username, password }),
      cache: "no-store",
      signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    logGatewayUnreachable("auth/login", error);
    return isTimeout(error) ? authError(504, TIMED_OUT) : authError(502, SERVICE_DOWN);
  }

  const payload = (await upstream.json().catch(() => null)) as unknown;

  if (!upstream.ok) {
    if (upstream.status === 400 || upstream.status === 401 || upstream.status === 403) {
      outcome.value = "failure";
      // The real reason (disabled, locked, unknown user) stays in the server
      // log; the browser gets one message so it can't probe which accounts exist.
      console.warn(
        `[auth/login] refused ${upstream.status} for "${account}" from ${ip}: ${errorText(payload, "no reason given")}`,
      );
      return authError(401, INVALID_CREDENTIALS);
    }
    if (upstream.status === 429) {
      return authError(429, tooManyAttemptsMessage(15 * 60), { "Retry-After": String(15 * 60) });
    }
    console.error(`[auth/login] gateway answered ${upstream.status}: ${errorText(payload, "no reason given")}`);
    if (upstream.status === 504 || upstream.status === 408) return authError(504, TIMED_OUT);
    if (upstream.status >= 500) return authError(502, SERVICE_DOWN);
    return authError(502, "Sign-in failed. Try again.");
  }

  const tokens = readTokens(payload);
  if (!tokens) {
    // Log the shape only; the body may hold credentials-adjacent data.
    const keys = payload && typeof payload === "object" ? Object.keys(payload as object) : typeof payload;
    console.error("[auth/login] login returned no tokens; response keys:", keys);
    return authError(502, "The authentication service sent an unexpected response");
  }

  const role = await checkPortalRole(tokens.accessToken, ip);
  if (role.kind === "unavailable") {
    return authError(503, SERVICE_DOWN);
  }
  if (role.kind === "no-role") {
    console.warn(`[auth/login] "${account}" signed in but has no ADMIN, FIELD_OFFICER or BRANCH role; refused`);
    return authError(403, NO_STAFF_ROLE);
  }

  outcome.value = "success";

  await setAuthCookies(
    {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      refreshExpiresIn: tokens.refreshExpiresIn,
    },
    { secure: shouldUseSecureCookies(request), passwordChangeRequired: tokens.passwordChangeRequired },
  );

  return NextResponse.json(
    {
      success: true,
      data: { passwordChangeRequired: tokens.passwordChangeRequired },
      message: "Login successful",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
