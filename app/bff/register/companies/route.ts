import { withStaffAccessPublic } from "@/lib/api/bff";
import { readJsonBody } from "@/lib/api/body";
import { publicGatewayRequest } from "@/lib/api/public-gateway";
import type { CreateCompanyPayload, CreateCompanyResponse } from "@/lib/registration/types";

/**
 * Who may call this route (mirrors the UI; the upstream endpoint is public):
 *
 * | Method | Access | UI callers                                              |
 * | ------ | ------ | ------------------------------------------------------- |
 * | POST   | staff  | none today; the Register institution flow is hq         |
 */
export async function POST(request: Request) {
  return withStaffAccessPublic(
    async () => {
      const body = await readJsonBody<CreateCompanyPayload>(request);
      return publicGatewayRequest<CreateCompanyResponse>("/api/beneficiaries/v1/companies", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    { access: "staff", label: "register/companies" },
  );
}
