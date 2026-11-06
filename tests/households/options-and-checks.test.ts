import { describe, expect, it } from "vitest";

import { roundCoordinate, sharedMapLink } from "@/lib/backoffice/gps";
import { BANK_CHOICES, bankOptionsFor, isValidAccountNumber, labelFor, BANKS } from "@/lib/backoffice/options";
import { whitelistBlocker, whitelistCaution } from "@/lib/backoffice/whitelist";
import { passwordSetNotice, registeredNotice } from "@/lib/registration/notices";

describe("bank options", () => {
  it("offers Global Bank Ethiopia once, not its pre-2022 Debub Global code", () => {
    const values = BANK_CHOICES.map((option) => option.value);
    expect(values).toContain("global_bank");
    expect(values).not.toContain("debub_global");
    expect(bankOptionsFor("cbe")).toBe(BANK_CHOICES);
  });

  it("still shows the old code for an account saved with it", () => {
    expect(bankOptionsFor("debub_global").map((option) => option.value)).toContain("debub_global");
    expect(labelFor(BANKS, "debub_global")).toMatch(/Global Bank Ethiopia/);
  });
});

describe("isValidAccountNumber", () => {
  it("accepts 6–30 digits, spaces and dashes aside", () => {
    expect(isValidAccountNumber("1000123456789")).toBe(true);
    expect(isValidAccountNumber("1000 1234-5678")).toBe(true);
    expect(isValidAccountNumber("123456")).toBe(true);
  });

  it("refuses short, long or non-digit numbers", () => {
    expect(isValidAccountNumber("12345")).toBe(false);
    expect(isValidAccountNumber("1".repeat(31))).toBe(false);
    expect(isValidAccountNumber("ACC-123456")).toBe(false);
  });
});

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

describe("registration notices", () => {
  it("names the household and its BIN", () => {
    expect(registeredNotice("Abebe Kebede", "EZW-QSKU-KKPG")).toBe(
      "Abebe Kebede (BIN EZW-QSKU-KKPG) is registered. The next step is the household assessment.",
    );
    expect(passwordSetNotice(" ", null)).toBe(
      "The household is registered and the login password is set. The next step is the household assessment.",
    );
  });
});
