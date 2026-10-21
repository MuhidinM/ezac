import { withStaffAccessPublic } from "@/lib/api/bff";
import { publicGatewayRequest } from "@/lib/api/public-gateway";
import type { CreateCompanyPayload, CreateCompanyResponse } from "@/lib/registration/types";

export async function POST(request: Request) {
  let body: CreateCompanyPayload;

  try {
    body = (await request.json()) as CreateCompanyPayload;
  } catch {
    return Response.json(
      { success: false, message: "Invalid request body" },
      { status: 400 },
    );
  }

  return withStaffAccessPublic(() =>
    publicGatewayRequest<CreateCompanyResponse>(
      "/api/beneficiaries/v1/companies",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),
  );
}
