import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/errors";
import {
  SAME_APPROVER_MESSAGE,
  accountNumberProblem,
  bankChangeErrorMessage,
  bankChoices,
  bankDecisionErrorMessage,
  changedAccountFields,
  changesBankAccount,
  describePattern,
  lockedBecauseLabel,
  normaliseAccountNumber,
} from "@/lib/beneficiary/bank-change";
import type { PayoutBank } from "@/lib/beneficiary/types";

const BANKS: PayoutBank[] = [
  { code: "cbe", name: "Commercial Bank of Ethiopia", available: false, accountNumberPattern: "^\\d{6,30}$" },
  { code: "coop_bank_of_oromia", name: "Cooperative Bank of Oromia", available: true, accountNumberPattern: "^\\d{13}$" },
];

describe("lockedBecauseLabel", () => {
  it("says each lock reason in words", () => {
    expect(lockedBecauseLabel("IN_POOL")).toMatch(/pool/);
    expect(lockedBecauseLabel("ASSESSMENT_APPROVED")).toMatch(/approved/);
    expect(lockedBecauseLabel("FAST_TRACK")).toMatch(/fast-track/);
  });

  it("falls back to the code in lower case, and null for none", () => {
    expect(lockedBecauseLabel("NEW_REASON")).toBe("new reason");
    expect(lockedBecauseLabel(null)).toBeNull();
  });
});

describe("changesBankAccount", () => {
  it("is true when bank, number or holder name is in the body", () => {
    expect(changesBankAccount({ bankCode: "cbe" })).toBe(true);
    expect(changesBankAccount({ bankAccountNumber: null })).toBe(true);
    expect(changesBankAccount({ bankAccountHolderName: "A" })).toBe(true);
    expect(changesBankAccount({})).toBe(false);
  });
});

describe("accountNumberProblem", () => {
  const coop = BANKS[1];

  it("accepts a number that matches the bank's pattern, ignoring spaces and dashes", () => {
    expect(normaliseAccountNumber("1000 1234-56789")).toBe("1000123456789");
    expect(accountNumberProblem("1000 1234-56789", coop)).toBeNull();
  });

  it("refuses a number the pattern rejects, with the length in words", () => {
    expect(accountNumberProblem("123456", coop)).toMatch(/13 digits/);
  });

  it("refuses letters whatever the bank", () => {
    expect(accountNumberProblem("ACC123456", undefined)).toMatch(/digits only/);
  });

  it("leaves it to the backend when there is no usable pattern", () => {
    expect(accountNumberProblem("123", { accountNumberPattern: null })).toBeNull();
    expect(accountNumberProblem("123", { accountNumberPattern: "(" })).toBeNull();
  });

  it("describes the usual patterns", () => {
    expect(describePattern("^\\d{6,30}$")).toBe("6 to 30 digits");
    expect(describePattern("^[0-9]+$")).toMatch(/check/);
  });
});

describe("bankChoices", () => {
  it("offers only available banks", () => {
    expect(bankChoices(BANKS, null).map((choice) => choice.value)).toEqual(["coop_bank_of_oromia"]);
  });

  it("keeps the household's unavailable bank, marked and not selectable", () => {
    const choices = bankChoices(BANKS, { code: "cbe", name: "CBE" });
    expect(choices.at(-1)).toEqual({
      value: "cbe",
      label: "Commercial Bank of Ethiopia (not available for payouts)",
      disabled: true,
    });
  });

  it("uses the stored name for a bank the list no longer has", () => {
    expect(bankChoices(BANKS, { code: "other", name: "Old bank" }).at(-1)?.label).toBe(
      "Old bank (not available for payouts)",
    );
  });
});

describe("bankChangeErrorMessage", () => {
  it("explains a pending change and a locked account", () => {
    expect(bankChangeErrorMessage(new ApiError("x", 409, [], null, "BANK_CHANGE_PENDING"))).toMatch(/already waiting/);
    expect(bankChangeErrorMessage(new ApiError("x", 409, [], null, "LOCKED"))).toMatch(/locked/);
  });

  it("leaves other errors alone", () => {
    expect(bankChangeErrorMessage(new ApiError("x", 409, [], null, "VERSION_CONFLICT"))).toBeNull();
    expect(bankChangeErrorMessage(new Error("x"))).toBeNull();
  });
});

describe("bankDecisionErrorMessage", () => {
  it("explains the same approver and an already decided request", () => {
    expect(bankDecisionErrorMessage(new ApiError("x", 403, [], null, "SAME_APPROVER"))).toBe(SAME_APPROVER_MESSAGE);
    expect(bankDecisionErrorMessage(new ApiError("x", 409, [], null, "BANK_CHANGE_NOT_PENDING"))).toMatch(
      /already decided/,
    );
    expect(bankDecisionErrorMessage(new ApiError("x", 400))).toBeNull();
  });
});

describe("changedAccountFields", () => {
  it("lists the fields that differ, ignoring surrounding spaces", () => {
    const changed = changedAccountFields(
      { bankCode: "awash", accountNumber: "1000111122223", accountHolderName: "Amina Hassen" },
      { bankCode: "awash", accountNumber: "1000999988887", accountHolderName: "Amina Hassen " },
    );
    expect([...changed]).toEqual(["accountNumber"]);
  });
});
