import { NextResponse } from "next/server";

import { getApiBaseUrl } from "@/lib/api/config";
import { ApiError } from "@/lib/api/errors";
import { gatewayRequest } from "@/lib/api/gateway";
import { clearAuthCookies, getAccessToken } from "@/lib/auth/session";

export async function withStaffAccess<T>(
  handler: (accessToken: string) => Promise<T>,
): Promise<NextResponse> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const data = await handler(accessToken);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        await clearAuthCookies();
      }

      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { success: false, message: "Unexpected server error" },
      { status: 500 },
    );
  }
}

export async function staffGatewayRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new ApiError("Authentication required", 401);
  }

  return gatewayRequest<T>(path, { ...init, accessToken });
}

export async function withStaffAccessPublic<T>(
  handler: () => Promise<T>,
): Promise<NextResponse> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const data = await handler();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { success: false, message: "Unexpected server error" },
      { status: 500 },
    );
  }
}

/** Proxy a binary upstream response (KYC files, profile pictures) for staff. */
export async function proxyStaffFile(
  path: string,
  request: Request,
): Promise<Response> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: "Authentication required" },
      { status: 401 },
    );
  }

  const upstreamUrl = new URL(`${getApiBaseUrl()}${path}`);
  const download = new URL(request.url).searchParams.get("download");
  if (download) {
    upstreamUrl.searchParams.set("download", download);
  }

  const upstream = await fetch(upstreamUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!upstream.ok) {
    if (upstream.status === 401) {
      await clearAuthCookies();
    }

    let message = "Failed to fetch file";
    try {
      const envelope = (await upstream.json()) as { message?: string };
      if (envelope.message) message = envelope.message;
    } catch {
      // binary error body — keep default message
    }

    return NextResponse.json(
      { success: false, message },
      { status: upstream.status },
    );
  }

  const headers = new Headers();
  const contentType = upstream.headers.get("Content-Type");
  const contentDisposition = upstream.headers.get("Content-Disposition");
  const contentLength = upstream.headers.get("Content-Length");

  if (contentType) headers.set("Content-Type", contentType);
  if (contentDisposition) headers.set("Content-Disposition", contentDisposition);
  if (contentLength) headers.set("Content-Length", contentLength);
  headers.set("Cache-Control", "private, no-store");

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}
