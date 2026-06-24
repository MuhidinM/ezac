import type { NextRequest } from "next/server";

import { withStaffAccessPublic } from "@/lib/api/bff";
import { publicGatewayMultipart } from "@/lib/api/public-gateway";
import type { UploadDocumentResponse } from "@/lib/registration/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const uploadToken = request.headers.get("X-Company-Upload-Token");

  if (!uploadToken) {
    return Response.json(
      { success: false, message: "Registration session expired" },
      { status: 400 },
    );
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { success: false, message: "Invalid multipart request" },
      { status: 400 },
    );
  }

  if (!formData.has("documentCode") || !formData.has("file")) {
    return Response.json(
      { success: false, message: "documentCode and file are required" },
      { status: 400 },
    );
  }

  return withStaffAccessPublic(() =>
    publicGatewayMultipart<UploadDocumentResponse>(
      `/api/beneficiaries/v1/companies/${id}/documents`,
      formData,
      { "X-Company-Upload-Token": uploadToken },
    ),
  );
}
