import { describe, expect, it } from "vitest";

import { roundCoordinate, sharedMapLink } from "@/lib/backoffice/gps";
import { whitelistBlocker, whitelistCaution } from "@/lib/backoffice/whitelist";

describe("whitelist eligibility", () => {
  const household = {
    beneficiaryType: "individual" as const,
    verificationStatus: "pending" as const,
    lifecycleStatus: "ASSESSED" as const,
    duplicateStatus: "NONE" as const,
    whitelistEffect: null,
  };

  it("lets an ordinary household be picked", () => {
    expect(whitelistBlocker(household)).toBeNull();
    expect(whitelistCaution(household)).toBeNull();
  });

  it("says why the backend would refuse a household", () => {
    expect(whitelistBlocker({ ...household, whitelistEffect: "PRIORITY" })).toBe("Already whitelisted");
    expect(whitelistBlocker({ ...household, beneficiaryType: "institution" })).toBe("Institution");
    expect(whitelistBlocker({ ...household, duplicateStatus: "CONFIRMED_DUPLICATE" })).toBe("Confirmed duplicate");
    expect(whitelistBlocker({ ...household, verificationStatus: "rejected" })).toBe("Registration rejected");
    expect(whitelistBlocker({ ...household, lifecycleStatus: "EXITED" })).toBe("Exited");
  });

  it("flags a possible duplicate without blocking it", () => {
    const possible = { ...household, duplicateStatus: "POTENTIAL" as const };
    expect(whitelistBlocker(possible)).toBeNull();
    expect(whitelistCaution(possible)).toBe("Possible duplicate");
  });
});

describe("GPS precision", () => {
  it("records no finer than about 1 m", () => {
    expect(roundCoordinate(9.0054321)).toBe(9.00543);
    expect(roundCoordinate(38.7612349)).toBe(38.76123);
    expect(roundCoordinate(null)).toBeNull();
    expect(roundCoordinate(Number.NaN)).toBeNull();
  });

  it("shares only the area (4 decimals) with the outside map", () => {
    expect(sharedMapLink(9.0054321, 38.7612349)).toBe(
      "https://www.openstreetmap.org/?mlat=9.0054&mlon=38.7612#map=16/9.0054/38.7612",
    );
    expect(sharedMapLink(9.1, null)).toBeNull();
  });
});
