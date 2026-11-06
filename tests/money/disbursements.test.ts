import { describe, expect, it } from "vitest";

import {
  fundAccountChanges,
  namesAgree,
  needsNameAcknowledgement,
  payoutAuditNotes,
  sameStaff,
  weakMatchReason,
} from "@/lib/zakat/disbursements";

describe("namesAgree", () => {
  it("is true when every word of the shorter name is in the longer one", () => {
    expect(namesAgree("Ahmed Mohammed", "AHMED MOHAMMED ALI")).toBe(true);
    expect(namesAgree("Mohammed, Ahmed", "Ahmed Mohammed")).toBe(true);
  });

  it("is false when a word is missing", () => {
    expect(namesAgree("Fatuma Ahmed", "Ahmed Mohammed Ali")).toBe(false);
  });

  it("is null when there is nothing to compare", () => {
    expect(namesAgree("", "Ahmed")).toBeNull();
    expect(namesAgree(null, "Ahmed")).toBeNull();
  });
});

describe("weakMatchReason", () => {
  const match = { nameCheck: "MATCH" as const, accountHolderName: "Ahmed Mohammed", verifiedName: "AHMED MOHAMMED ALI" };

  it("accepts a match that also agrees with the registered name", () => {
    expect(weakMatchReason(match, "Ahmed Mohammed Ali")).toBeNull();
  });

  it("flags a one-word name on file", () => {
    expect(weakMatchReason({ ...match, accountHolderName: "Ahmed" }, "Ahmed Mohammed Ali")).toMatch(/fewer than two words/);
    expect(weakMatchReason({ ...match, accountHolderName: "" }, "Ahmed Mohammed Ali")).toMatch(/fewer than two words/);
  });

  it("flags a bank name that doesn't agree with the registered name (a relative's account)", () => {
    expect(weakMatchReason(match, "Fatuma Ahmed Mohammed")).toMatch(/registered name/);
  });

  it("only applies to MATCH", () => {
    expect(weakMatchReason({ ...match, nameCheck: "MISMATCH" }, "Someone Else")).toBeNull();
  });
});

describe("needsNameAcknowledgement", () => {
  const base = { accountHolderName: "Ahmed Mohammed", verifiedName: "AHMED MOHAMMED" };

  it("needs a tick for anything short of a clear match", () => {
    expect(needsNameAcknowledgement({ ...base, nameCheck: "MISMATCH" }, "Ahmed Mohammed")).toBe(true);
    expect(needsNameAcknowledgement({ ...base, nameCheck: "NOT_CHECKED" }, "Ahmed Mohammed")).toBe(true);
    expect(needsNameAcknowledgement({ ...base, nameCheck: "MATCH" }, "Fatuma Ali")).toBe(true);
  });

  it("needs none for a clear match", () => {
    expect(needsNameAcknowledgement({ ...base, nameCheck: "MATCH" }, "Ahmed Mohammed")).toBe(false);
    // No registered name to compare: the server's match stands.
    expect(needsNameAcknowledgement({ ...base, nameCheck: "MATCH" }, null)).toBe(false);
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

  it("records a name check that was overridden", () => {
    const notes = payoutAuditNotes({ createdBy: "u1", confirmedBy: "u2", nameCheck: "MISMATCH", confirmedAt: "2026-11-05T10:00:00Z" });
    expect(notes).toEqual(["Paid although the names differed: the person who paid ticked that they compared them."]);
    expect(payoutAuditNotes({ createdBy: "u1", confirmedBy: "u2", nameCheck: "NOT_CHECKED", confirmedAt: "x" })).toEqual([
      "Paid without a name check from the bank.",
    ]);
  });

  it("says nothing for a prepared payout by one person", () => {
    expect(payoutAuditNotes({ createdBy: "u1", nameCheck: "MISMATCH" })).toEqual([]);
  });
});

describe("fundAccountChanges", () => {
  const before = {
    zakat: { fund: "ZAKAT" as const, label: "Zakat", accountNumber: "1000111", accountName: "Zakat Fund", bankHolderName: null, ready: true },
    waqf: { fund: "WAQF" as const, label: "Awqaf", accountNumber: null, accountName: null, bankHolderName: null, ready: false },
  };

  it("lists each changed field and marks a cleared account number", () => {
    expect(
      fundAccountChanges(before, {
        zakat: { accountNumber: " ", accountName: "Zakat Fund" },
        waqf: { accountNumber: "1000222", accountName: "" },
      }),
    ).toEqual([
      { fund: "ZAKAT", field: "accountNumber", from: "1000111", to: "", cleared: true },
      { fund: "WAQF", field: "accountNumber", from: "", to: "1000222", cleared: false },
    ]);
  });

  it("is empty when nothing changed (spaces don't count)", () => {
    expect(
      fundAccountChanges(before, { zakat: { accountNumber: "1000111 ", accountName: "Zakat Fund" }, waqf: { accountNumber: "", accountName: "" } }),
    ).toEqual([]);
  });
});
