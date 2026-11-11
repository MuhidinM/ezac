import { bffJson, proxyStaffFile } from "@/lib/api/bff";
import { isSafePathSegment } from "@/lib/api/path";

/**
 * Who may call this route (mirrors the UI; the gateway still decides):
 *
 * | Method | Access | UI callers                                 |
 * | ------ | ------ | ------------------------------------------ |
 * | GET    | portal | Beneficiaries > detail, photo (hq, branch) |
 */
type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!isSafePathSegment(id)) {
    return bffJson({ success: false, message: "We couldn't find that beneficiary." }, { status: 404 });
  }

  return proxyStaffFile(
    `/api/beneficiaries/v1/beneficiaries/${encodeURIComponent(id)}/profile-picture`,
    request,
    { access: "portal", label: "beneficiaries/profile-picture" },
  );
}
