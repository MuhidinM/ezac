import { NextResponse } from "next/server";

import { withStaffAccess } from "@/lib/api/bff";
import { gatewayRequest } from "@/lib/api/gateway";
import type { ChangePasswordBody } from "@/lib/api/types";
import { clearAuthCookies } from "@/lib/auth/session";

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

  const response = await withStaffAccess((accessToken) =>
    gatewayRequest<unknown>("/api/auth/v1/me/password", {
      method: "POST",
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmNewPassword,
      }),
      accessToken,
    }),
  );

  if (response.status >= 200 && response.status < 300) {
    await clearAuthCookies();
  }

  return response;
}
