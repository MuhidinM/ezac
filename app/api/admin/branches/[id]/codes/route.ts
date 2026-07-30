import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { withStaffAccess } from "@/lib/api/bff";
import { gatewayRequest } from "@/lib/api/gateway";
import type { PaginatedItems, RegistrationCodeItem } from "@/lib/api/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const upstreamQuery = new URLSearchParams();

  for (const key of ["status", "page", "limit"] as const) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) upstreamQuery.set(key, value);
  }

  const query = upstreamQuery.toString();
  const path = `/api/beneficiaries/v1/admin/branches/${encodeURIComponent(id)}/codes${query ? `?${query}` : ""}`;

  return withStaffAccess((accessToken) =>
    gatewayRequest<PaginatedItems<RegistrationCodeItem>>(path, { accessToken }),
  );
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;

  let body: { quantity?: number };
  try {
    body = (await request.json()) as { quantity?: number };
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body" },
      { status: 400 },
    );
  }

  const quantity = Number(body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 500) {
    return NextResponse.json(
      { success: false, message: "quantity must be an integer between 1 and 500" },
      { status: 400 },
    );
  }

  return withStaffAccess((accessToken) =>
    gatewayRequest<string[]>(
      `/api/beneficiaries/v1/admin/branches/${encodeURIComponent(id)}/codes`,
      {
        method: "POST",
        body: JSON.stringify({ quantity }),
        accessToken,
      },
    ),
  );
}
