import { describe, expect, it } from "vitest";

import { fixedCodeOnLiveBank, modeLabel, modeWarning, railMode } from "@/lib/zakat/payment-mode";

describe("railMode", () => {
  it("counts only an explicit live as live", () => {
    expect(railMode("live")).toBe("live");
    expect(railMode(" LIVE ")).toBe("live");
  });

  it("treats sandbox, missing and unknown values as test", () => {
    expect(railMode("sandbox")).toBe("test");
    expect(railMode(null)).toBe("test");
    expect(railMode(undefined)).toBe("test");
    expect(railMode("")).toBe("test");
    expect(railMode("production")).toBe("test");
  });
});

describe("modeLabel", () => {
  it("never reads Live for an unknown value", () => {
    expect(modeLabel("live")).toBe("Live");
    expect(modeLabel("sandbox")).toBe("Sandbox");
    expect(modeLabel(null)).toBe("Not set (treated as test)");
    expect(modeLabel("prod")).toBe("“prod” (treated as test)");
  });
});

describe("modeWarning", () => {
  const live = { bankMode: "live", ethqrMode: "live", defaultOtpEnabled: false };

  it("says nothing when every rail the screen uses is live", () => {
    expect(modeWarning(live, ["bank", "qr", "otp"])).toEqual({ test: false, reasons: [] });
  });

  it("only looks at the rails the screen uses", () => {
    expect(modeWarning({ ...live, ethqrMode: "sandbox" }, ["bank"]).test).toBe(false);
    expect(modeWarning({ ...live, ethqrMode: "sandbox" }, ["qr"]).test).toBe(true);
  });

  it("explains a sandbox and an unknown mode", () => {
    expect(modeWarning({ ...live, bankMode: "sandbox" }, ["bank"]).reasons[0]).toMatch(/sandbox/);
    expect(modeWarning({ ...live, bankMode: null }, ["bank"]).reasons[0]).toMatch(/not set/);
  });

  it("notes the fixed confirmation code without calling it test mode", () => {
    expect(modeWarning({ ...live, defaultOtpEnabled: true }, ["bank", "qr", "otp"])).toEqual({
      test: false,
      reasons: ["The fixed test confirmation code is on, so Coop account payments are not confirmed by SMS."],
    });
  });
});

describe("fixedCodeOnLiveBank", () => {
  it("flags the fixed code only with a live bank connection", () => {
    expect(fixedCodeOnLiveBank({ bankMode: "live", defaultOtpEnabled: true })).toBe(true);
    expect(fixedCodeOnLiveBank({ bankMode: "sandbox", defaultOtpEnabled: true })).toBe(false);
    expect(fixedCodeOnLiveBank({ bankMode: "live", defaultOtpEnabled: false })).toBe(false);
  });
});
