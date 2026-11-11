import type { NextRequest } from "next/server";

import { withStaffAccess, type AccessOptions } from "@/lib/api/bff";
import { gatewayRequest } from "@/lib/api/gateway";
import type { PaginatedItems } from "@/lib/api/types";
import { type StaffAccount, staffListQuery } from "@/lib/branches/staff-accounts";

/**
 * Staff sign-in accounts on auth-service (every ADMIN, BRANCH and
 * FIELD_OFFICER login).
 *
 * | Method | Access | UI callers                       |
 * | ------ | ------ | -------------------------------- |
 * | GET    | admin  | Staff accounts (RequireRole admin) |
 */
const ACCESS: AccessOptions = { access: "admin", label: "admin/staff" };

export async function GET(request: NextRequest) {
  const query = staffListQuery(request.nextUrl.searchParams).toString();
  const path = `/api/auth/v1/admin/staff${query ? `?${query}` : ""}`;

  return withStaffAccess(
    (accessToken) => gatewayRequest<PaginatedItems<StaffAccount>>(path, { accessToken, label: "admin/staff" }),
    ACCESS,
  );
}
