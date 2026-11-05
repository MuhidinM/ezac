import type { NextRequest } from "next/server";

import { bffJson, withStaffAccess } from "@/lib/api/bff";
import { readJsonBody } from "@/lib/api/body";
import { gatewayRequest } from "@/lib/api/gateway";
import { isSafePathSegment } from "@/lib/api/path";
import type { BeneficiaryDetail } from "@/lib/api/types";

/**
 * Who may call this route (mirrors the UI; the gateway still decides):
 *
 * | Method | Access | UI callers                                                  |
 * | ------ | ------ | ----------------------------------------------------------- |
 * | PATCH  | admin  | verify/reject on the beneficiary detail page (isAdmin only) |
 */
type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  if (!isSafePathSegment(id)) {
    return bffJson({ success: false, message: "We couldn't find that beneficiary." }, { status: 404 });
  }

  return withStaffAccess(
    async (accessToken) => {
      const body = await readJsonBody(request);
      return gatewayRequest<BeneficiaryDetail>(
        `/api/beneficiaries/v1/beneficiaries/${encodeURIComponent(id)}/verification`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
          accessToken,
        },
      );
    },
    { access: "admin", label: "beneficiaries/verification" },
  );
}
