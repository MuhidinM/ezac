import { describe, expect, it } from "vitest";

import {
  addDays,
  asksLargeChangeConfirm,
  changedPriceFields,
  karatOrderProblems,
  largeChanges,
  livestockUpdate,
  manualUntilProblem,
  priceErrorField,
  type PriceInputs,
  priceUpdateBody,
  snapshotVersion,
  tooManyDecimals,
} from "@/app/(portal)/dashboard/zakat/prices/price-update";

const current = {
  goldPricePerGramEtb: { "24k": 21000, "22k": 19250, "21k": 18375, "18k": 15750, "14k": 12250 },
  silverPricePerGramEtb: 270,
  usdEtbRate: 160,
};

function inputs(overrides: Partial<PriceInputs> = {}): PriceInputs {
  return { "24k": "21000", "22k": "19250", "21k": "18375", "18k": "15750", "14k": "12250", silver: "270", usd: "160", ...overrides };
}

describe("priceUpdateBody", () => {
  it("sends only the changed karats, with the note and version", () => {
    const body = priceUpdateBody(inputs({ "22k": "19300" }), current, { note: "  Bank board  ", version: 43 });
    expect(body).toEqual({ goldPricePerGramEtb: { "22k": 19300 }, note: "Bank board", version: 43 });
  });

  it("leaves out empty fields: they keep their price", () => {
    const body = priceUpdateBody(inputs({ "14k": "", silver: "280", usd: "" }), current, { note: "Market check" });
    expect(body).toEqual({ silverPricePerGramEtb: 280, note: "Market check" });
  });

  it("adds manualUntil and confirmLargeChange when given", () => {
    const body = priceUpdateBody(inputs({ "24k": "25000" }), current, {
      note: "Market jump",
      manualUntil: "2026-11-20",
      confirmLargeChange: true,
    });
    expect(body).toMatchObject({ goldPricePerGramEtb: { "24k": 25000 }, manualUntil: "2026-11-20", confirmLargeChange: true });
  });

  it("sends every typed price when none is stored yet", () => {
    const body = priceUpdateBody(inputs({ "22k": "", usd: "" }), null, { note: "First prices" });
    expect(body.goldPricePerGramEtb).toEqual({ "24k": 21000, "21k": 18375, "18k": 15750, "14k": 12250 });
    expect(body.silverPricePerGramEtb).toBe(270);
  });
});

describe("changedPriceFields", () => {
  it("ignores unchanged, empty and invalid values", () => {
    expect(changedPriceFields(inputs({ "21k": "", "18k": "abc", silver: "271" }), current)).toEqual(["silver"]);
  });
});

describe("karatOrderProblems", () => {
  it("flags a kept karat at or above a lowered 24k", () => {
    expect(karatOrderProblems(inputs({ "24k": "19000", "22k": "" }), current)).toEqual({ "22k": expect.stringContaining("24k") });
  });

  it("accepts strictly falling prices", () => {
    expect(karatOrderProblems(inputs(), current)).toEqual({});
  });

  it("flags equal prices", () => {
    expect(karatOrderProblems(inputs({ "21k": "19250" }), current)).toHaveProperty("21k");
  });
});

describe("largeChanges", () => {
  it("lists moves above 15%", () => {
    expect(largeChanges(inputs({ silver: "320", "24k": "21500" }), current)).toEqual([{ field: "silver", before: 270, after: 320 }]);
  });

  it("is empty with no prices stored", () => {
    expect(largeChanges(inputs(), null)).toEqual([]);
  });
});

describe("snapshotVersion", () => {
  it("reads the snapshot id as a number", () => {
    expect(snapshotVersion("43")).toBe(43);
    expect(snapshotVersion(null)).toBeUndefined();
    expect(snapshotVersion("abc")).toBeUndefined();
  });
});

describe("priceErrorField", () => {
  it("maps paths and messages to form fields", () => {
    expect(priceErrorField("goldPricePerGramEtb.22k")).toBe("22k");
    expect(priceErrorField("goldPricePerGramEtb.22k must be lower than 24k")).toBe("22k");
    expect(priceErrorField("goldPricePerGramEtb")).toBe("24k");
    expect(priceErrorField("silverPricePerGramEtb")).toBe("silver");
    expect(priceErrorField("usdEtbRate")).toBe("usd");
    expect(priceErrorField("manualUntil")).toBe("manualUntil");
    expect(priceErrorField("Something else went wrong")).toBeNull();
  });
});

describe("asksLargeChangeConfirm", () => {
  it("spots the confirmLargeChange request", () => {
    expect(asksLargeChangeConfirm({ message: "Send confirmLargeChange: true", errors: [] })).toBe(true);
    expect(asksLargeChangeConfirm({ message: "Too big", errors: [{ field: "confirmLargeChange" }] })).toBe(true);
    expect(asksLargeChangeConfirm({ message: "Too big", code: "LARGE_CHANGE" })).toBe(true);
    expect(asksLargeChangeConfirm({ message: "goldPricePerGramEtb.22k must be lower than 24k" })).toBe(false);
  });
});

describe("manualUntilProblem", () => {
  it("allows empty, today and up to 90 days", () => {
    expect(manualUntilProblem("", "2026-11-11")).toBeNull();
    expect(manualUntilProblem("2026-11-11", "2026-11-11")).toBeNull();
    expect(manualUntilProblem(addDays("2026-11-11", 90), "2026-11-11")).toBeNull();
  });

  it("refuses past dates and dates beyond 90 days", () => {
    expect(manualUntilProblem("2026-11-10", "2026-11-11")).toMatch(/today/);
    expect(manualUntilProblem(addDays("2026-11-11", 91), "2026-11-11")).toMatch(/90 days/);
  });

  it("adds days across months", () => {
    expect(addDays("2026-11-11", 90)).toBe("2027-02-09");
  });
});

describe("tooManyDecimals", () => {
  it("allows up to 2 decimals", () => {
    expect(tooManyDecimals("12.5")).toBe(false);
    expect(tooManyDecimals("12.55")).toBe(false);
    expect(tooManyDecimals("12.555")).toBe(true);
  });
});

describe("livestockUpdate", () => {
  const now = { sheep: 9000, goat: 7000, cattle: 60000, camel: 180000 };

  it("sends only changed animals", () => {
    const result = livestockUpdate({ sheep: "9500", goat: "7000", cattle: "", camel: "185000" }, now);
    expect(result).toEqual({ body: { sheep: 9500, camel: 185000 }, errors: {} });
  });

  it("refuses 0, negatives and more than 2 decimals", () => {
    const result = livestockUpdate({ sheep: "0", goat: "-5", cattle: "60000.123", camel: "180000" }, now);
    expect(result.body).toEqual({});
    expect(Object.keys(result.errors).sort()).toEqual(["cattle", "goat", "sheep"]);
  });
});
