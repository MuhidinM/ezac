import { proxyStaffFile } from "@/lib/api/bff";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;

  return proxyStaffFile(
    `/api/beneficiaries/v1/beneficiaries/${encodeURIComponent(id)}/profile-picture`,
    request,
  );
}
