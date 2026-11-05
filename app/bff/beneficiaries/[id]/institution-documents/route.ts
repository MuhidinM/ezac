import { bffJson, withStaffAccess } from "@/lib/api/bff";
import { gatewayRequest } from "@/lib/api/gateway";
import { isSafePathSegment } from "@/lib/api/path";
import type { InstitutionDocumentItem } from "@/lib/api/types";

/**
 * Who may call this route (mirrors the UI; the gateway still decides):
 *
 * | Method | Access | UI callers                                       |
 * | ------ | ------ | ------------------------------------------------ |
 * | GET    | staff  | Beneficiaries > detail, KYC documents card (hq)  |
 */
type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!isSafePathSegment(id)) {
    return bffJson({ success: false, message: "We couldn't find that beneficiary." }, { status: 404 });
  }

  return withStaffAccess(
    (accessToken) =>
      gatewayRequest<InstitutionDocumentItem[] | { items: InstitutionDocumentItem[] }>(
        `/api/beneficiaries/v1/beneficiaries/${encodeURIComponent(id)}/institution-documents`,
        { accessToken },
      ),
    { access: "staff", label: "beneficiaries/institution-documents" },
  );
}
