import "server-only";

import type { NextRequest } from "next/server";

import { authorizeCaller, bffError, bffJson, safeFileResponse, type BffAccess } from "@/lib/api/bff";
import { JSON_BODY_LIMIT, MULTIPART_BODY_LIMIT, isMultipart, readBodyCapped } from "@/lib/api/body";
import { ApiError } from "@/lib/api/errors";
import { errorFields, logEvent } from "@/lib/api/log";
import { isSafePathSegment } from "@/lib/api/path";
import {
  UPSTREAM_FILE_TIMEOUT_MS,
  UPSTREAM_MESSAGES,
  UPSTREAM_TIMEOUT_MS,
  newRequestId,
  readUpstreamJson,
  unreadableAnswer,
  upstreamError,
  upstreamFetch,
} from "@/lib/api/upstream";
import { clearAuthCookies, markPasswordChangeRequired } from "@/lib/auth/session";

/** The backend's rule: 1-128 letters, digits or . _ : - */
const IDEMPOTENCY_KEY = /^[A-Za-z0-9._:-]{1,128}$/;

type ProxyOptions = {
  /** Upstream path prefix, e.g. /api/beneficiaries/v1 */
  upstreamPrefix: string;
  /**
   * The paths the proxy may reach, by first segments, and who may call each.
   * The longest matching prefix wins.
   */
  allowedPrefixes: Record<string, BffAccess>;
  /** Tag for server logs. */
  label: string;
  /**
   * How long to wait for a JSON answer. Defaults to UPSTREAM_TIMEOUT_MS; raise
   * it for services that wait on a third party (a payout confirm waits on the bank).
   */
  timeoutMs?: number;
};

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

/**
 * The access rule for a path, or null when the proxy must not reach it.
 * Segments arrive decoded, so "%2F" would hide a "/" inside one segment;
 * those, "\", "%", control characters and dot segments are refused.
 */
function accessFor(segments: string[], allowedPrefixes: Record<string, BffAccess>): BffAccess | null {
  if (segments.length === 0 || !segments.every(isSafePathSegment)) return null;

  const path = segments.join("/");
  let match: string | null = null;
  for (const prefix of Object.keys(allowedPrefixes)) {
    const matches = path === prefix || path.startsWith(`${prefix}/`);
    if (matches && (match === null || prefix.length > match.length)) match = prefix;
  }
  return match === null ? null : allowedPrefixes[match];
}

/**
 * Authenticated pass-through from our origin to one upstream service. The
 * browser never holds the access token, so this adds it from the httpOnly
 * cookie (refreshing it when needed). Each prefix has a role rule that
 * mirrors the UI; the gateway still enforces roles and scoping. Bodies are
 * capped (1 MB JSON, 25 MB multipart), binary responses are streamed with
 * safe headers, and every error answer carries a request id.
 */
export function createProxy({
  upstreamPrefix,
  allowedPrefixes,
  label,
  timeoutMs = UPSTREAM_TIMEOUT_MS,
}: ProxyOptions) {
  async function handle(request: NextRequest, context: RouteContext, requestId: string) {
    const { path } = await context.params;

    const access = accessFor(path, allowedPrefixes);
    if (!access) {
      return bffJson({ success: false, message: "We couldn't find that." }, { status: 404 });
    }

    const auth = await authorizeCaller(access);
    if (!auth.ok) return auth.response;

    const multipart = isMultipart(request);
    const hasBody = request.method !== "GET" && request.method !== "HEAD";
    const body = hasBody
      ? await readBodyCapped(request, multipart ? MULTIPART_BODY_LIMIT : JSON_BODY_LIMIT)
      : undefined;

    const headers = new Headers({ Authorization: `Bearer ${auth.caller.accessToken}` });
    const contentType = request.headers.get("Content-Type");
    if (contentType) headers.set("Content-Type", contentType);
    // Create calls send a key so a retry never creates twice; the backend checks its shape too.
    const idempotencyKey = request.headers.get("Idempotency-Key");
    if (idempotencyKey && IDEMPOTENCY_KEY.test(idempotencyKey)) headers.set("Idempotency-Key", idempotencyKey);

    const call = await upstreamFetch(
      `${upstreamPrefix}/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`,
      { method: request.method, headers, body },
      { label, requestId, timeoutMs: multipart ? Math.max(UPSTREAM_FILE_TIMEOUT_MS, timeoutMs) : timeoutMs },
    );
    const upstream = call.response;

    if (upstream.status === 401) {
      await clearAuthCookies();
    }

    const noContent =
      upstream.status === 204 || upstream.status === 205 || upstream.headers.get("Content-Length") === "0";
    if (upstream.ok && noContent) {
      call.settle();
      await upstream.body?.cancel().catch(() => undefined);
      return bffJson({ success: true, data: null });
    }

    const upstreamType = upstream.headers.get("Content-Type") ?? "";
    if (upstream.ok && !upstreamType.includes("application/json")) {
      // The timeout covered the wait for an answer; the download itself may be slow.
      call.settle();
      return safeFileResponse(upstream);
    }

    const parsed = await readUpstreamJson(call);

    if (upstream.ok) {
      if (parsed.kind === "empty") return bffJson({ success: true, data: null });
      if (parsed.kind === "invalid") return bffError(unreadableAnswer(call));
      return bffJson(parsed.value ?? { success: true, data: null }, { status: upstream.status });
    }

    const error = upstreamError(call, parsed.kind === "json" ? parsed.value : null);
    if (error.status === 403 && error.code === "ACCOUNT_DEACTIVATED") {
      // The branch or officer record was switched off: end the session like a 401.
      await clearAuthCookies();
    } else if (error.status === 403 && error.code === "PASSWORD_CHANGE_REQUIRED") {
      // Set the gate so the route guard sends every page to the change-password form.
      await markPasswordChangeRequired();
    }
    return bffError(error);
  }

  async function forward(request: NextRequest, context: RouteContext) {
    const requestId = newRequestId();
    try {
      return await handle(request, context, requestId);
    } catch (error) {
      // ApiError: body too large, gateway unreachable or timed out (already logged).
      if (error instanceof ApiError) return bffError(error);
      logEvent("error", "bff_unexpected_error", { label, requestId, ...errorFields(error, { stack: true }) });
      return bffJson({ success: false, message: UPSTREAM_MESSAGES.serverError, requestId }, { status: 500 });
    }
  }

  return {
    GET: forward,
    POST: forward,
    PATCH: forward,
    PUT: forward,
    DELETE: forward,
  };
}
