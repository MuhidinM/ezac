import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/errors";
import {
  allowedLifecycleChoices,
  householdLoginErrorMessage,
  lifecycleBlockedReason,
} from "@/lib/beneficiary/household-actions";

describe("allowedLifecycleChoices", () => {
  it("lists only allowed moves, in our order, with labels", () => {
    const choices = allowedLifecycleChoices([
      { to: "EXITED", allowed: true },
      { to: "REINSTATED", allowed: false, reason: "Only an INACTIVE beneficiary can be reinstated" },
      { to: "INACTIVE", allowed: true },
    ]);
    expect(choices.map((choice) => choice.value)).toEqual(["INACTIVE", "EXITED"]);
    expect(choices[1]).toMatchObject({ label: "Exit", final: true });
  });

  it("labels a move we don't know yet", () => {
    expect(allowedLifecycleChoices([{ to: "ARCHIVED", allowed: true }])[0]).toMatchObject({
      label: "Archived",
      final: false,
    });
  });

  it("is empty without moves", () => {
    expect(allowedLifecycleChoices(undefined)).toEqual([]);
  });
});

describe("lifecycleBlockedReason", () => {
  const open = "Beneficiary has an open assessment; finish or cancel it first";

  it("gives the shared reason when nothing is allowed", () => {
    expect(
      lifecycleBlockedReason([
        { to: "INACTIVE", allowed: false, reason: open },
        { to: "EXITED", allowed: false, reason: open },
      ]),
    ).toBe(open);
  });

  it("gives the reason most moves share, as UAT answers for a household under assessment", () => {
    expect(
      lifecycleBlockedReason([
        { to: "INACTIVE", allowed: false, reason: open },
        { to: "GRADUATED", allowed: false, reason: open },
        { to: "EXITED", allowed: false, reason: open },
        { to: "REINSTATED", allowed: false, reason: "Only an INACTIVE beneficiary can be reinstated" },
        { to: "REOPENED", allowed: false, reason: "Only a GRADUATED or EXITED beneficiary can be reopened" },
      ]),
    ).toBe(open);
  });

  it("breaks a tie by our order of moves", () => {
    expect(
      lifecycleBlockedReason([
        { to: "EXITED", allowed: false, reason: "b" },
        { to: "INACTIVE", allowed: false, reason: "a" },
      ]),
    ).toBe("a");
  });

  it("is null when a move is allowed or nothing was sent", () => {
    expect(lifecycleBlockedReason([{ to: "INACTIVE", allowed: true }])).toBeNull();
    expect(lifecycleBlockedReason([])).toBeNull();
  });
});

describe("householdLoginErrorMessage", () => {
  it("explains an existing login and a missing phone", () => {
    expect(householdLoginErrorMessage(new ApiError("x", 409, [], null, "LOGIN_EXISTS"))).toMatch(/Reset password/);
    expect(householdLoginErrorMessage(new ApiError("x", 409, [], null, "NO_PHONE"))).toMatch(/no phone/);
  });

  it("leaves other errors to the backend's message", () => {
    expect(householdLoginErrorMessage(new ApiError("Phone taken", 409, [], null, "CONFLICT"))).toBeNull();
    expect(householdLoginErrorMessage(new ApiError("x", 403, [], null, "OUTSIDE_SCOPE"))).toBeNull();
  });
});
