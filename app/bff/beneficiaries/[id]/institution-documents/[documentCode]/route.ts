import { bffJson, proxyStaffFile } from "@/lib/api/bff";
import { isSafePathSegment } from "@/lib/api/path";

/**
 * Who may call this route (mirrors the UI; the gateway still decides):
 *
 * | Method | Access | UI callers                                               |
 * | ------ | ------ | -------------------------------------------------------- |
 * | GET    | staff  | Beneficiaries > detail, KYC documents card, open (hq)    |
 */
type RouteContext = {
  params: Promise<{ id: string; documentCode: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id, documentCode } = await context.params;
  if (!isSafePathSegment(id) || !isSafePathSegment(documentCode)) {
    return bffJson({ success: false, message: "We couldn't find that document." }, { status: 404 });
  }

  return proxyStaffFile(
    `/api/beneficiaries/v1/beneficiaries/${encodeURIComponent(id)}/institution-documents/${encodeURIComponent(documentCode)}`,
    request,
    { access: "staff", label: "beneficiaries/institution-documents" },
  );
}
