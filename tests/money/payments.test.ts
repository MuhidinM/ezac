import { describe, expect, it } from "vitest";

import { QR_CHECK_WINDOW_MS, checkCountsForNotPaid, qrNotPaidBlock } from "@/lib/zakat/payments";

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
