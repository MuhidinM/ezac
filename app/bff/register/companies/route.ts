import { withStaffAccessPublic } from "@/lib/api/bff";
import { readJsonBody } from "@/lib/api/body";
import { publicGatewayRequest } from "@/lib/api/public-gateway";
import { companyPayload, type CreateCompanyResponse } from "@/lib/registration/company";

/**
 * Who may call this route (mirrors the UI; the upstream endpoint is public):
 *
 * | Method | Access | UI callers                                   |
 * | ------ | ------ | -------------------------------------------- |
 * | POST   | staff  | Register institution > details step (hq)     |
 *
 * Only the documented fields are passed on (backend answer B19).
 */
export async function POST(request: Request) {
  return withStaffAccessPublic(
    async () => {
      const body = companyPayload(await readJsonBody<unknown>(request));
      return publicGatewayRequest<CreateCompanyResponse>("/api/beneficiaries/v1/companies", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    { access: "staff", label: "register/companies" },
  );
}
