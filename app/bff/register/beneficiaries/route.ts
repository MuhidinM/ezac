import { withStaffAccessPublic } from "@/lib/api/bff";
import { publicGatewayMultipart } from "@/lib/api/public-gateway";
import type { CreateBeneficiaryResponse } from "@/lib/registration/types";

export async function POST(request: Request) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { success: false, message: "Invalid multipart request" },
      { status: 400 },
    );
  }

  if (!formData.has("data")) {
    return Response.json(
      { success: false, message: "Missing required form part: data" },
      { status: 400 },
    );
  }

  return withStaffAccessPublic(() =>
    publicGatewayMultipart<CreateBeneficiaryResponse>(
      "/api/beneficiaries/v1/beneficiaries",
      formData,
    ),
  );
}
