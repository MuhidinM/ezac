import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { safeFileResponse } from "@/lib/api/bff";
import { getApiBaseUrl } from "@/lib/api/config";
import { logGatewayUnreachable } from "@/lib/api/network-error";
import { clearAuthCookies, getAccessToken } from "@/lib/auth/session";

type ProxyOptions = {
  /** Upstream path prefix, e.g. /api/beneficiaries/v1 */
  upstreamPrefix: string;
  /** First path segments the proxy may reach. */
  allowedPrefixes: string[];
  /** Tag for server logs. */
  label: string;
};

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

function isAllowed(segments: string[], allowedPrefixes: string[]) {
  if (segments.some((segment) => segment === ".." || segment === ".")) {
    return false;
  }
  const path = segments.join("/");
  return allowedPrefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

/** Normalise framework error bodies (`{ status, error }`) into our envelope. */
function toEnvelope(body: unknown, status: number) {
  if (body && typeof body === "object" && "success" in body) return body;

  const record = (body ?? {}) as Record<string, unknown>;
  const message =
    (typeof record.message === "string" && record.message) ||
    (typeof record.error === "string" && record.error) ||
    (status >= 500 ? "Upstream service error" : "Request failed");

  return { success: false, message, errors: record.errors };
}

/**
 * Authenticated pass-through from our origin to one upstream service. The
 * browser never holds the access token, so this adds it from the httpOnly
 * cookie (refreshing it when needed). Roles and scoping are enforced
 * upstream; the prefix list only keeps the proxy away from unrelated
 * endpoints. JSON and multipart bodies are forwarded as-is, binary
 * responses are streamed with safe headers.
 */
export function createProxy({
  upstreamPrefix,
  allowedPrefixes,
  label,
}: ProxyOptions) {
  async function forward(request: NextRequest, context: RouteContext) {
    const { path } = await context.params;

    if (!isAllowed(path, allowedPrefixes)) {
      return NextResponse.json(
        { success: false, message: "Not found" },
        { status: 404 },
      );
    }

    const accessToken = await getAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      );
    }

    const upstreamUrl = new URL(
      `${getApiBaseUrl()}${upstreamPrefix}/${path.map(encodeURIComponent).join("/")}`,
    );
    upstreamUrl.search = request.nextUrl.search;

    const headers = new Headers({ Authorization: `Bearer ${accessToken}` });
    const contentType = request.headers.get("Content-Type");
    if (contentType) headers.set("Content-Type", contentType);

    const hasBody = request.method !== "GET" && request.method !== "HEAD";

    let upstream: Response;
    try {
      upstream = await fetch(upstreamUrl, {
        method: request.method,
        headers,
        body: hasBody ? await request.arrayBuffer() : undefined,
        cache: "no-store",
      });
    } catch (error) {
      logGatewayUnreachable(label, error);
      return NextResponse.json(
        { success: false, message: "Unable to reach the beneficiary service" },
        { status: 502 },
      );
    }

    if (upstream.status === 401) {
      await clearAuthCookies();
    }

    const upstreamType = upstream.headers.get("Content-Type") ?? "";
    if (upstream.ok && !upstreamType.includes("application/json")) {
      return safeFileResponse(upstream);
    }

    let body: unknown = null;
    try {
      body = await upstream.json();
    } catch {
      // empty or non-JSON error body
    }

    if (upstream.ok) {
      return NextResponse.json(body ?? { success: true, data: null }, {
        status: upstream.status,
      });
    }

    const envelope = toEnvelope(body, upstream.status);
    if (upstream.status >= 500) {
      // Surface upstream failures in the dev/server log; the browser only
      // sees the normalised message.
      console.error(
        `[${label}] ${upstream.status} ${request.method} ${upstreamUrl.pathname}${upstreamUrl.search}:`,
        (envelope as { message?: string }).message,
        body ?? "(empty body)",
      );
    }

    return NextResponse.json(envelope, { status: upstream.status });
  }

  return {
    GET: forward,
    POST: forward,
    PATCH: forward,
    PUT: forward,
    DELETE: forward,
  };
}
