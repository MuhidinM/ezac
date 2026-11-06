import type { NextRequest } from "next/server";

import { withStaffAccess } from "@/lib/api/bff";
import { gatewayRequest } from "@/lib/api/gateway";
import type { PaginatedItems, RegistrationCodeItem } from "@/lib/api/types";

/**
 * Who may call this route (mirrors the UI; the gateway still decides and
 * scopes the codes to the caller's own branch):
 *
 * | Method | Access | UI callers                                  |
 * | ------ | ------ | ------------------------------------------- |
 * | GET    | portal | My branch, registration codes (branch)      |
 */
export async function GET(request: NextRequest) {
  const upstreamQuery = new URLSearchParams();

  for (const key of ["status", "page", "limit"] as const) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) upstreamQuery.set(key, value);
  }

  const query = upstreamQuery.toString();
  const path = `/api/beneficiaries/v1/branch/codes${query ? `?${query}` : ""}`;

  return withStaffAccess(
    (accessToken) => gatewayRequest<PaginatedItems<RegistrationCodeItem>>(path, { accessToken }),
    { access: "portal", label: "branch/codes" },
  );
}
