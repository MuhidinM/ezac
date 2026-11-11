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

/** Required create fields; the labels match the New branch form. The email is optional. */
const REQUIRED_LABELS: Record<Exclude<keyof CreateBranchBody, "branchEmail">, string> = {
  name: "Branch name",
  region: "Region",
  zone: "Zone",
  woreda: "Woreda",
  branchFullName: "Officer's full name",
  branchPhone: "Officer's phone",
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** The backend's rule for the key: 1-128 letters, digits or . _ : - */
const IDEMPOTENCY_KEY = /^[A-Za-z0-9._:-]{1,128}$/;

function field(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(request: NextRequest) {
  const upstreamQuery = new URLSearchParams();
  for (const key of ["page", "limit", "search", "region", "active"] as const) {
    const value = request.nextUrl.searchParams.get(key)?.trim();
    if (value) upstreamQuery.set(key, value);
  }

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
    const branchEmail = field(body.branchEmail);

    const missing = (Object.keys(REQUIRED_LABELS) as (keyof typeof REQUIRED_LABELS)[]).filter((key) => !payload[key]);
    if (missing.length > 0) {
      throw new ApiError(
        `Fill in ${missing.map((key) => REQUIRED_LABELS[key].toLowerCase()).join(", ")}.`,
        400,
        missing.map((key) => ({ field: key, message: `Enter the ${REQUIRED_LABELS[key].toLowerCase()}.` })),
      );
    }
    // The branch email is optional; when given it must be valid.
    if (branchEmail) {
      if (!EMAIL.test(branchEmail)) {
        throw new ApiError("Enter a valid email address for the branch officer.", 400, [
          { field: "branchEmail", message: "Enter a valid email address, e.g. name@example.com." },
        ]);
      }
      payload.branchEmail = branchEmail;
    }

    // One key per create action, so a retry never creates the branch twice.
    const headers = new Headers();
    const idempotencyKey = request.headers.get("Idempotency-Key");
    if (idempotencyKey && IDEMPOTENCY_KEY.test(idempotencyKey)) headers.set("Idempotency-Key", idempotencyKey);

    return gatewayRequest<BranchCreateResponse>("/api/beneficiaries/v1/admin/branches", {
      method: "POST",
      body: JSON.stringify(payload),
      headers,
      accessToken,
    });
  }, ACCESS);
}
