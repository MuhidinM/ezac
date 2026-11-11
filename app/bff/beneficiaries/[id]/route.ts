import type { NextRequest } from "next/server";

import { bffJson, withStaffAccess, type AccessOptions } from "@/lib/api/bff";
import { readJsonBody } from "@/lib/api/body";
import { gatewayRequest } from "@/lib/api/gateway";
import { isSafePathSegment } from "@/lib/api/path";
import { isRecord, readUpstreamJson, unreadableAnswer, upstreamError, upstreamFetch } from "@/lib/api/upstream";
import type { HouseholdDetail } from "@/lib/beneficiary/types";

/**
 * Who may call this route (mirrors the UI; the gateway still decides):
 *
 * | Method | Access | UI callers                                                              |
 * | ------ | ------ | ----------------------------------------------------------------------- |
 * | GET    | portal | Beneficiaries > detail and duplicate review (hq); household detail     |
 * |        |        | read only (branch, its own branch)                                      |
 * | PATCH  | staff  | edit form on the detail page (isStaff); basic details in the wizard     |
 * |        |        | (officer). BRANCH gets 403 ROLE_NOT_ALLOWED upstream.                   |
 */
const READ: AccessOptions = { access: "portal", label: "beneficiaries" };
const EDIT: AccessOptions = { access: "staff", label: "beneficiaries" };

type RouteContext = {
  params: Promise<{ id: string }>;
};

const notFound = () => bffJson({ success: false, message: "We couldn't find that beneficiary." }, { status: 404 });

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  if (!isSafePathSegment(id)) return notFound();

  return withStaffAccess(
    (accessToken) =>
      gatewayRequest<HouseholdDetail>(`/api/beneficiaries/v1/beneficiaries/${encodeURIComponent(id)}`, {
        accessToken,
      }),
    READ,
  );
}

/**
 * An ADMIN change of a locked payout account answers 202: nothing was
 * applied, the change waits for a second ADMIN. The browser only gets
 * `data`, so the backend's message rides along as `bankChangeRequestMessage`.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  if (!isSafePathSegment(id)) return notFound();

  return withStaffAccess(async (accessToken) => {
    const body = await readJsonBody(request);
    const call = await upstreamFetch(
      `/api/beneficiaries/v1/beneficiaries/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      },
      { label: EDIT.label ?? "beneficiaries" },
    );
    const parsed = await readUpstreamJson(call);
    const value = parsed.kind === "json" ? parsed.value : null;
    if (!call.response.ok || (isRecord(value) && value.success !== true)) throw upstreamError(call, value);
    if (!isRecord(value) || !isRecord(value.data)) throw unreadableAnswer(call);

    const record = value.data as HouseholdDetail;
    if (call.response.status === 202) {
      const message = typeof value.message === "string" && value.message.trim() ? value.message.trim() : null;
      return {
        ...record,
        pendingBankChange: true,
        bankChangeRequestMessage: message ?? "Saved. The bank account change waits for another admin to approve it.",
      };
    }
    return record;
  }, EDIT);
}
