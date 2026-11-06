import { describe, expect, it } from "vitest";

import { isValidEthiopianPhone, normalizePhoneToE164, phoneSearchTerm } from "@/lib/registration/phone";

describe("normalizePhoneToE164", () => {
  it("reads the local, short and international forms of a mobile number", () => {
    expect(normalizePhoneToE164("0911223344")).toBe("+251911223344");
    expect(normalizePhoneToE164("0911 22 33 44")).toBe("+251911223344");
    expect(normalizePhoneToE164("911223344")).toBe("+251911223344");
    expect(normalizePhoneToE164("+251 911-223-344")).toBe("+251911223344");
    expect(normalizePhoneToE164("251911223344")).toBe("+251911223344");
    expect(normalizePhoneToE164("0711223344")).toBe("+251711223344");
  });

  it("never pads a short or odd input into a number nobody typed", () => {
    expect(normalizePhoneToE164("12345")).toBe("12345");
    expect(normalizePhoneToE164("  12345 ")).toBe("12345");
    expect(normalizePhoneToE164("+44 20 7946 0958")).toBe("+44 20 7946 0958");
    expect(normalizePhoneToE164("")).toBe("");
  });
});

describe("isValidEthiopianPhone", () => {
  it("accepts Ethiopian mobile numbers in any form", () => {
    expect(isValidEthiopianPhone("0911223344")).toBe(true);
    expect(isValidEthiopianPhone("+251711223344")).toBe(true);
    expect(isValidEthiopianPhone("911 223 344")).toBe(true);
  });

  it("refuses short, landline and foreign numbers", () => {
    expect(isValidEthiopianPhone("12345")).toBe(false);
    // Addis Ababa landline (011…) is not a mobile login.
    expect(isValidEthiopianPhone("0111223344")).toBe(false);
    expect(isValidEthiopianPhone("+44 20 7946 0958")).toBe(false);
    expect(isValidEthiopianPhone("")).toBe(false);
  });
});

describe("phoneSearchTerm", () => {
  it("turns a local mobile number into the stored +251 form and leaves other text alone", () => {
    expect(phoneSearchTerm("0911-223-344")).toBe("+251911223344");
    expect(phoneSearchTerm(" Abebe ")).toBe("Abebe");
    expect(phoneSearchTerm("EZW-1234")).toBe("EZW-1234");
  });
});
