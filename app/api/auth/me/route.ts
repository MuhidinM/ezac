import { NextResponse } from "next/server";

import { withStaffAccess } from "@/lib/api/bff";
import { gatewayRequest } from "@/lib/api/gateway";
import type { MeProfile, UpdateMeBody } from "@/lib/api/types";

export async function GET() {
  return withStaffAccess((accessToken) =>
    gatewayRequest<MeProfile>("/api/auth/v1/me", { accessToken }),
  );
}

export async function PATCH(request: Request) {
  let body: UpdateMeBody;

  try {
    body = (await request.json()) as UpdateMeBody;
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body" },
      { status: 400 },
    );
  }

  const payload: UpdateMeBody = {};
  if (typeof body.displayName === "string") {
    payload.displayName = body.displayName.trim();
  }
  if (typeof body.phone === "string") {
    payload.phone = body.phone.trim();
  }

  if (Object.keys(payload).length === 0) {
    return NextResponse.json(
      { success: false, message: "No profile fields to update" },
      { status: 400 },
    );
  }

  return withStaffAccess((accessToken) =>
    gatewayRequest<MeProfile>("/api/auth/v1/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
      accessToken,
    }),
  );
}
