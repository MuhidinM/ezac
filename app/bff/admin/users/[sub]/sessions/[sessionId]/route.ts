import { bffJson, withStaffAccess, type AccessOptions } from "@/lib/api/bff";
import { gatewayRequest } from "@/lib/api/gateway";
import { isSafePathSegment } from "@/lib/api/path";

/**
 * One open session of a staff login, on auth-service.
 *
 * | Method | Access | UI callers                                   |
 * | ------ | ------ | -------------------------------------------- |
 * | DELETE | admin  | Staff accounts > end one session (admin)     |
 */
const ACCESS: AccessOptions = { access: "admin", label: "admin/users/session" };

type RouteContext = {
  params: Promise<{ sub: string; sessionId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { sub, sessionId } = await context.params;
  if (!isSafePathSegment(sub) || !isSafePathSegment(sessionId)) {
    return bffJson({ success: false, message: "We couldn't find that session." }, { status: 404 });
  }

  return withStaffAccess(
    (accessToken) =>
      gatewayRequest<unknown>(
        `/api/auth/v1/admin/users/${encodeURIComponent(sub)}/sessions/${encodeURIComponent(sessionId)}`,
        { method: "DELETE", accessToken, label: ACCESS.label },
      ),
    ACCESS,
  );
}
