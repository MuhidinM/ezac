import { withStaffAccess } from "@/lib/api/bff";
import { gatewayRequest } from "@/lib/api/gateway";
import type { BranchPortalProfile } from "@/lib/api/types";

export async function GET() {
  return withStaffAccess((accessToken) =>
    gatewayRequest<BranchPortalProfile>("/api/beneficiaries/v1/branch/me", {
      accessToken,
    }),
  );
}
