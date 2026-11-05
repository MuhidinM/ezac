import type { NextRequest } from "next/server";

import { bffJson, withStaffAccess, type AccessOptions } from "@/lib/api/bff";
import { readJsonBody } from "@/lib/api/body";
import { gatewayRequest } from "@/lib/api/gateway";
import { isSafePathSegment } from "@/lib/api/path";
import type { BeneficiaryDetail } from "@/lib/api/types";

/**
 * Who may call this route (mirrors the UI; the gateway still decides):
 *
 * | Method | Access | UI callers                                                              |
 * | ------ | ------ | ----------------------------------------------------------------------- |
 * | GET    | staff  | Beneficiaries > detail and duplicate review (hq)                        |
 * | PATCH  | staff  | edit form on the detail page (isStaff); basic details in the wizard     |
 * |        |        | (officer)                                                               |
 */
const ACCESS: AccessOptions = { access: "staff", label: "beneficiaries" };

type RouteContext = {
  params: Promise<{ id: string }>;
};

const notFound = () => bffJson({ success: false, message: "We couldn't find that beneficiary." }, { status: 404 });

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  if (!isSafePathSegment(id)) return notFound();

  return withStaffAccess(
    (accessToken) =>
      gatewayRequest<BeneficiaryDetail>(`/api/beneficiaries/v1/beneficiaries/${encodeURIComponent(id)}`, {
        accessToken,
      }),
    ACCESS,
  );
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  if (!isSafePathSegment(id)) return notFound();

  return withStaffAccess(async (accessToken) => {
    const body = await readJsonBody(request);
    return gatewayRequest<BeneficiaryDetail>(`/api/beneficiaries/v1/beneficiaries/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(body),
      accessToken,
    });
  }, ACCESS);
}
