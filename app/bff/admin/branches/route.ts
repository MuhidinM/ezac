import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { withStaffAccess } from "@/lib/api/bff";
import { gatewayRequest } from "@/lib/api/gateway";
import type {
  BranchCreateResponse,
  BranchListItem,
  CreateBranchBody,
  PaginatedItems,
} from "@/lib/api/types";

export async function GET(request: NextRequest) {
  const upstreamQuery = new URLSearchParams();
  const page = request.nextUrl.searchParams.get("page");
  const limit = request.nextUrl.searchParams.get("limit");
  if (page) upstreamQuery.set("page", page);
  if (limit) upstreamQuery.set("limit", limit);

  const query = upstreamQuery.toString();
  const path = `/api/beneficiaries/v1/admin/branches${query ? `?${query}` : ""}`;

  return withStaffAccess((accessToken) =>
    gatewayRequest<PaginatedItems<BranchListItem>>(path, { accessToken }),
  );
}

export async function POST(request: Request) {
  let body: CreateBranchBody;

  try {
    body = (await request.json()) as CreateBranchBody;
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body" },
      { status: 400 },
    );
  }

  if (
    !body.name?.trim() ||
    !body.region?.trim() ||
    !body.zone?.trim() ||
    !body.woreda?.trim() ||
    !body.branchPhone?.trim() ||
    !body.branchFullName?.trim()
  ) {
    return NextResponse.json(
      { success: false, message: "Required branch fields are missing" },
      { status: 400 },
    );
  }

  const payload: CreateBranchBody = {
    name: body.name.trim(),
    region: body.region.trim(),
    zone: body.zone.trim(),
    woreda: body.woreda.trim(),
    branchPhone: body.branchPhone.trim(),
    branchFullName: body.branchFullName.trim(),
  };
  if (body.branchEmail?.trim()) {
    payload.branchEmail = body.branchEmail.trim();
  }

  return withStaffAccess((accessToken) =>
    gatewayRequest<BranchCreateResponse>(
      "/api/beneficiaries/v1/admin/branches",
      {
        method: "POST",
        body: JSON.stringify(payload),
        accessToken,
      },
    ),
  );
}
