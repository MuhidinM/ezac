import type { NextRequest } from "next/server";

import { withStaffAccess, type AccessOptions } from "@/lib/api/bff";
import { readJsonBody } from "@/lib/api/body";
import { ApiError } from "@/lib/api/errors";
import { gatewayRequest } from "@/lib/api/gateway";
import type {
  BranchCreateResponse,
  BranchListItem,
  CreateBranchBody,
  PaginatedItems,
} from "@/lib/api/types";

/**
 * Who may call this route (mirrors the UI; the gateway still decides):
 *
 * | Method | Access | UI callers                                                              |
 * | ------ | ------ | ----------------------------------------------------------------------- |
 * | GET    | admin  | branch filters on Beneficiaries, Assessments (isAdmin) and Pool (admin) |
 * |        |        | branch picker on Field officers (admin)                                 |
 * | POST   | admin  | Branches > create branch (RequireRole admin)                            |
 */
const ACCESS: AccessOptions = { access: "admin", label: "admin/branches" };

function field(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(request: NextRequest) {
  const upstreamQuery = new URLSearchParams();
  const page = request.nextUrl.searchParams.get("page");
  const limit = request.nextUrl.searchParams.get("limit");
  if (page) upstreamQuery.set("page", page);
  if (limit) upstreamQuery.set("limit", limit);

  const query = upstreamQuery.toString();
  const path = `/api/beneficiaries/v1/admin/branches${query ? `?${query}` : ""}`;

  return withStaffAccess(
    (accessToken) => gatewayRequest<PaginatedItems<BranchListItem>>(path, { accessToken }),
    ACCESS,
  );
}

export async function POST(request: Request) {
  return withStaffAccess(async (accessToken) => {
    const body = (await readJsonBody<Partial<Record<keyof CreateBranchBody, unknown>> | null>(request)) ?? {};

    const payload: CreateBranchBody = {
      name: field(body.name),
      region: field(body.region),
      zone: field(body.zone),
      woreda: field(body.woreda),
      branchPhone: field(body.branchPhone),
      branchFullName: field(body.branchFullName),
    };

    if (Object.values(payload).some((value) => !value)) {
      throw new ApiError("Required branch fields are missing", 400);
    }

    const branchEmail = field(body.branchEmail);
    if (branchEmail) {
      payload.branchEmail = branchEmail;
    }

    return gatewayRequest<BranchCreateResponse>("/api/beneficiaries/v1/admin/branches", {
      method: "POST",
      body: JSON.stringify(payload),
      accessToken,
    });
  }, ACCESS);
}
