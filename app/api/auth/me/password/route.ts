import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api/errors";
import { gatewayRequest } from "@/lib/api/gateway";
import type { ChangePasswordBody } from "@/lib/api/types";
import { clearAuthCookies, getAccessToken } from "@/lib/auth/session";

export async function POST(request: Request) {
  let body: ChangePasswordBody;

  try {
    body = (await request.json()) as ChangePasswordBody;
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body" },
      { status: 400 },
    );
  }

  const currentPassword = body.currentPassword ?? "";
  const newPassword = body.newPassword ?? "";
  const confirmNewPassword = body.confirmNewPassword ?? "";

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return NextResponse.json(
      { success: false, message: "All password fields are required" },
      { status: 400 },
    );
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { success: false, message: "New password must be at least 6 characters" },
      { status: 400 },
    );
  }

  if (newPassword !== confirmNewPassword) {
    return NextResponse.json(
      { success: false, message: "New password and confirmation do not match" },
      { status: 400 },
    );
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    await gatewayRequest<unknown>("/api/auth/v1/me/password", {
      method: "POST",
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmNewPassword,
      }),
      accessToken,
    });
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
      { success: false, message: "Unable to reach authentication service" },
      { status: 502 },
    );
  }

  // The old token is no longer valid for the new credentials.
  await clearAuthCookies();

  return NextResponse.json({
    success: true,
    data: null,
    message: "Password updated. Please sign in again.",
  });
}
