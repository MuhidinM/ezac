import { withStaffAccessPublic } from "@/lib/api/bff";
import { readFormDataBody } from "@/lib/api/body";
import { ApiError } from "@/lib/api/errors";
import { publicGatewayMultipart } from "@/lib/api/public-gateway";
import type { CreateBeneficiaryResponse } from "@/lib/registration/types";

/**
 * Who may call this route (mirrors the UI; the upstream endpoint is public):
 *
 * | Method | Access | UI callers                                                       |
 * | ------ | ------ | ---------------------------------------------------------------- |
 * | POST   | staff  | none today (staff registration uses /bff/backoffice/staff);      |
 * |        |        | the Register beneficiary flow is hq                              |
 */
export async function POST(request: Request) {
  return withStaffAccessPublic(
    async () => {
      const formData = await readFormDataBody(request);
      if (!formData.has("data")) {
        throw new ApiError("Missing required form part: data", 400);
      }

      return publicGatewayMultipart<CreateBeneficiaryResponse>("/api/beneficiaries/v1/beneficiaries", formData);
    },
    { access: "staff", label: "register/beneficiaries" },
  );
}
