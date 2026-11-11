import { describe, expect, it } from "vitest";

import {
  bankChangedRecently,
  confirmBody,
  fundAccountBody,
  fundAccountChanges,
  fundAccountState,
  needsNameAcknowledgement,
  payoutAuditNotes,
  payoutErrorMessage,
  payoutLimitsText,
  payoutListQuery,
  payoutTimeLeft,
  preparedByMe,
  sameStaff,
  timeLeftText,
} from "@/lib/zakat/disbursements";

describe("name check on confirm", () => {
  it("needs a tick and a reason for anything but MATCH", () => {
    expect(needsNameAcknowledgement({ nameCheck: "PARTIAL" })).toBe(true);
    expect(needsNameAcknowledgement({ nameCheck: "MISMATCH" })).toBe(true);
    expect(needsNameAcknowledgement({ nameCheck: "NOT_CHECKED" })).toBe(true);
    expect(needsNameAcknowledgement({ nameCheck: "MATCH" })).toBe(false);
  });

  it("sends no body for MATCH and {acknowledged, reason} otherwise", () => {
    expect(confirmBody({ nameCheck: "MATCH" }, "anything")).toEqual({});
    expect(confirmBody({ nameCheck: "PARTIAL" }, "  Bank drops the grandfather's name ")).toEqual({
      acknowledged: true,
      reason: "Bank drops the grandfather's name",
    });
  });
});

describe("second approver", () => {
  it("knows the payouts the signed-in admin prepared", () => {
    expect(preparedByMe({ createdBy: "u1" }, "u1")).toBe(true);
    expect(preparedByMe({ createdBy: "u1" }, "u2")).toBe(false);
    // Unknown user: don't hide anything; the server still answers 403.
    expect(preparedByMe({ createdBy: "u1" }, null)).toBe(false);
  });
});

describe("time left", () => {
  const payout = { status: "AWAITING_CONFIRMATION" as const, expiresAt: "2026-11-12T09:30:00Z" };
  const at = (iso: string) => Date.parse(iso);

  it("counts from the server's time", () => {
    expect(payoutTimeLeft(payout, at("2026-11-11T09:30:00Z"))).toBe(24 * 60 * 60_000);
    expect(payoutTimeLeft({ ...payout, status: "PROCESSING" }, at("2026-11-11T09:30:00Z"))).toBeNull();
    expect(payoutTimeLeft(payout, null)).toBeNull();
  });

  it("says it in hours and minutes", () => {
    expect(timeLeftText(23 * 60 * 60_000 + 10 * 60_000)).toBe("23 h 10 min left");
    expect(timeLeftText(40 * 60_000)).toBe("40 min left");
    expect(timeLeftText(30_000)).toBe("Less than a minute left");
    expect(timeLeftText(0)).toBeNull();
  });
});

describe("bankChangedRecently", () => {
  const now = Date.parse("2026-11-11T09:00:00Z");
  it("flags a change within 30 days", () => {
    expect(bankChangedRecently("2026-11-02T08:00:00Z", now)).toBe(true);
    expect(bankChangedRecently("2026-09-01T08:00:00Z", now)).toBe(false);
    expect(bankChangedRecently(null, now)).toBe(false);
  });
});

