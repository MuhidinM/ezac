import { describe, expect, it } from "vitest";

import { companyPayload } from "@/lib/registration/company";

describe("companyPayload", () => {
  it("passes on only the documented fields, trimmed", () => {
    const body = companyPayload({
      legalName: "  Amana Trading PLC ",
      tradingName: "Amana",
      institutionSubtype: "ngo",
      vatRegistrationNumber: "   ",
      authorityToActDocumentRequired: true,
      branchId: "b-1",
      role: "ADMIN",
    });
    expect(body).toEqual({
      legalName: "Amana Trading PLC",
      tradingName: "Amana",
      institutionSubtype: "ngo",
      authorityToActDocumentRequired: true,
    });
  });

  it("drops an unknown type and treats anything but true as false", () => {
    expect(companyPayload({ institutionSubtype: "bank", authorityToActDocumentRequired: "yes" })).toEqual({
      authorityToActDocumentRequired: false,
    });
    expect(companyPayload(null)).toEqual({ authorityToActDocumentRequired: false });
  });
});
