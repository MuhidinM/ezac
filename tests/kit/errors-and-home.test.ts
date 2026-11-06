import { describe, expect, it } from "vitest";

import { ApiError, asksToSignInAgain, errorReference, isSessionEnded } from "@/lib/api/errors";
import { defaultDashboardPath } from "@/lib/auth/constants";

describe("defaultDashboardPath", () => {
  it("sends branch officers to their branch and other staff to Overview", () => {
    expect(defaultDashboardPath(["BRANCH"])).toBe("/dashboard/branch");
    expect(defaultDashboardPath(["ADMIN"])).toBe("/dashboard");
    expect(defaultDashboardPath(["FIELD_OFFICER"])).toBe("/dashboard");
    // Branch plus a head-office role is head-office staff.
    expect(defaultDashboardPath(["branch", "ADMIN"])).toBe("/dashboard");
    expect(defaultDashboardPath([])).toBe("/dashboard");
  });
});

describe("session-ended helpers", () => {
  it("knows a 401 from other failures", () => {
    expect(isSessionEnded(new ApiError("Your session has ended. Sign in again.", 401))).toBe(true);
    expect(isSessionEnded(new ApiError("No access", 403))).toBe(false);
    expect(isSessionEnded(new Error("Your session has ended."))).toBe(false);
  });

  it("spots the sign-in-again message in plain text", () => {
    expect(asksToSignInAgain("Your session has ended. Sign in again.")).toBe(true);
    expect(asksToSignInAgain("Password updated. Please sign in again.")).toBe(true);
    expect(asksToSignInAgain("Something went wrong.")).toBe(false);
    expect(asksToSignInAgain(null)).toBe(false);
  });

  it("gives a support reference only for failures on our side", () => {
    expect(errorReference(new ApiError("Down", 502, [], null, null, "req-1"))).toBe("req-1");
    expect(errorReference(new ApiError("Bad input", 400, [], null, null, "req-2"))).toBeNull();
    expect(errorReference(new ApiError("Down", 503))).toBeNull();
    expect(errorReference(new Error("x"))).toBeNull();
  });
});
