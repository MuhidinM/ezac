import { withStaffAccess } from "@/lib/api/bff";
import { gatewayRequest } from "@/lib/api/gateway";
import type { InstitutionDocumentItem } from "@/lib/api/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  return withStaffAccess((accessToken) =>
    gatewayRequest<InstitutionDocumentItem[] | { items: InstitutionDocumentItem[] }>(
      `/api/beneficiaries/v1/beneficiaries/${encodeURIComponent(id)}/institution-documents`,
      { accessToken },
    ),
  );
}
