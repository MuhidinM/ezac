import { bffJson, withStaffAccess, type AccessOptions } from "@/lib/api/bff";
import { gatewayRequest } from "@/lib/api/gateway";
import { isSafePathSegment } from "@/lib/api/path";
import type { StaffSession } from "@/lib/branches/staff-accounts";

/**
 * Open sessions of one staff login, on auth-service.
 *
 * | Method | Access | UI callers                                      |
 * | ------ | ------ | ----------------------------------------------- |
 * | GET    | admin  | Staff accounts > sessions (RequireRole admin)   |
 * | DELETE | admin  | Staff accounts > end all sessions (admin)       |
 */
const ACCESS: AccessOptions = { access: "admin", label: "admin/users/sessions" };

type RouteContext = {
  params: Promise<{ sub: string }>;
};

const notFound = () => bffJson({ success: false, message: "We couldn't find that account." }, { status: 404 });

function sessionsPath(sub: string) {
  return `/api/auth/v1/admin/users/${encodeURIComponent(sub)}/sessions`;
}

export async function GET(_request: Request, context: RouteContext) {
  const { sub } = await context.params;
  if (!isSafePathSegment(sub)) return notFound();

  return withStaffAccess(
    (accessToken) => gatewayRequest<StaffSession[]>(sessionsPath(sub), { accessToken, label: ACCESS.label }),
    ACCESS,
  );
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { sub } = await context.params;
  if (!isSafePathSegment(sub)) return notFound();

  return withStaffAccess(
    (accessToken) =>
      gatewayRequest<unknown>(sessionsPath(sub), { method: "DELETE", accessToken, label: ACCESS.label }),
    ACCESS,
  );
}
