import { withStaffAccess } from "@/lib/api/bff";
import { gatewayRequest } from "@/lib/api/gateway";
import type { BranchPortalProfile } from "@/lib/api/types";

/**
 * Who may call this route (mirrors the UI; the gateway still decides and
 * answers with the caller's own branch):
 *
 * | Method | Access | UI callers              |
 * | ------ | ------ | ----------------------- |
 * | GET    | portal | My branch (branch)      |
 */
export async function GET() {
  return withStaffAccess(
    (accessToken) => gatewayRequest<BranchPortalProfile>("/api/beneficiaries/v1/branch/me", { accessToken }),
    { access: "portal", label: "branch/me" },
  );
}
