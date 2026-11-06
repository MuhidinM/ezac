import type { NextRequest } from "next/server";

import { bffJson, withStaffAccess, type AccessOptions } from "@/lib/api/bff";
import { readJsonBody } from "@/lib/api/body";
import { ApiError } from "@/lib/api/errors";
import { gatewayRequest } from "@/lib/api/gateway";
import { isSafePathSegment } from "@/lib/api/path";
import type { PaginatedItems, RegistrationCodeItem } from "@/lib/api/types";

/**
 * Who may call this route (mirrors the UI; the gateway still decides):
 *
 * | Method | Access | UI callers                                                  |
 * | ------ | ------ | ----------------------------------------------------------- |
 * | GET    | admin  | Branches > branch detail, registration codes (admin)        |
 * | POST   | admin  | Branches > branch detail, generate codes (admin)            |
 */
const ACCESS: AccessOptions = { access: "admin", label: "admin/branches/codes" };

type RouteContext = {
  params: Promise<{ id: string }>;
};

const notFound = () => bffJson({ success: false, message: "We couldn't find that branch." }, { status: 404 });

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  if (!isSafePathSegment(id)) return notFound();
  const upstreamQuery = new URLSearchParams();

  for (const key of ["status", "page", "limit"] as const) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) upstreamQuery.set(key, value);
  }

  const query = upstreamQuery.toString();
  const path = `/api/beneficiaries/v1/admin/branches/${encodeURIComponent(id)}/codes${query ? `?${query}` : ""}`;

  return withStaffAccess(
    (accessToken) => gatewayRequest<PaginatedItems<RegistrationCodeItem>>(path, { accessToken }),
    ACCESS,
  );
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!isSafePathSegment(id)) return notFound();

  return withStaffAccess(async (accessToken) => {
    const body = await readJsonBody<{ quantity?: unknown } | null>(request);
    const quantity = Number(body?.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 500) {
      throw new ApiError("quantity must be an integer between 1 and 500", 400);
    }

    return gatewayRequest<string[]>(`/api/beneficiaries/v1/admin/branches/${encodeURIComponent(id)}/codes`, {
      method: "POST",
      body: JSON.stringify({ quantity }),
      accessToken,
    });
  }, ACCESS);
}
