import { describe, expect, it } from "vitest";

import { formatCount, formatEtb } from "@/lib/backoffice/format";

const ETB = "ETB ";

describe("formatEtb", () => {
  it("puts the currency first, joined by a non-breaking space", () => {
    expect(formatEtb(1234)).toBe(`${ETB}1,234`);
    expect(formatEtb(1234).includes(" ")).toBe(false);
  });

  it("shows two decimals when there are cents and none otherwise", () => {
    expect(formatEtb(1234.5)).toBe(`${ETB}1,234.50`);
    expect(formatEtb(99.999)).toBe(`${ETB}100`);
    expect(formatEtb(12.004)).toBe(`${ETB}12`);
  });

  it("shortens large amounts only when asked", () => {
    expect(formatEtb(12_900, { compact: true })).toBe(`${ETB}12.9K`);
    expect(formatEtb(2_500_000, { compact: true })).toBe(`${ETB}2.5M`);
    expect(formatEtb(9_999, { compact: true })).toBe(`${ETB}9,999`);
    expect(formatEtb(2_500_000)).toBe(`${ETB}2,500,000`);
  });

  it("shows a dash for a missing or unusable amount", () => {
    expect(formatEtb(Number.NaN)).toBe("—");
    expect(formatEtb(Number.POSITIVE_INFINITY)).toBe("—");
  });
});

describe("formatCount", () => {
  it("groups thousands with a fixed locale", () => {
    expect(formatCount(0)).toBe("0");
    expect(formatCount(1234567)).toBe("1,234,567");
  });

  it("shortens from 10,000 when asked", () => {
    expect(formatCount(9_999, { compact: true })).toBe("9,999");
    expect(formatCount(12_900, { compact: true })).toBe("12.9K");
  });

  it("shows a dash when there is no number", () => {
    expect(formatCount(null)).toBe("—");
    expect(formatCount(undefined)).toBe("—");
    expect(formatCount(Number.NaN)).toBe("—");
  });
});
