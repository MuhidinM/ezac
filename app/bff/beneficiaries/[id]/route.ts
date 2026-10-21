import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { withStaffAccess } from "@/lib/api/bff";
import { gatewayRequest } from "@/lib/api/gateway";
import type { BeneficiaryDetail } from "@/lib/api/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  return withStaffAccess((accessToken) =>
    gatewayRequest<BeneficiaryDetail>(
      `/api/beneficiaries/v1/beneficiaries/${encodeURIComponent(id)}`,
      { accessToken },
    ),
  );
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body" },
      { status: 400 },
    );
  }

  return withStaffAccess((accessToken) =>
    gatewayRequest<BeneficiaryDetail>(
      `/api/beneficiaries/v1/beneficiaries/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
        accessToken,
      },
    ),
  );
}