describe("payout errors", () => {
  const limits = { min: 0.01, max: 1000000, dailyCap: 5000000, usedToday: 4990000 };

  it("puts the limits in words", () => {
    const text = payoutLimitsText(limits);
    expect(text).toMatch(/between .*0\.01.* and .*1,000,000/);
    expect(text).toMatch(/10,000.* is left/);
    expect(payoutLimitsText(null)).toBeNull();
  });

  it("keeps the backend's sentence for AMOUNT_OUT_OF_RANGE and adds the limits", () => {
    const text = payoutErrorMessage("AMOUNT_OUT_OF_RANGE", "amountEtb must be at least 0.01", limits);
    expect(text.startsWith("The amount must be at least 0.01.")).toBe(true);
    expect(text).toMatch(/Today's limit/);
  });

  it("explains the day's cap", () => {
    expect(payoutErrorMessage("DAILY_CAP_REACHED", "cap", limits)).toMatch(/^This payout would go over today's payout limit\. /);
  });

  it("has words for the new prepare and confirm codes", () => {
    for (const code of ["FUND_NOT_ALLOWED", "FUND_ACCOUNT_NOT_VERIFIED", "BANK_CHANGE_PENDING", "SAME_APPROVER", "PAYOUT_EXPIRED"]) {
      expect(payoutErrorMessage(code, "raw")).not.toBe("raw");
    }
    expect(payoutErrorMessage(null, "Something else")).toBe("Something else");
  });
});

describe("payoutListQuery", () => {
  const base = { status: "", rail: "", fund: "", q: "", beneficiaryId: "", needsAction: "", page: 1 };

  it("sends the filters, the search and the household", () => {
    expect(payoutListQuery({ ...base, status: "PROCESSING", q: " FT26 ", beneficiaryId: "41" }, "from=a&to=b", 20)).toBe(
      "from=a&to=b&status=PROCESSING&beneficiaryId=41&q=FT26&page=1&limit=20",
    );
  });

  it("leaves out the dates and filters for needsAction", () => {
    expect(payoutListQuery({ ...base, status: "FAILED", needsAction: "true", page: 2 }, "from=a&to=b", 20)).toBe(
      "needsAction=true&page=2&limit=20",
    );
  });
});

describe("payoutAuditNotes", () => {
  it("flags one person preparing and paying", () => {
    expect(sameStaff("u1", "u1")).toBe(true);
    expect(sameStaff("u1", null)).toBe(false);
    expect(payoutAuditNotes({ createdBy: "u1", confirmedBy: "u1", nameCheck: "MATCH", confirmedAt: "2026-11-05T10:00:00Z" })).toEqual([
      "Prepared and paid by the same person.",
    ]);
  });

  it("records a name check that was overridden, with the reason", () => {
    expect(
      payoutAuditNotes({ createdBy: "u1", confirmedBy: "u2", nameCheck: "PARTIAL", nameCheckReason: "Short name", confirmedAt: "x" }),
    ).toEqual(["Paid although the names only partly matched. Reason given: Short name"]);
    expect(payoutAuditNotes({ createdBy: "u1", confirmedBy: "u2", nameCheck: "NOT_CHECKED", confirmedAt: "x" })).toEqual([
      "Paid without a name from the bank.",
    ]);
  });

  it("says nothing for a prepared payout", () => {
    expect(payoutAuditNotes({ createdBy: "u1", nameCheck: "MISMATCH" })).toEqual([]);
  });
});

describe("fund accounts", () => {
  const zakat = {
    fund: "ZAKAT" as const,
    label: "Zakat",
    accountNumber: "*********6789",
    accountName: "Zakat Fund",
    bankHolderName: "EIASC ZAKAT FUND",
    ready: true,
  };

  it("lists each changed field and marks a cleared account number", () => {
    expect(fundAccountChanges(zakat, { accountNumber: " ", accountName: "Zakat Fund" })).toEqual([
      { field: "accountNumber", from: "*********6789", to: "", cleared: true },
    ]);
    expect(fundAccountChanges(zakat, { accountNumber: "*********6789 ", accountName: "Zakat Fund" })).toEqual([]);
  });

  it("sends only the edited fund, keeps an unchanged masked number and sends the version", () => {
    expect(fundAccountBody("zakat", zakat, { accountNumber: "*********6789", accountName: "New name" }, 4)).toEqual({
      zakat: { accountName: "New name" },
      version: 4,
    });
    expect(fundAccountBody("zakat", zakat, { accountNumber: "", accountName: "Zakat Fund" }, null)).toEqual({
      zakat: { accountNumber: "", accountName: "Zakat Fund" },
    });
    expect(fundAccountBody("waqf", { ...zakat, fund: "WAQF", accountNumber: null }, { accountNumber: "1000222333", accountName: "" }, 5)).toEqual({
      waqf: { accountNumber: "1000222333", accountName: "" },
      version: 5,
    });
  });

  it("tells verified, unverified and unset apart", () => {
    expect(fundAccountState(zakat).label).toBe("Verified");
    expect(fundAccountState({ ...zakat, ready: false }).label).toBe("Not verified");
    expect(fundAccountState({ ready: false, accountNumber: null }).label).toBe("Not set");
  });
});
