import type { NextRequest } from "next/server";

import { withStaffAccessPublic } from "@/lib/api/bff";
import { publicGatewayRequest } from "@/lib/api/public-gateway";
import type { SetPasswordPayload } from "@/lib/registration/types";

export async function POST(request: NextRequest) {
  const setupToken = request.headers.get("X-Password-Setup-Token");

  if (!setupToken) {
    return Response.json(
      { success: false, message: "Registration session expired" },
      { status: 400 },
    );
  }

  let body: SetPasswordPayload;

  try {
    body = (await request.json()) as SetPasswordPayload;
  } catch {
    return Response.json(
      { success: false, message: "Invalid request body" },
      { status: 400 },
    );
  }

  return withStaffAccessPublic(() =>
    publicGatewayRequest<null>("/api/beneficiaries/v1/accounts/set-password", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "X-Password-Setup-Token": setupToken },
    }),
  );
}
