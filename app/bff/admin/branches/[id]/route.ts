import { NextResponse } from "next/server";

import { withStaffAccess } from "@/lib/api/bff";
import { gatewayRequest } from "@/lib/api/gateway";
import type { Branch } from "@/lib/api/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  return withStaffAccess((accessToken) =>
    gatewayRequest<Branch>(
      `/api/beneficiaries/v1/admin/branches/${encodeURIComponent(id)}`,
      { accessToken },
    ),
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  let body: { active?: boolean };
  try {
    body = (await request.json()) as { active?: boolean };
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body" },
      { status: 400 },
    );
  }

  if (typeof body.active !== "boolean") {
    return NextResponse.json(
      { success: false, message: "active must be a boolean" },
      { status: 400 },
    );
  }

  return withStaffAccess((accessToken) =>
    gatewayRequest<Branch>(
      `/api/beneficiaries/v1/admin/branches/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ active: body.active }),
        accessToken,
      },
    ),
  );
}
