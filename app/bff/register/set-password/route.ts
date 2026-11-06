import type { NextRequest } from "next/server";

import { bffJson, withStaffAccessPublic } from "@/lib/api/bff";
import { readJsonBody } from "@/lib/api/body";
import { publicGatewayRequest } from "@/lib/api/public-gateway";
import type { SetPasswordPayload } from "@/lib/registration/types";

/**
 * Who may call this route (mirrors the UI; the upstream endpoint is public
 * and checks the setup token):
 *
 * | Method | Access | UI callers                                                     |
 * | ------ | ------ | -------------------------------------------------------------- |
 * | POST   | staff  | Register beneficiary/institution > set password step (hq)      |
 */
export async function POST(request: NextRequest) {
  const setupToken = request.headers.get("X-Password-Setup-Token");

  if (!setupToken) {
    return bffJson(
      { success: false, message: "Registration session expired" },
      { status: 400 },
    );
  }

  return withStaffAccessPublic(
    async () => {
      const body = await readJsonBody<SetPasswordPayload>(request);
      return publicGatewayRequest<null>("/api/beneficiaries/v1/accounts/set-password", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "X-Password-Setup-Token": setupToken },
      });
    },
    { access: "staff", label: "register/set-password" },
  );
}
