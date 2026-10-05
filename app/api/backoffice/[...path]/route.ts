import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { safeFileResponse } from "@/lib/api/bff";
import { getApiBaseUrl } from "@/lib/api/config";
import { clearAuthCookies, getAccessToken } from "@/lib/auth/session";

/**
 * Pass-through to beneficiary-service for the means-testing back office
 * (field officers, assessments, scoring, duplicate review).
 *
 * The browser never holds the access token, so this adds it from the
 * httpOnly cookie. Role and branch/region scoping are enforced upstream; the
 * prefix list only keeps the proxy from reaching unrelated endpoints.
 */
const UPSTREAM_PREFIX = "/api/beneficiaries/v1";

const ALLOWED_PREFIXES = [
  "admin/field-officers",
  "admin/staff-assignments",
  "admin/scoring-configs",
  "admin/branches",
  "assessments",
  "beneficiaries",
];

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

function isAllowed(segments: string[]) {
  if (segments.some((segment) => segment === ".." || segment === ".")) {
    return false;
  }
  const path = segments.join("/");
  return ALLOWED_PREFIXES.some(
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

async function forward(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;

  if (!isAllowed(path)) {
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
    `${getApiBaseUrl()}${UPSTREAM_PREFIX}/${path.map(encodeURIComponent).join("/")}`,
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
  } catch {
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
      `[backoffice] ${upstream.status} ${request.method} ${upstreamUrl.pathname}${upstreamUrl.search}:`,
      (envelope as { message?: string }).message,
      body ?? "(empty body)",
    );
  }

  return NextResponse.json(envelope, { status: upstream.status });
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const PUT = forward;
export const DELETE = forward;
