import type { NextRequest } from "next/server";

import { bffJson, withStaffAccessPublic } from "@/lib/api/bff";
import { readFormDataBody } from "@/lib/api/body";
import { ApiError } from "@/lib/api/errors";
import { isBackendId } from "@/lib/api/path";
import { publicGatewayMultipart } from "@/lib/api/public-gateway";
import type { UploadDocumentResponse } from "@/lib/registration/types";

/**
 * Who may call this route (mirrors the UI; the upstream endpoint is public
 * and checks the upload token):
 *
 * | Method | Access | UI callers                                                  |
 * | ------ | ------ | ----------------------------------------------------------- |
 * | POST   | staff  | Register institution > documents step (hq)                  |
 */
type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  // The id goes into the gateway path: a decoded "../" here would point the
  // upload at another gateway endpoint.
  if (!isBackendId(id)) {
    return bffJson({ success: false, message: "We couldn't find that registration." }, { status: 404 });
  }

  const uploadToken = request.headers.get("X-Company-Upload-Token");
  if (!uploadToken) {
    return bffJson(
      { success: false, message: "Registration session expired" },
      { status: 400 },
    );
  }

  return withStaffAccessPublic(
    async () => {
      const formData = await readFormDataBody(request);
      if (!formData.has("documentCode") || !formData.has("file")) {
        throw new ApiError("documentCode and file are required", 400);
      }

      return publicGatewayMultipart<UploadDocumentResponse>(
        `/api/beneficiaries/v1/companies/${encodeURIComponent(id)}/documents`,
        formData,
        { "X-Company-Upload-Token": uploadToken },
      );
    },
    { access: "staff", label: "register/companies/documents" },
  );
}
