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

/** Every create field is required; the labels match the New branch form. */
const REQUIRED_LABELS: Record<keyof CreateBranchBody, string> = {
  name: "Branch name",
  region: "Region",
  zone: "Zone",
  woreda: "Woreda",
  branchFullName: "Officer's full name",
  branchPhone: "Officer's phone",
  branchEmail: "Officer's email",
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    // The backend rejects a blank email, so it is required here too.
    const payload: Required<CreateBranchBody> = {
      name: field(body.name),
      region: field(body.region),
      zone: field(body.zone),
      woreda: field(body.woreda),
      branchPhone: field(body.branchPhone),
      branchFullName: field(body.branchFullName),
      branchEmail: field(body.branchEmail),
    };

    const missing = (Object.keys(REQUIRED_LABELS) as (keyof CreateBranchBody)[]).filter((key) => !payload[key]);
    if (missing.length > 0) {
      throw new ApiError(
        `Fill in ${missing.map((key) => REQUIRED_LABELS[key].toLowerCase()).join(", ")}.`,
        400,
        missing.map((key) => ({ field: key, message: `Enter the ${REQUIRED_LABELS[key].toLowerCase()}.` })),
      );
    }
    if (!EMAIL.test(payload.branchEmail)) {
      throw new ApiError("Enter a valid email address for the branch officer.", 400, [
        { field: "branchEmail", message: "Enter a valid email address, e.g. name@example.com." },
      ]);
    }

    return gatewayRequest<BranchCreateResponse>("/api/beneficiaries/v1/admin/branches", {
      method: "POST",
      body: JSON.stringify(payload),
      accessToken,
    });
  }, ACCESS);
}
