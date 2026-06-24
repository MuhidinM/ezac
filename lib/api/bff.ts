import { NextResponse } from "next/server";

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
