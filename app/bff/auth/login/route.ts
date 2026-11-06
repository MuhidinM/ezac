import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api/errors";
import { gatewayRequest } from "@/lib/api/gateway";
import { logEvent, oneLine } from "@/lib/api/log";
import type { MeProfile } from "@/lib/api/types";
import { newRequestId, readUpstreamJson, upstreamFetch } from "@/lib/api/upstream";
import { authError, clientIp, isJsonRequest } from "@/lib/auth/http";
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

  let meRoles: string[] = [];
  try {
    const profile = await gatewayRequest<MeProfile>("/api/auth/v1/me", {
      accessToken,
      headers: forwardedHeaders(ip),
      label: "auth/login me",
      timeoutMs: AUTH_REQUEST_TIMEOUT_MS,
    });
    meRoles = Array.isArray(profile?.roles) ? profile.roles : [];
  } catch (error) {
    // Unreachable, timed out (502/504, already logged), 5xx, 408 or 429: try again later.
    if (!(error instanceof ApiError) || error.status >= 500 || error.status === 408 || error.status === 429) {
      return { kind: "unavailable" };
    }
    // Any other refusal: /me gives this account no roles.
  }

  const flags = sessionFlags([...tokenRoles, ...meRoles]);
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
  // Sent to the gateway as X-Request-Id and written on every log line below.
  const requestId = newRequestId();
  let upstream: Response;
  let payload: unknown = null;
  try {
    const call = await upstreamFetch(
      "/api/auth/v1/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...forwardedHeaders(ip) },
        body: JSON.stringify({ username, password }),
      },
      { label: "auth/login", requestId, timeoutMs: AUTH_REQUEST_TIMEOUT_MS },
    );
    upstream = call.response;
    const body = await readUpstreamJson(call);
    if (body.kind === "json") payload = body.value;
  } catch (error) {
    // ApiError 502 (unreachable) or 504 (timed out), already logged with the request id.
    return error instanceof ApiError && error.status === 504 ? authError(504, TIMED_OUT) : authError(502, SERVICE_DOWN);
  }

  if (!upstream.ok) {
    if (upstream.status === 400 || upstream.status === 401 || upstream.status === 403) {
      outcome.value = "failure";
      // The real reason (disabled, locked, unknown user) stays in the server
      // log; the browser gets one message so it can't probe which accounts exist.
      logEvent("warn", "login_refused", {
        requestId,
        status: upstream.status,
        account,
        ip,
        reason: oneLine(errorText(payload, "no reason given"), 200),
      });
      return authError(401, INVALID_CREDENTIALS);
    }
    if (upstream.status === 429) {
      return authError(429, tooManyAttemptsMessage(15 * 60), { "Retry-After": String(15 * 60) });
    }
    logEvent("error", "login_failed", {
      requestId,
      status: upstream.status,
      reason: oneLine(errorText(payload, "no reason given"), 200),
    });
    if (upstream.status === 504 || upstream.status === 408) return authError(504, TIMED_OUT);
    if (upstream.status >= 500) return authError(502, SERVICE_DOWN);
    return authError(502, "Sign-in failed. Try again.");
  }

  const tokens = readTokens(payload);
  if (!tokens) {
    // Log the shape only; the body may hold credentials-adjacent data.
    const keys = payload && typeof payload === "object" ? Object.keys(payload as object).slice(0, 20) : [typeof payload];
    logEvent("error", "login_unreadable", { requestId, message: "login returned no tokens", keys });
    return authError(502, "The authentication service sent an unexpected response");
  }

  const role = await checkPortalRole(tokens.accessToken, ip);
  if (role.kind === "unavailable") {
    return authError(503, SERVICE_DOWN);
  }
  if (role.kind === "no-role") {
    logEvent("warn", "login_no_role", {
      requestId,
      account,
      message: "signed in but has no ADMIN, FIELD_OFFICER or BRANCH role; refused",
    });
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
