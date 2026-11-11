import { bffJson, withStaffAccess, type AccessOptions } from "@/lib/api/bff";
import { readJsonBody } from "@/lib/api/body";
import { ApiError } from "@/lib/api/errors";
import { gatewayRequest } from "@/lib/api/gateway";
import { isSafePathSegment } from "@/lib/api/path";
import type { Branch } from "@/lib/api/types";

/**
 * Who may call this route (mirrors the UI; the gateway still decides):
 *
 * | Method | Access | UI callers                                           |
 * | ------ | ------ | ---------------------------------------------------- |
 * | GET    | admin  | Branches > branch detail (RequireRole admin)         |
 * | PATCH  | admin  | Branches > branch detail, activate/deactivate (admin)|
 */
const ACCESS: AccessOptions = { access: "admin", label: "admin/branches" };

type RouteContext = {
  params: Promise<{ id: string }>;
};

const notFound = () => bffJson({ success: false, message: "We couldn't find that branch." }, { status: 404 });

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!isSafePathSegment(id)) return notFound();

  return withStaffAccess(
    (accessToken) =>
      gatewayRequest<Branch>(`/api/beneficiaries/v1/admin/branches/${encodeURIComponent(id)}`, { accessToken }),
    ACCESS,
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!isSafePathSegment(id)) return notFound();

  return withStaffAccess(async (accessToken) => {
    const body = await readJsonBody<{ active?: unknown; version?: unknown } | null>(request);
    if (typeof body?.active !== "boolean") {
      throw new ApiError("active must be a boolean", 400);
    }
    // The backend needs the version the page loaded (409 VERSION_CONFLICT when stale).
    if (typeof body.version !== "number" || !Number.isInteger(body.version) || body.version < 0) {
      throw new ApiError("Reload the branch and try again.", 400, [
        { field: "version", message: "version must be the branch's current version" },
      ]);
    }

    return gatewayRequest<Branch>(`/api/beneficiaries/v1/admin/branches/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ active: body.active, version: body.version }),
      accessToken,
    });
  }, ACCESS);
}
