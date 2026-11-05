import type { NextRequest } from "next/server";

import { withStaffAccess } from "@/lib/api/bff";
import { gatewayRequest } from "@/lib/api/gateway";
import type { BeneficiaryListItem, PaginatedItems } from "@/lib/api/types";

/**
 * Who may call this route (mirrors the UI; the gateway still decides):
 *
 * | Method | Access | UI callers                                                       |
 * | ------ | ------ | ---------------------------------------------------------------- |
 * | GET    | staff  | none today (the list uses /bff/backoffice); HQ data like the     |
 * |        |        | Beneficiaries page (hq)                                          |
 */
const ALLOWED_QUERY_KEYS = [
  "search",
  "verificationStatus",
  "beneficiaryType",
  "page",
  "limit",
] as const;

export async function GET(request: NextRequest) {
  const upstreamQuery = new URLSearchParams();

  for (const key of ALLOWED_QUERY_KEYS) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) upstreamQuery.set(key, value);
  }

  const query = upstreamQuery.toString();
  const path = `/api/beneficiaries/v1/beneficiaries${query ? `?${query}` : ""}`;

  return withStaffAccess(
    (accessToken) => gatewayRequest<PaginatedItems<BeneficiaryListItem>>(path, { accessToken }),
    { access: "staff", label: "beneficiaries" },
  );
}
