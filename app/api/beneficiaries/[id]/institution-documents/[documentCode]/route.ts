import { proxyStaffFile } from "@/lib/api/bff";

type RouteContext = {
  params: Promise<{ id: string; documentCode: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id, documentCode } = await context.params;

  return proxyStaffFile(
    `/api/beneficiaries/v1/beneficiaries/${encodeURIComponent(id)}/institution-documents/${encodeURIComponent(documentCode)}`,
    request,
  );
}
