import type { NextRequest } from "next/server";

import { withStaffAccess } from "@/lib/api/bff";
import { gatewayRequest } from "@/lib/api/gateway";
import type { BeneficiaryListItem, PaginatedItems } from "@/lib/api/types";

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

  return withStaffAccess((accessToken) =>
    gatewayRequest<PaginatedItems<BeneficiaryListItem>>(path, { accessToken }),
  );
}
