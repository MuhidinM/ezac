import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/errors";
import {
  QR_CHECK_WINDOW_MS,
  amountReceivedProblem,
  awaitsApproval,
  canVoid,
  checkCountsForNotPaid,
  isOwnRequest,
  paymentListQuery,
  qrNotPaidBlock,
  resolveErrorText,
} from "@/lib/zakat/payments";

describe("qrNotPaidBlock", () => {
  const expiresAt = "2026-11-05T10:00:00Z";
  const expiry = Date.parse(expiresAt);
  const openQr = { status: "AWAITING_PAYMENT" as const, methodCode: "ethqr", expiresAt };

  it("blocks Not paid while the QR can still be paid", () => {
    expect(qrNotPaidBlock(openQr, expiry - 60_000, true)).toEqual({ reason: "still-checking", until: expiry + QR_CHECK_WINDOW_MS });
  });

  it("blocks Not paid until 24 hours after expiry, while the server still checks", () => {
    const expired = { ...openQr, status: "EXPIRED" as const };
    expect(qrNotPaidBlock(expired, expiry + QR_CHECK_WINDOW_MS - 1, true)?.reason).toBe("still-checking");
  });

  it("then waits for one Check now", () => {
    const expired = { ...openQr, status: "EXPIRED" as const };
    expect(qrNotPaidBlock(expired, expiry + QR_CHECK_WINDOW_MS, false)).toEqual({ reason: "check-first" });
    expect(qrNotPaidBlock(expired, expiry + QR_CHECK_WINDOW_MS, true)).toBeNull();
  });

  it("asks for Check now when the expiry isn't known", () => {
    expect(qrNotPaidBlock({ ...openQr, expiresAt: undefined }, expiry, false)).toEqual({ reason: "check-first" });
    expect(qrNotPaidBlock({ ...openQr, expiresAt: undefined }, expiry, true)).toBeNull();
  });

  it("doesn't apply to payments that need checking or to the Coop flow", () => {
    expect(qrNotPaidBlock({ status: "PROCESSING", methodCode: "ethqr", expiresAt }, expiry, false)).toBeNull();
    expect(qrNotPaidBlock({ status: "AWAITING_PAYMENT", methodCode: "coopbank", expiresAt }, expiry, false)).toBeNull();
  });
});

describe("checkCountsForNotPaid", () => {
  it("counts a check EthQR answered, or one it can't be asked about (409)", () => {
    expect(checkCountsForNotPaid(null)).toBe(true);
    expect(checkCountsForNotPaid({ status: 409 })).toBe(true);
  });

  it("doesn't count a failed check: offline, timeout or server error", () => {
    expect(checkCountsForNotPaid({ status: 0 })).toBe(false);
    expect(checkCountsForNotPaid({ status: 504 })).toBe(false);
    expect(checkCountsForNotPaid({ status: 500 })).toBe(false);
  });
});

describe("paymentListQuery", () => {
  const base = { range: "30d" as const, status: "", method: "", q: "", needsAction: false, page: 1, limit: 20 };

  it("sends the date range, status, method and search", () => {
    const params = new URLSearchParams(paymentListQuery({ ...base, status: "VOIDED", method: "ethqr", q: "  ZC-2026-000007 " }));
    expect(params.get("from")).toMatch(/T00:00:00\+03:00$/);
    expect(params.get("to")).toMatch(/T00:00:00\+03:00$/);
    expect(params.get("status")).toBe("VOIDED");
    expect(params.get("methodCode")).toBe("ethqr");
    expect(params.get("q")).toBe("ZC-2026-000007");
    expect(params.get("needsAction")).toBeNull();
  });

  it("leaves out dates and status in the needs-action view", () => {
    const params = new URLSearchParams(paymentListQuery({ ...base, status: "SUCCEEDED", needsAction: true, page: 2 }));
    expect(params.get("needsAction")).toBe("true");
    expect(params.has("from")).toBe(false);
    expect(params.has("status")).toBe(false);
    expect(params.get("page")).toBe("2");
  });
});

describe("manual Paid and void", () => {
  it("knows who marked a payment paid", () => {
    expect(isOwnRequest({ requestedBy: "sub-1" }, "sub-1")).toBe(true);
    expect(isOwnRequest({ requestedBy: "sub-1" }, "sub-2")).toBe(false);
    expect(isOwnRequest({ requestedBy: "sub-1" }, null)).toBe(false);
    expect(isOwnRequest({}, "sub-1")).toBe(false);
  });

  it("allows approval only while waiting, and void only once paid", () => {
    expect(awaitsApproval({ status: "AWAITING_APPROVAL" })).toBe(true);
    expect(awaitsApproval({ status: "PROCESSING" })).toBe(false);
    expect(canVoid({ status: "SUCCEEDED" })).toBe(true);
    expect(canVoid({ status: "VOIDED" })).toBe(false);
    expect(canVoid({ status: "AWAITING_APPROVAL" })).toBe(false);
  });

  it("checks the amount received", () => {
    expect(amountReceivedProblem("1500")).toBeNull();
    expect(amountReceivedProblem("1500.25")).toBeNull();
    expect(amountReceivedProblem("")).not.toBeNull();
    expect(amountReceivedProblem("0")).not.toBeNull();
    expect(amountReceivedProblem("12.345")).not.toBeNull();
    expect(amountReceivedProblem("-5")).not.toBeNull();
  });

  it("explains a reference already used and a QR still payable", () => {
    const duplicate = new ApiError("Duplicate", 409, [], { paymentId: "zp_other" }, "DUPLICATE_REQUEST");
    expect(resolveErrorText(duplicate)).toContain("zp_other");
    const notExpired = new ApiError("Not expired", 409, [], { expiresAt: "2026-11-11T10:00:00Z" }, "NOT_EXPIRED");
    expect(resolveErrorText(notExpired)).toMatch(/can still be paid until/);
    expect(resolveErrorText(new ApiError("Server says no", 400))).toBe("Server says no");
  });
});
